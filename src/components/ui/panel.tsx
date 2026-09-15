import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Sharp-cornered container with hairline border — the base surface of the UI. */
export function Panel({ children, className, tone = "paper", as: Tag = "div" }: { children: ReactNode; className?: string; tone?: "paper" | "ink" | "orange" | "flat"; as?: "div" | "section" | "article" | "li" }) {
  return (
    <Tag
      className={cn(
        "relative min-w-0",
        tone === "paper" && "border border-hair bg-paper",
        tone === "flat" && "bg-paper-2",
        tone === "ink" && "bg-ink text-paper",
        tone === "orange" && "bg-orange text-ink",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PanelHeader({ title, index, action, className, subtitle }: { title: ReactNode; index?: string; action?: ReactNode; subtitle?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-4 border-b border-hair px-4 py-3 sm:px-5", className)}>
      <div className="flex items-baseline gap-3">
        {index ? <span className="label-mono text-gray-2">{index}</span> : null}
        <div>
          <h2 className="text-sm font-bold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-[12px] text-gray">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Hairline({ className, vertical }: { className?: string; vertical?: boolean }) {
  return <div className={cn(vertical ? "w-px self-stretch bg-hair" : "h-px w-full bg-hair", className)} aria-hidden="true" />;
}

export function MonoLabel({ children, className, tone = "gray" }: { children: ReactNode; className?: string; tone?: "gray" | "ink" | "orange" | "paper" }) {
  return <span className={cn("label-mono", tone === "gray" && "text-gray", tone === "ink" && "text-ink", tone === "orange" && "text-orange", tone === "paper" && "text-paper/70", className)}>{children}</span>;
}
