import type { TimelineItem } from "@/features/assets/service";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

const DOT: Record<TimelineItem["kind"], string> = {
  purchased: "bg-ink",
  valuation: "bg-orange",
  expense: "bg-ink",
  warranty_added: "bg-gray-2",
  condition_changed: "bg-gray-2",
  sold: "bg-orange-3",
  note: "bg-gray-2",
  document_added: "bg-gray-2",
  image_added: "bg-gray-2",
  edited: "bg-gray-2",
};

export function Timeline({ items, limit = 14 }: { items: TimelineItem[]; limit?: number }) {
  const shown = items.slice(0, limit);
  if (!shown.length) return <p className="px-5 py-6 text-sm text-gray">Пока пусто.</p>;
  return (
    <ol className="relative px-5 py-4">
      <div className="absolute bottom-6 left-[27px] top-6 w-px bg-hair" aria-hidden="true" />
      {shown.map((item, i) => (
        <li key={item.id} className={cn("relative flex gap-4 pl-6", i < shown.length - 1 && "pb-5")}>
          <span className={cn("absolute left-0 top-1.5 h-[9px] w-[9px] border-2 border-paper", DOT[item.kind])} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <p className="label-mono text-gray-2">{formatDate(item.date)}</p>
              {item.amount != null && item.currency ? (
                <span className={cn("tnum text-sm font-bold", item.kind === "expense" ? "text-orange-3" : "text-ink")}>
                  {item.kind === "expense" ? "+" : ""}
                  {formatMoney(item.amount, item.currency)}
                </span>
              ) : null}
            </div>
            <p className="text-sm font-semibold leading-snug">{item.title}</p>
            {item.description ? <p className="text-[12px] text-gray">{item.description}</p> : null}
          </div>
        </li>
      ))}
      {items.length > limit ? <li className="label-mono pl-6 pt-4 text-gray-2">ещё {items.length - limit} ранее</li> : null}
    </ol>
  );
}
