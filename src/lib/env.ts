/**
 * Environment resolution. The app runs in one of two data modes:
 *
 *  - "supabase": the default. Auth, database and storage go through Supabase
 *    (project from env vars or the built-in public config).
 *  - "local":    ACTIV_DATA_MODE=local. A file-backed store + demo session
 *    for development without network access. Refused on Vercel.
 */
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config";

export type DataMode = "supabase" | "local";

export function getDataMode(): DataMode {
  // Explicit opt-in to the file-backed demo store (development only).
  if (process.env.ACTIV_DATA_MODE === "local") {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      throw new Error("Local demo mode cannot run on Vercel. Unset ACTIV_DATA_MODE.");
    }
    return "local";
  }
  if (SUPABASE_URL && SUPABASE_ANON_KEY) return "supabase";
  return "local";
}

export function isLocalMode(): boolean {
  return getDataMode() === "local";
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export const APP_NAME = "АКТИВ";
export const APP_NAME_LATIN = "Aktiv";
export const APP_TAGLINE = "Personal Asset OS";
