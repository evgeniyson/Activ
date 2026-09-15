import Link from "next/link";
import { AssetThumb } from "@/components/assets/asset-row";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Delta } from "@/components/ui/stat";
import type { CurrencyCode } from "@/lib/currency";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Asset, AssetMetrics } from "@/types/domain";

export function SoldAssets({ items, currency }: { items: { asset: Asset; metrics: AssetMetrics }[]; currency: CurrencyCode }) {
  return (
    <Panel className="mt-6">
      <PanelHeader index="SOLD" title="Проданные" subtitle="Хранятся для истории — в итоги портфеля не входят." />
      {items.map(({ asset, metrics }) => (
        <Link key={asset.id} href={`/app/assets/${asset.id}`} className="flex items-center gap-4 border-b border-hair px-5 py-3.5 last:border-b-0 hover:bg-black/[0.03]">
          <AssetThumb asset={asset} size={40} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{asset.name}</p>
            <p className="label-mono text-gray-2">Продано {asset.soldDate ? formatDate(asset.soldDate) : ""}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="tnum text-sm font-bold">{asset.soldPrice != null ? formatMoney(asset.soldPrice, asset.purchaseCurrency) : "—"}</span>
            {metrics.depreciationPct != null ? <Delta ratio={metrics.depreciationPct} currency={currency} /> : null}
          </div>
        </Link>
      ))}
    </Panel>
  );
}
