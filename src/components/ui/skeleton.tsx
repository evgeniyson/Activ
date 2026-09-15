import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function StatSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function AssetRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-hair px-4 py-4 sm:px-5">
      <Skeleton className="h-12 w-12 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="flex flex-col items-end gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-2.5 w-12" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-56 w-full overflow-hidden", className)} aria-hidden="true">
      <svg viewBox="0 0 400 120" className="h-full w-full" preserveAspectRatio="none">
        <path d="M0 40 C 60 30, 90 70, 140 60 S 220 20, 280 45 S 360 90, 400 70" fill="none" stroke="#e5e5e5" strokeWidth="2" />
      </svg>
      <div className="skeleton absolute inset-0 opacity-30" />
    </div>
  );
}
