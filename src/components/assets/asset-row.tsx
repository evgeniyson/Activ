import Image from "next/image";
import Link from "next/link";
import { CategoryIcon } from "@/components/assets/category-icon";
import { Delta } from "@/components/ui/stat";
import { cn } from "@/lib/cn";
import type { CurrencyCode } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { Asset, AssetMetrics } from "@/types/domain";
import { categoryLabel } from "@/types/categories";

export function AssetThumb({ asset, size = 48, className }: { asset: Pick<Asset, "coverImageUrl" | "category" | "name">; size?: number; className?: string }) {
  return (
    <div className={cn("relative flex shrink-0 items-center justify-center overflow-hidden border border-hair bg-paper-2", className)} style={{ width: size, height: size }}>
      {asset.coverImageUrl ? (
        <Image src={asset.coverImageUrl} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : (
        <CategoryIcon category={asset.category} className="text-gray" style={{ width: size * 0.42, height: size * 0.42 }} />
      )}
    </div>
  );
}

export function AssetRow({ asset, metrics, currency, index, change30d }: { asset: Asset; metrics: AssetMetrics; currency: CurrencyCode; index?: number; change30d?: number | null }) {
  const value = metrics.currentValue;
  return (
    <Link
      href={`/app/assets/${asset.id}`}
      className="group flex items-center gap-3 border-b border-hair px-4 py-3.5 transition-colors duration-[140ms] hover:bg-black/[0.03] sm:gap-4 sm:px-5"
    >
      {index != null ? <span className="label-mono hidden w-8 text-gray-2 md:block">{String(index + 1).padStart(3, "0")}</span> : null}
      <AssetThumb asset={asset} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold leading-tight">{asset.name}</p>
        <p className="mt-0.5 truncate text-[12px] text-gray">
          {[asset.manufacturer, asset.variant, categoryLabel(asset.category)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="hidden w-28 flex-col items-end md:flex">
        <span className="label-mono text-gray-2">Purchased</span>
        <span className="tnum text-sm text-gray">{formatMoney(metrics.purchasePrice, currency)}</span>
      </div>
      <div className="hidden w-24 flex-col items-end lg:flex">
        <span className="label-mono text-gray-2">30D</span>
        {change30d != null ? <Delta amount={change30d} currency={currency} /> : <span className="text-sm text-gray-2">—</span>}
      </div>
      <div className="flex w-28 flex-col items-end sm:w-32">
        <span className="tnum text-[15px] font-bold">{value != null ? formatMoney(value, currency) : "—"}</span>
        {metrics.depreciationPct != null ? <Delta ratio={metrics.depreciationPct} currency={currency} /> : <span className="label-mono text-gray-2">Estimating…</span>}
      </div>
    </Link>
  );
}
