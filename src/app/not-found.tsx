import { Wordmark } from "@/components/brand/wordmark";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="safe-top safe-bottom flex min-h-dvh flex-col items-start justify-center gap-6 px-6 sm:px-12">
      <Wordmark height={18} href="/" />
      <span className="label-mono text-gray">404</span>
      <h1 className="max-w-lg text-4xl font-extrabold display-tight sm:text-5xl">This page doesn&apos;t exist.</h1>
      <p className="max-w-md text-[15px] text-gray">The link may be outdated, or the asset may have been deleted.</p>
      <ButtonLink href="/app" variant="primary">
        Go to your portfolio
      </ButtonLink>
    </div>
  );
}
