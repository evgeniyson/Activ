import { NextResponse, type NextRequest } from "next/server";
import { getDataMode } from "@/lib/env";
import { getStore } from "@/services/data";
import { createSupabaseServerClient } from "@/services/supabase/server";

/** OAuth / magic-link callback: exchanges the code for a session. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/app";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/app";

  if (getDataMode() === "supabase" && code) {
    const sb = await createSupabaseServerClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (user) {
      const store = await getStore();
      const profile = await store.getProfile(user.id);
      if (!profile) await store.upsertProfile(user.id, { email: user.email ?? null });
      if (!profile?.onboardingCompleted) return NextResponse.redirect(new URL("/onboarding", url.origin));
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
