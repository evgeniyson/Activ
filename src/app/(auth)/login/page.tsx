import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { isLocalMode } from "@/lib/env";

export const metadata: Metadata = { title: "Вход" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  return <AuthForm mode="login" next={next} initialError={error} localMode={isLocalMode()} />;
}
