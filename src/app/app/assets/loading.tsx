import { AssetRowSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="mb-3 h-9 w-40" />
      <Skeleton className="mb-8 h-3.5 w-64" />
      <Skeleton className="mb-4 h-12 w-full" />
      <div className="border border-hair bg-paper">
        {Array.from({ length: 6 }).map((_, i) => (
          <AssetRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
