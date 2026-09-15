"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col items-start justify-center gap-6 px-6 sm:px-12">
      <span className="label-mono text-gray">{offline ? "Офлайн" : "Ошибка"}</span>
      <h1 className="max-w-lg text-4xl font-extrabold display-tight sm:text-5xl">{offline ? "Вы офлайн." : "Что-то пошло не так."}</h1>
      <p className="max-w-md text-[15px] text-gray">
        {offline ? "Подключитесь к интернету, чтобы загрузить портфель." : "Не удалось загрузить страницу. Ваши данные в безопасности — попробуйте ещё раз, а если повторится, выйдите и войдите снова."}
        {error.digest ? <span className="label-mono mt-2 block text-gray-2">ref {error.digest}</span> : null}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Попробовать снова</Button>
        <ButtonLink href="/app" variant="outline">
          Обзор
        </ButtonLink>
      </div>
    </div>
  );
}
