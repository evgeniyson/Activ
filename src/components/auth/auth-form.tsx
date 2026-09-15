"use client";

import Link from "next/link";
import { useActionState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signInWithOAuth, signInWithPassword, signUpWithPassword, type AuthResult } from "@/features/auth/actions";

export function AuthForm({ mode, next, initialError, localMode }: { mode: "login" | "signup"; next?: string; initialError?: string; localMode: boolean }) {
  const action = mode === "login" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(action, initialError ? { ok: false, error: initialError } : null);
  const [oauthPending, startOauth] = useTransition();

  return (
    <div>
      <span className="label-mono text-gray">{mode === "login" ? "С возвращением" : "Начнём"}</span>
      <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">{mode === "login" ? "Войти." : "Создать аккаунт."}</h1>
      <p className="mt-2 text-[15px] text-gray">{mode === "login" ? "Ваш портфель ждёт." : "Бесплатно на время беты. Карта не нужна."}</p>

      {localMode ? <p className="mt-5 border border-dashed border-hair-strong px-3 py-2 text-[12px] text-gray">Локальный демо-режим: подойдут любые email и пароль. Подключите Supabase для настоящих аккаунтов.</p> : null}

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? "/app"} />
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" inputMode="email" />
        </Field>
        <Field label="Пароль" htmlFor="password" hint={mode === "signup" ? "от 8 символов" : undefined}>
          <Input id="password" name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="••••••••" />
        </Field>
        {state && !state.ok ? (
          <p className="text-sm font-medium text-orange-3" role="alert">
            {state.error}
          </p>
        ) : null}
        {state && state.ok && state.message ? (
          <p className="border border-ink px-3 py-2 text-sm" role="status">
            {state.message}
          </p>
        ) : null}
        <Button type="submit" size="lg" loading={pending} className="mt-1">
          {mode === "login" ? "Войти" : "Создать аккаунт"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-hair" />
        <span className="label-mono text-gray-2">или</span>
        <span className="h-px flex-1 bg-hair" />
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          loading={oauthPending}
          onClick={() =>
            startOauth(async () => {
              const r = await signInWithOAuth("google", next);
              if (r && !r.ok) alert(r.error);
            })
          }
        >
          <GoogleGlyph /> Продолжить с Google
        </Button>
        {process.env.NEXT_PUBLIC_AUTH_APPLE === "1" ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            loading={oauthPending}
            onClick={() =>
              startOauth(async () => {
                const r = await signInWithOAuth("apple", next);
                if (r && !r.ok) alert(r.error);
              })
            }
          >
             Продолжить с Apple
          </Button>
        ) : null}
      </div>

      <p className="mt-6 text-sm text-gray">
        {mode === "login" ? (
          <>
            Впервые здесь?{" "}
            <Link href="/signup" className="font-semibold text-ink underline-offset-4 hover:underline">
              Создать аккаунт
            </Link>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
              Войти
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" />
      <path fill="currentColor" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" opacity=".8" />
      <path fill="currentColor" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3.1a10 10 0 0 0 0 9z" opacity=".6" />
      <path fill="currentColor" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9z" opacity=".4" />
    </svg>
  );
}
