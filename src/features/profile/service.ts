import "server-only";
import type { DataStore } from "@/services/data/store";
import type { SessionUser } from "@/services/auth/session";
import type { Profile } from "@/types/domain";

/** Load the profile, creating it on first sight (covers OAuth users without the DB trigger). */
export async function ensureProfile(store: DataStore, user: SessionUser): Promise<Profile> {
  const existing = await store.getProfile(user.id);
  if (existing) return existing;
  return store.upsertProfile(user.id, { email: user.email, displayName: user.name, avatarUrl: user.avatarUrl });
}
