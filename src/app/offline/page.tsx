import type { Metadata } from "next";
import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Offline", robots: { index: false } };

export default function OfflinePage() {
  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col items-start justify-center gap-6 px-6 sm:px-12">
      <Wordmark height={18} />
      <span className="label-mono text-gray">No connection</span>
      <h1 className="max-w-lg text-4xl font-extrabold display-tight sm:text-5xl">You&apos;re offline.</h1>
      <p className="max-w-md text-[15px] text-gray">Your portfolio needs a connection to load fresh valuations. Reconnect and try again — nothing you added is lost.</p>
      <ButtonLink href="/app" variant="primary">
        Try again
      </ButtonLink>
    </div>
  );
}
