"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDataMode } from "@/lib/env";
import { track } from "@/lib/analytics";
import { getStore } from "@/services/data";
import { LOCAL_SESSION_COOKIE, encodeLocalSession, localUserIdForEmail } from "@/services/auth/session";
import { createSupabaseServerClient } from "@/services/supabase/server";

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`;
}

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/app";
}

async function startLocalSession(email: string) {
  const id = localUserIdForEmail(email);
  const store = await getStore();
  const existing = await store.getProfile(id);
  if (!existing) await store.upsertProfile(id, { email });
  const jar = await cookies();
  jar.set(LOCAL_SESSION_COOKIE, encodeLocalSession(id, email), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return existing;
}

export async function signInWithPassword(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  const next = safeNext(formData.get("next"));

  if (getDataMode() === "local") {
    const existing = await startLocalSession(parsed.data.email);
    redirect(existing?.onboardingCompleted ? next : "/onboarding");
  }

  const sb = await createSupabaseServerClient();
  const { error } = await sb.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (user) {
    const store = await getStore();
    const profile = await store.getProfile(user.id);
    if (profile && !profile.onboardingCompleted) redirect("/onboarding");
  }
  redirect(next);
}

export async function signUpWithPassword(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  const parsed = credentials.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };

  if (getDataMode() === "local") {
    await startLocalSession(parsed.data.email);
    track("signup_completed", { mode: "local" });
    redirect("/onboarding");
  }

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await origin()}/auth/callback?next=/onboarding` },
  });
  if (error) return { ok: false, error: friendlyAuthError(error.message) };
  track("signup_completed", { mode: "supabase" });
  if (data.session) redirect("/onboarding");
  return { ok: true, message: "Check your inbox — we sent you a confirmation link." };
}

export async function signInWithOAuth(provider: "google" | "apple", next = "/app"): Promise<AuthResult> {
  if (getDataMode() === "local") {
    await startLocalSession(`${provider}.demo@aktiv.local`);
    redirect("/onboarding");
  }
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(safeNext(next))}` },
  });
  if (error || !data.url) return { ok: false, error: error?.message ?? "Could not start sign-in." };
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  if (getDataMode() === "local") {
    const jar = await cookies();
    jar.delete(LOCAL_SESSION_COOKIE);
  } else {
    const sb = await createSupabaseServerClient();
    await sb.auth.signOut();
  }
  redirect("/");
}

function friendlyAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Wrong email or password.";
  if (m.includes("already registered")) return "An account with this email already exists. Sign in instead.";
  if (m.includes("email not confirmed")) return "Please confirm your email first — check your inbox.";
  if (m.includes("rate limit")) return "Too many attempts. Try again in a minute.";
  return msg;
}
