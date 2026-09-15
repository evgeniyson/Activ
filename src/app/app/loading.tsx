import { AssetRowSkeleton, ChartSkeleton, Skeleton, StatSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Загрузка">
      <div className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-3.5 w-72" />
      </div>
      <div className="grid gap-px border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-4">
        <div className="col-span-full bg-paper px-6 py-7 lg:col-span-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-3 h-14 w-64" />
          <Skeleton className="mt-5 h-2.5 w-full" />
        </div>
        <div className="bg-paper px-5 py-5">
          <StatSkeleton />
        </div>
        <div className="bg-paper px-5 py-5">
          <StatSkeleton />
        </div>
      </div>
      <div className="mt-4 border border-hair bg-paper p-4">
        <ChartSkeleton />
      </div>
      <div className="mt-4 border border-hair bg-paper">
        <AssetRowSkeleton />
        <AssetRowSkeleton />
        <AssetRowSkeleton />
        <AssetRowSkeleton />
      </div>
    </div>
  );
}
