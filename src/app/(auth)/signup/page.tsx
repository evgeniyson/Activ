import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { isLocalMode } from "@/lib/env";

export const metadata: Metadata = { title: "Регистрация" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm mode="signup" next={next} localMode={isLocalMode()} />;
}
