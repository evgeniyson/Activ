import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Onboarding } from "@/components/onboarding/onboarding";
import { ensureProfile } from "@/features/profile/service";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  if (profile.onboardingCompleted) redirect("/app");
  return <Onboarding />;
}
