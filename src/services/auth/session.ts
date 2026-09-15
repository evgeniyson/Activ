import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDataMode } from "@/lib/env";
import { stableId } from "@/lib/hash";
import { createSupabaseServerClient } from "@/services/supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

export const LOCAL_SESSION_COOKIE = "activ_local_session";

/** Current authenticated user or null. Safe to call from Server Components. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  if (getDataMode() === "supabase") {
    const sb = await createSupabaseServerClient();
    const { data } = await sb.auth.getUser();
    const u = data.user;
    if (!u) return null;
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
    return {
      id: u.id,
      email: u.email ?? null,
      name: (meta.full_name as string) ?? (meta.name as string) ?? null,
      avatarUrl: (meta.avatar_url as string) ?? null,
    };
  }
  const store = await cookies();
  const raw = store.get(LOCAL_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as { id: string; email: string };
    if (!parsed.id) return null;
    return { id: parsed.id, email: parsed.email ?? null, name: null, avatarUrl: null };
  } catch {
    return null;
  }
}

/** Redirects to /login when unauthenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function localUserIdForEmail(email: string): string {
  // Deterministic UUID-shaped id so the local store behaves like Supabase.
  const h = stableId("u", email.trim().toLowerCase()).slice(2);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(1, 4)}-${h.slice(4, 16)}`;
}

export function encodeLocalSession(id: string, email: string): string {
  return Buffer.from(JSON.stringify({ id, email }), "utf8").toString("base64url");
}
