import type { Recommendation } from "@/features/insights/keep-sell";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import { Panel } from "@/components/ui/panel";

export function KeepSellCard({ recommendation, currency, sold }: { recommendation: Recommendation; currency: CurrencyCode; sold?: boolean }) {
  const r = recommendation;
  const tone = r.verdict === "strong_sell" ? "orange" : r.verdict === "consider_selling" ? "ink" : "paper";
  if (sold) return null;
  return (
    <Panel tone={tone} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className={cn("label-mono", tone === "paper" ? "text-gray" : tone === "ink" ? "text-paper/60" : "text-ink/70")}>Should I sell?</span>
          <h3 className="mt-1 text-2xl font-extrabold display-tight sm:text-3xl">{r.title}</h3>
        </div>
        {r.expectedSale != null ? (
          <div className="text-right">
            <span className={cn("label-mono", tone === "paper" ? "text-gray" : tone === "ink" ? "text-paper/60" : "text-ink/70")}>Estimated sale value</span>
            <p className="tnum text-2xl font-extrabold">{formatMoney(r.expectedSale, currency)}</p>
          </div>
        ) : null}
      </div>
      <p className={cn("mt-4 max-w-2xl text-[15px] leading-relaxed", tone === "ink" ? "text-paper/85" : tone === "orange" ? "text-ink/85" : "text-gray")}>{r.summary}</p>
      {r.reasons.length ? (
        <ul className={cn("mt-4 grid gap-2 text-[13px] sm:grid-cols-2", tone === "ink" ? "text-paper/75" : tone === "orange" ? "text-ink/75" : "text-gray")}>
          {r.reasons.map((reason, i) => (
            <li key={i} className="flex gap-2">
              <span className={cn("mt-2 h-1 w-1 shrink-0", tone === "paper" ? "bg-orange" : "bg-current")} aria-hidden="true" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={cn("mt-5 flex items-center gap-3", tone === "ink" ? "text-paper/40" : tone === "orange" ? "text-ink/50" : "text-gray-2")}>
        <SignalBar score={r.score} tone={tone} />
        <span className="label-mono">Sell signal</span>
      </div>
      <p className={cn("mt-3 text-[11px]", tone === "ink" ? "text-paper/40" : tone === "orange" ? "text-ink/50" : "text-gray-2")}>This is a probabilistic read on market signals, not financial advice. Prices may move either way.</p>
    </Panel>
  );
}

function SignalBar({ score, tone }: { score: number; tone: "paper" | "ink" | "orange" }) {
  const filled = Math.round(score * 10);
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={cn("h-3 w-1.5", i < filled ? (tone === "paper" ? "bg-orange" : "bg-current") : tone === "paper" ? "bg-hair" : "bg-current/20")} />
      ))}
    </span>
  );
}
