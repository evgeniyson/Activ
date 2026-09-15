import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { confidenceLabel } from "@/lib/format";

export function Badge({ children, tone = "outline", className }: { children: ReactNode; tone?: "outline" | "ink" | "orange" | "gray" | "positive" | "negative"; className?: string }) {
  return (
    <span
      className={cn(
        "label-mono inline-flex h-6 items-center gap-1.5 px-2",
        tone === "outline" && "border border-ink text-ink",
        tone === "ink" && "bg-ink text-paper",
        tone === "orange" && "bg-orange text-ink",
        tone === "gray" && "bg-paper-2 text-gray",
        tone === "positive" && "bg-positive/10 text-positive",
        tone === "negative" && "bg-orange-3/10 text-orange-3",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ConfidenceBadge({ score, kind, className }: { score: number | null | undefined; kind?: "valuation" | "identification"; className?: string }) {
  if (score == null)
    return (
      <Badge tone="gray" className={className}>
        Нет данных
      </Badge>
    );
  const label = confidenceLabel(score);
  const pct = Math.round(score * 100);
  const bars = label === "Высокая" ? 3 : label === "Средняя" ? 2 : 1;
  const kindLabel = kind === "identification" ? "Уверенность распознавания" : "Уверенность оценки";
  return (
    <Badge tone={bars === 3 ? "ink" : bars === 2 ? "outline" : "gray"} className={className} aria-label={`${kindLabel} ${pct}%`}>
      <span className="inline-flex gap-px" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn("h-2 w-1", i < bars ? "bg-current" : "bg-current/25")} />
        ))}
      </span>
      {label} · {pct}%
    </Badge>
  );
}
