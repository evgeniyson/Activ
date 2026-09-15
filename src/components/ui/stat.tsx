import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatMoney, formatPercent } from "@/lib/format";
import type { CurrencyCode } from "@/lib/currency";
import { AnimatedMoney } from "./animated-number";

export function Stat({ label, value, sub, size = "md", className, tone, animate }: { label: ReactNode; value: ReactNode; sub?: ReactNode; size?: "sm" | "md" | "lg" | "xl"; className?: string; tone?: "default" | "negative" | "positive" | "orange"; animate?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="label-mono text-gray">{label}</span>
      <span
        className={cn(
          "tnum font-bold display-tight",
          size === "sm" && "text-lg",
          size === "md" && "text-2xl",
          size === "lg" && "text-[2.35rem] sm:text-5xl",
          size === "xl" && "text-[3rem] sm:text-7xl",
          tone === "negative" && "text-orange-3",
          tone === "positive" && "text-positive",
          tone === "orange" && "text-orange",
        )}
        data-animate={animate || undefined}
      >
        {value}
      </span>
      {sub ? <span className="text-[12px] text-gray">{sub}</span> : null}
    </div>
  );
}

export function Money({ amount, currency, className, signed, decimals, animate }: { amount: number; currency: CurrencyCode; className?: string; signed?: boolean; decimals?: number; animate?: boolean }) {
  if (animate) return <AnimatedMoney amount={amount} currency={currency} signed={signed} decimals={decimals} className={className} />;
  return <span className={cn("tnum", className)}>{formatMoney(amount, currency, { signed, decimals })}</span>;
}

/** Signed change chip: −€240 · −2.8% */
export function Delta({ amount, ratio, currency, className, size = "sm", neutralAtZero = true }: { amount?: number | null; ratio?: number | null; currency: CurrencyCode; className?: string; size?: "sm" | "md" | "lg"; neutralAtZero?: boolean }) {
  const ref = amount ?? ratio ?? 0;
  const neg = ref < 0;
  const zero = neutralAtZero && Math.abs(ref) < 1e-9;
  return (
    <span
      className={cn(
        "tnum inline-flex items-center gap-1.5 font-semibold",
        size === "sm" && "text-[13px]",
        size === "md" && "text-sm",
        size === "lg" && "text-base",
        zero ? "text-gray" : neg ? "text-orange-3" : "text-positive",
        className,
      )}
    >
      {amount != null ? <span>{formatMoney(amount, currency, { signed: true })}</span> : null}
      {ratio != null ? <span className={cn(amount != null && "text-gray/80 font-medium")}>{formatPercent(ratio, { signed: true })}</span> : null}
    </span>
  );
}
