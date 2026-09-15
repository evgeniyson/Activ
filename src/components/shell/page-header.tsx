import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function PageHeader({ index, title, description, action, className, eyebrow }: { index?: string; title: ReactNode; description?: ReactNode; action?: ReactNode; className?: string; eyebrow?: ReactNode }) {
  return (
    <div className={cn("mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex items-start gap-4">
        {index ? (
          <span className="label-mono mt-2 hidden text-gray-2 sm:block" aria-hidden="true">
            {index}
          </span>
        ) : null}
        <div>
          {eyebrow ? <div className="label-mono mb-2 text-gray">{eyebrow}</div> : null}
          <h1 className="text-3xl font-extrabold display-tight sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-xl text-[15px] text-gray">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
