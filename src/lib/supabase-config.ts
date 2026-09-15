/**
 * Public Supabase project configuration.
 *
 * The project URL and the publishable (anon) key are designed to ship in
 * client bundles — Row Level Security is what protects the data. Environment
 * variables take precedence so previews/staging can point elsewhere; the
 * defaults below are the production project so a fresh deployment works
 * without any dashboard configuration. Secrets (service role, Anthropic)
 * are never defaulted here.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jffcllgjhzaagcvkrlkg.supabase.co";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_VtbmSiZp6oV30gBgeKTMTQ_V3KOD8g7";
