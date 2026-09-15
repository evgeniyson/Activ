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
      <span className="label-mono text-gray">{offline ? "Offline" : "Error"}</span>
      <h1 className="max-w-lg text-4xl font-extrabold display-tight sm:text-5xl">{offline ? "You're offline." : "Something went wrong."}</h1>
      <p className="max-w-md text-[15px] text-gray">
        {offline ? "Reconnect to load your portfolio." : "We couldn't load this page. Your data is safe — try again, and if it keeps happening, sign out and back in."}
        {error.digest ? <span className="label-mono mt-2 block text-gray-2">ref {error.digest}</span> : null}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/app" variant="outline">
          Overview
        </ButtonLink>
      </div>
    </div>
  );
}
