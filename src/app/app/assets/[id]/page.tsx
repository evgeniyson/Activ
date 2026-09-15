import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetThumb } from "@/components/assets/asset-row";
import { AssetActions } from "@/components/assets/detail/asset-actions";
import { ExpensesPanel } from "@/components/assets/detail/expenses-panel";
import { KeepSellCard } from "@/components/assets/detail/keep-sell-card";
import { Timeline } from "@/components/assets/detail/timeline";
import { UpgradeCalculator } from "@/components/assets/detail/upgrade-calculator";
import { ValueHistoryChart } from "@/components/assets/value-history-chart";
import { Badge, ConfidenceBadge } from "@/components/ui/badge";
import { ArrowLeft } from "@/components/ui/icons";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Delta, Money, Stat } from "@/components/ui/stat";
import { getAssetDetail } from "@/features/assets/service";
import { buildRecommendation } from "@/features/insights/keep-sell";
import { upgradeOptions } from "@/features/insights/upgrade";
import { ensureProfile } from "@/features/profile/service";
import { track } from "@/lib/analytics";
import { formatDate } from "@/lib/dates";
import { formatMoney, formatPercent, pluralize } from "@/lib/format";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { categoryLabel } from "@/types/categories";
import { CONDITION_LABELS } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const store = await getStore();
  const asset = await store.getAsset(user.id, id);
  return { title: asset?.name ?? "Asset" };
}

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  const detail = await getAssetDetail(store, user.id, id, profile);
  if (!detail) notFound();
  const { asset, metrics, expenses, history, valuation, timeline } = detail;
  const cur = profile.preferredCurrency;
  track("valuation_viewed", { assetId: id });

  const recommendation = buildRecommendation({ asset, valuation, displayCurrency: cur });
  const upgrades = upgradeOptions(asset, cur);
  const sold = asset.status === "sold";
  const specEntries = Object.entries(asset.specs).filter(([, v]) => v);

  return (
    <>
      <div className="mb-5 flex items-center justify-between gap-3">
        <Link href="/app/assets" className="label-mono-md inline-flex items-center gap-1.5 text-gray hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Assets
        </Link>
        <AssetActions asset={asset} currency={cur} />
      </div>

      {/* Header */}
      <header className="mb-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <AssetThumb asset={asset} size={96} className="sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gray">{categoryLabel(asset.category)}</Badge>
            {sold ? <Badge tone="ink">Sold</Badge> : null}
            {asset.identificationConfidence != null ? <ConfidenceBadge score={asset.identificationConfidence} kind="identification" /> : null}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">{asset.name}</h1>
          <p className="mt-2 text-[15px] text-gray">
            {[asset.manufacturer, asset.variant, ...specEntries.filter(([k]) => k === "color").map(([, v]) => v)].filter(Boolean).join(" · ")}
            {" · "}Condition: <span className="font-semibold text-ink">{CONDITION_LABELS[asset.condition]}</span>
          </p>
        </div>
      </header>

      {/* Value hero */}
      <section className="grid gap-px border border-hair bg-hair md:grid-cols-3" aria-label="Valuation">
        <div className="bg-ink px-5 py-6 text-paper md:col-span-1 lg:px-6">
          <span className="label-mono text-paper/60">{sold ? "Sold for" : "Estimated market value"}</span>
          <div className="mt-2">
            {sold && asset.soldPrice != null ? (
              <Money amount={asset.soldPrice} currency={asset.purchaseCurrency} className="text-5xl font-extrabold display-tight" />
            ) : metrics.currentValue != null ? (
              <Money amount={metrics.currentValue} currency={cur} animate className="text-5xl font-extrabold display-tight" />
            ) : (
              <span className="text-2xl font-bold text-paper/60">No estimate yet</span>
            )}
          </div>
          {!sold && metrics.lowEstimate != null && metrics.highEstimate != null ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="label-mono text-paper/60">Estimated range</span>
                <span className="tnum text-sm font-semibold">
                  {formatMoney(metrics.lowEstimate, cur)} — {formatMoney(metrics.highEstimate, cur)}
                </span>
              </div>
              <RangeBar low={metrics.lowEstimate} high={metrics.highEstimate} value={metrics.currentValue ?? 0} />
              <div className="flex items-center justify-between pt-1">
                <span className="label-mono text-paper/60">Confidence</span>
                <ConfidenceBadge score={asset.valuationConfidence} kind="valuation" className="bg-paper text-ink" />
              </div>
              {valuation?.trend30d != null ? (
                <div className="flex items-center justify-between">
                  <span className="label-mono text-paper/60">30-day trend</span>
                  <Delta ratio={valuation.trend30d} currency={cur} className="[&>*]:text-paper" />
                </div>
              ) : null}
              <p className="label-mono pt-1 text-paper/40">
                {valuation ? `${valuation.comparablesCount} comparables · ${asset.valuationDate ? formatDate(asset.valuationDate) : ""}` : ""}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-px bg-hair md:col-span-2 md:grid-cols-3">
          <Cell>
            <Stat label="Purchased for" value={<Money amount={metrics.purchasePrice} currency={cur} />} sub={formatDate(asset.purchaseDate)} />
          </Cell>
          <Cell>
            <Stat
              label="Total depreciation"
              value={metrics.depreciation != null ? <Money amount={metrics.depreciation} currency={cur} signed /> : "—"}
              tone={metrics.depreciation != null && metrics.depreciation < 0 ? "negative" : "positive"}
              sub={metrics.depreciationPct != null ? formatPercent(metrics.depreciationPct, { signed: true }) : undefined}
            />
          </Cell>
          <Cell className="col-span-2 md:col-span-1" highlight>
            <Stat
              label="Average cost of ownership"
              value={metrics.dailyCost != null ? <span className="tnum">{formatMoney(metrics.dailyCost, cur, { decimals: 2 })}<span className="text-sm font-semibold text-ink/60"> / day</span></span> : "—"}
              sub={metrics.ownershipCost != null ? `${formatMoney(metrics.ownershipCost, cur)} total incl. ${formatMoney(metrics.expensesTotal, cur)} expenses` : undefined}
            />
          </Cell>
          <Cell>
            <Stat label="Ownership duration" value={<span className="tnum">{metrics.daysOwned}<span className="text-sm font-semibold text-gray"> days</span></span>} />
          </Cell>
          <Cell>
            <Stat label="Estimated quick sale" value={metrics.quickSale != null ? <Money amount={metrics.quickSale} currency={cur} /> : "—"} sub="Sell within days" />
          </Cell>
          <Cell>
            <Stat label="Optimistic sale" value={metrics.highEstimate != null ? <Money amount={metrics.highEstimate} currency={cur} /> : "—"} sub="Patient private sale" />
          </Cell>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel>
            <PanelHeader index="H" title="Price history" subtitle={`${pluralize(history.length, "valuation")} · shaded band is the estimated range`} />
            <ValueHistoryChart history={history} currency={cur} purchasePrice={metrics.purchasePrice} />
          </Panel>

          <div id="insights" className="scroll-mt-20">
            <KeepSellCard recommendation={recommendation} currency={cur} sold={sold} />
          </div>

          {!sold ? <UpgradeCalculator asset={asset} options={upgrades} currency={cur} /> : null}

          <ExpensesPanel assetId={asset.id} expenses={expenses} currency={cur} defaultCurrency={asset.purchaseCurrency} />
        </div>

        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader index="T" title="Timeline" />
            <Timeline items={timeline} />
          </Panel>

          <Panel>
            <PanelHeader index="D" title="Details" />
            <dl className="divide-y divide-hair px-5 text-sm">
              <Row k="Manufacturer" v={asset.manufacturer} />
              <Row k="Model" v={asset.model} />
              <Row k="Variant" v={asset.variant} />
              {specEntries.map(([k, v]) => (
                <Row key={k} k={k.replace(/_/g, " ")} v={v} />
              ))}
              <Row k="Retailer" v={asset.retailer} />
              <Row k="Serial number" v={asset.serialNumber} mono />
              <Row k="IMEI" v={asset.imei} mono />
              <Row k="Warranty until" v={asset.warrantyExpiration ? formatDate(asset.warrantyExpiration) : null} />
              <Row k="Notes" v={asset.notes} />
            </dl>
          </Panel>

          {valuation?.notes.length ? (
            <Panel tone="flat" className="p-5">
              <span className="label-mono text-gray">How this estimate was made</span>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-gray">
                {valuation.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-gray-2">Market values are estimates based on available market data and may differ from actual sale prices.</p>
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}

function Cell({ children, className, highlight }: { children: React.ReactNode; className?: string; highlight?: boolean }) {
  return <div className={`${highlight ? "bg-orange" : "bg-paper"} px-5 py-5 ${className ?? ""}`}>{children}</div>;
}

function Row({ k, v, mono }: { k: string; v: string | null | undefined; mono?: boolean }) {
  if (!v) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="label-mono pt-0.5 capitalize text-gray-2">{k}</dt>
      <dd className={`text-right ${mono ? "font-mono text-[13px]" : ""}`}>{v}</dd>
    </div>
  );
}

function RangeBar({ low, high, value }: { low: number; high: number; value: number }) {
  const pct = high > low ? Math.min(100, Math.max(0, ((value - low) / (high - low)) * 100)) : 50;
  return (
    <div className="relative h-1.5 w-full bg-paper/20" aria-hidden="true">
      <div className="absolute inset-y-0 left-0 bg-paper/40" style={{ width: `${pct}%` }} />
      <div className="absolute -top-1 h-3.5 w-1 bg-orange" style={{ left: `calc(${pct}% - 2px)` }} />
    </div>
  );
}
