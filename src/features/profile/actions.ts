"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { CURRENCY_CODES } from "@/lib/currency";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { MARKET_REGIONS, type CurrencyCode, type MarketRegion } from "@/types/domain";
import { ensureProfile } from "./service";
import type { ActionResult } from "@/features/assets/actions";

const profileSchema = z.object({
  displayName: z.string().trim().max(80).optional(),
  country: z.string().trim().max(60).optional(),
  preferredCurrency: z.enum(CURRENCY_CODES as [string, ...string[]]).optional(),
  marketRegion: z.enum(MARKET_REGIONS).optional(),
  notificationPrefs: z
    .object({ priceChanges: z.boolean(), sellOpportunities: z.boolean(), warrantyAlerts: z.boolean(), monthlyReport: z.boolean() })
    .optional(),
});

export async function updateProfileAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const store = await getStore();
  await ensureProfile(store, user);
  const d = parsed.data;
  await store.upsertProfile(user.id, {
    displayName: d.displayName === undefined ? undefined : d.displayName || null,
    country: d.country === undefined ? undefined : d.country || null,
    preferredCurrency: d.preferredCurrency as CurrencyCode | undefined,
    marketRegion: d.marketRegion as MarketRegion | undefined,
    notificationPrefs: d.notificationPrefs,
  });
  revalidatePath("/app", "layout");
  return { ok: true, data: undefined };
}

export async function completeOnboardingAction(next: "scan" | "dashboard" = "dashboard"): Promise<void> {
  const user = await requireUser();
  const store = await getStore();
  await ensureProfile(store, user);
  await store.upsertProfile(user.id, { onboardingCompleted: true });
  track("onboarding_completed");
  revalidatePath("/app", "layout");
  redirect(next === "scan" ? "/app/assets/new?method=camera" : "/app");
}
