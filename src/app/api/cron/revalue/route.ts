import { NextResponse, type NextRequest } from "next/server";
import { getDataMode } from "@/lib/env";
import { SUPABASE_URL } from "@/lib/supabase-config";
import { createClient } from "@supabase/supabase-js";
import { SupabaseStore } from "@/services/data/supabase-store";
import { revalueAsset } from "@/features/assets/service";
import { generateNotifications } from "@/features/notifications/service";
import { buildValuationRequest } from "@/features/assets/service";
import { getValuationEngine, type ValuationResult } from "@/valuation";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * Daily re-valuation job (Vercel Cron → GET /api/cron/revalue).
 * Requires CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY. Walks every profile,
 * re-values active assets and runs the notification rules. Dashboard loads
 * also re-value lazily, so this job only makes histories continuous for
 * users who haven't opened the app.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (getDataMode() !== "supabase" || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Cron requires Supabase + service role key." }, { status: 501 });
  }
  const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const store = new SupabaseStore(admin);
  const { data: profiles, error } = await admin.from("profiles").select("id").limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const engine = getValuationEngine();
  let assetsProcessed = 0;
  for (const p of profiles ?? []) {
    const profile = await store.getProfile(p.id);
    if (!profile) continue;
    const assets = await store.listAssets(p.id, { status: "active" });
    const valuations = new Map<string, ValuationResult | null>();
    for (const asset of assets) {
      const { result } = await revalueAsset(store, p.id, asset, profile);
      valuations.set(asset.id, result ?? (await engine.value(buildValuationRequest(asset, profile))));
      assetsProcessed++;
    }
    await generateNotifications(store, p.id, profile, assets, valuations);
  }
  return NextResponse.json({ ok: true, users: profiles?.length ?? 0, assetsProcessed });
}
