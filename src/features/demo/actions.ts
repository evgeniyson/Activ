"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { ensureProfile } from "@/features/profile/service";
import { seedDemoPortfolio } from "./seed";

export async function loadDemoPortfolioAction(): Promise<void> {
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  await seedDemoPortfolio(store, user.id, profile);
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function deleteAllDataAction(): Promise<void> {
  const user = await requireUser();
  const store = await getStore();
  await store.deleteAllUserData(user.id);
  revalidatePath("/app", "layout");
  redirect("/app");
}
