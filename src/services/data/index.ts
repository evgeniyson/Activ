import "server-only";
import { getDataMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/services/supabase/server";
import { LocalStore } from "./local-store";
import type { DataStore } from "./store";
import { SupabaseStore } from "./supabase-store";

let local: LocalStore | null = null;

/** Resolve the data store for the current request. */
export async function getStore(): Promise<DataStore> {
  if (getDataMode() === "supabase") {
    return new SupabaseStore(await createSupabaseServerClient());
  }
  if (!local) local = new LocalStore();
  return local;
}

export type { DataStore } from "./store";
