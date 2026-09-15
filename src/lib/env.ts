/**
 * Environment resolution. The app runs in one of two data modes:
 *
 *  - "supabase": NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY set.
 *    Auth, database and storage go through Supabase (production).
 *  - "local":    no Supabase configured. A file-backed store + demo session
 *    are used so the product runs end-to-end with zero configuration
 *    (development / preview only — never enable in production).
 */
export type DataMode = "supabase" | "local";

export function getDataMode(): DataMode {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return "supabase";
  if (process.env.ACTIV_ALLOW_LOCAL_MODE === "0") {
    throw new Error("Supabase is not configured and local mode is disabled (ACTIV_ALLOW_LOCAL_MODE=0).");
  }
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
