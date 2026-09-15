import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({ title, description, action, className, index = "000" }: { title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string; index?: string }) {
  return (
    <div className={cn("crop-marks relative flex flex-col items-start gap-5 border border-hair bg-paper px-6 py-10 sm:px-10 sm:py-14", className)}>
      <div className="grid-dots absolute inset-0 opacity-60" aria-hidden="true" />
      <span className="label-mono relative text-gray-2">{index}</span>
      <h3 className="relative max-w-md text-2xl font-bold display-tight sm:text-3xl">{title}</h3>
      {description ? <p className="relative max-w-md text-[15px] leading-relaxed text-gray">{description}</p> : null}
      {action ? <div className="relative flex flex-wrap gap-3 pt-2">{action}</div> : null}
    </div>
  );
}
