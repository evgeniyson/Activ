import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";

export const metadata: Metadata = { robots: { index: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1fr]">
      <div className="safe-top flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Wordmark href="/" height={18} priority />
          <Link href="/" className="label-mono-md text-gray hover:text-ink">
            ← Home
          </Link>
        </div>
        <div className="flex flex-1 items-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="label-mono text-gray-2">Privacy-first · your portfolio is never public</p>
      </div>
      <div className="relative hidden overflow-hidden bg-ink text-paper lg:block">
        <div className="grid-lines absolute inset-0 opacity-30" aria-hidden="true" />
        <div className="absolute right-8 top-8 label-mono text-paper/40">001 / PERSONAL ASSET OS</div>
        <div className="absolute inset-x-12 bottom-12">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-orange">You paid €1,299</p>
          <p className="mt-2 text-5xl font-extrabold display-tight">Today it&apos;s worth approximately €930.</p>
          <p className="mt-4 max-w-md text-paper/60">Market value, depreciation, cost per day and a straight answer to &ldquo;should I sell?&rdquo; — for everything you own.</p>
        </div>
        <div className="absolute left-12 top-1/3 h-56 w-56 bg-orange" aria-hidden="true" />
        <div className="absolute left-32 top-1/3 mt-20 h-40 w-64 border border-paper/30" aria-hidden="true" />
      </div>
    </div>
  );
}
