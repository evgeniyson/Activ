"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Shows an "Install app" affordance when the browser offers it. */
export function InstallPrompt({ className }: { className?: string }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  if (!evt) return null;
  return (
    <button
      type="button"
      className={className ?? "label-mono mb-3 flex w-full items-center justify-between border border-ink px-2 py-2 text-ink hover:bg-ink hover:text-paper"}
      onClick={async () => {
        await evt.prompt();
        const { outcome } = await evt.userChoice;
        if (outcome === "accepted") setEvt(null);
      }}
    >
      Установить приложение <span aria-hidden="true">↓</span>
    </button>
  );
}
