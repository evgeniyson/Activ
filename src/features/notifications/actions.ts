"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";

export async function markNotificationsReadAction(ids: string[] | "all"): Promise<void> {
  const user = await requireUser();
  const store = await getStore();
  await store.markNotificationsRead(user.id, ids);
  revalidatePath("/app", "layout");
}
