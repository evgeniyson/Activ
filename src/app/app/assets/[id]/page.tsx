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
import { formatMoney, formatPercent, plural } from "@/lib/format";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { categoryLabel, specLabel } from "@/types/categories";
import { CONDITION_LABELS } from "@/types/domain";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const user = await requireUser();
  const store = await getStore();
  const asset = await store.getAsset(user.id, id);
  return { title: asset?.name ?? "Актив" };
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
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Активы
        </Link>
        <AssetActions asset={asset} currency={cur} />
      </div>

      <header className="mb-4 flex flex-col gap-5 sm:flex-row sm:items-start">
        <AssetThumb asset={asset} size={96} className="sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gray">{categoryLabel(asset.category)}</Badge>
            {sold ? <Badge tone="ink">Продано</Badge> : null}
            {asset.identificationConfidence != null ? <ConfidenceBadge score={asset.identificationConfidence} kind="identification" /> : null}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">{asset.name}</h1>
          <p className="mt-2 text-[15px] text-gray">
            {[asset.manufacturer, asset.variant, ...specEntries.filter(([k]) => k === "color").map(([, v]) => v)].filter(Boolean).join(" · ")}
            {" · "}Состояние: <span className="font-semibold text-ink">{CONDITION_LABELS[asset.condition]}</span>
          </p>
        </div>
      </header>

      <section className="grid gap-px border border-hair bg-hair md:grid-cols-3" aria-label="Оценка">
        <div className="bg-ink px-5 py-6 text-paper md:col-span-1 lg:px-6">
          <span className="label-mono text-paper/60">{sold ? "Продано за" : "Оценочная рыночная стоимость"}</span>
          <div className="mt-2">
            {sold && asset.soldPrice != null ? (
              <Money amount={asset.soldPrice} currency={asset.purchaseCurrency} className="text-[2.6rem] font-extrabold display-tight sm:text-5xl" />
            ) : metrics.currentValue != null ? (
              <Money amount={metrics.currentValue} currency={cur} animate className="text-[2.6rem] font-extrabold display-tight sm:text-5xl" />
            ) : (
              <span className="text-2xl font-bold text-paper/60">Оценки пока нет</span>
            )}
          </div>
          {!sold && metrics.lowEstimate != null && metrics.highEstimate != null ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="label-mono text-paper/60">Диапазон</span>
                <span className="tnum text-sm font-semibold">
                  {formatMoney(metrics.lowEstimate, cur)} — {formatMoney(metrics.highEstimate, cur)}
                </span>
              </div>
              <RangeBar low={metrics.lowEstimate} high={metrics.highEstimate} value={metrics.currentValue ?? 0} />
              <div className="flex items-center justify-between pt-1">
                <span className="label-mono text-paper/60">Уверенность</span>
                <ConfidenceBadge score={asset.valuationConfidence} kind="valuation" className="bg-paper text-ink" />
              </div>
              {valuation?.trend30d != null ? (
                <div className="flex items-center justify-between">
                  <span className="label-mono text-paper/60">Тренд за 30 дней</span>
                  <Delta ratio={valuation.trend30d} currency={cur} className="[&>*]:text-paper" />
                </div>
              ) : null}
              <p className="label-mono pt-1 text-paper/40">
                {valuation ? `${plural(valuation.comparablesCount, ["аналог", "аналога", "аналогов"])} · ${asset.valuationDate ? formatDate(asset.valuationDate) : ""}` : ""}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-px bg-hair md:col-span-2 md:grid-cols-3">
          <Cell>
            <Stat label="Куплено за" value={<Money amount={metrics.purchasePrice} currency={cur} />} sub={formatDate(asset.purchaseDate)} />
          </Cell>
          <Cell>
            <Stat
              label="Общее обесценивание"
              value={metrics.depreciation != null ? <Money amount={metrics.depreciation} currency={cur} signed /> : "—"}
              tone={metrics.depreciation != null && metrics.depreciation < 0 ? "negative" : "positive"}
              sub={metrics.depreciationPct != null ? formatPercent(metrics.depreciationPct, { signed: true }) : undefined}
            />
          </Cell>
          <Cell className="col-span-2 md:col-span-1" highlight>
            <Stat
              label="Средняя стоимость владения"
              value={metrics.dailyCost != null ? <span className="tnum">{formatMoney(metrics.dailyCost, cur, { decimals: 0 })}<span className="text-sm font-semibold text-ink/60"> / день</span></span> : "—"}
              sub={metrics.ownershipCost != null ? `${formatMoney(metrics.ownershipCost, cur)} всего, включая ${formatMoney(metrics.expensesTotal, cur)} расходов` : undefined}
            />
          </Cell>
          <Cell>
            <Stat label="В собственности" value={<span className="tnum">{plural(metrics.daysOwned, ["день", "дня", "дней"])}</span>} />
          </Cell>
          <Cell>
            <Stat label="Быстрая продажа" value={metrics.quickSale != null ? <Money amount={metrics.quickSale} currency={cur} /> : "—"} sub="Продать за несколько дней" />
          </Cell>
          <Cell>
            <Stat label="Оптимистичная продажа" value={metrics.highEstimate != null ? <Money amount={metrics.highEstimate} currency={cur} /> : "—"} sub="Терпеливая частная продажа" />
          </Cell>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel>
            <PanelHeader index="H" title="История цены" subtitle={`${plural(history.length, ["оценка", "оценки", "оценок"])} · серая полоса — диапазон оценки`} />
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
            <PanelHeader index="T" title="Хронология" />
            <Timeline items={timeline} />
          </Panel>

          <Panel>
            <PanelHeader index="D" title="Данные" />
            <dl className="divide-y divide-hair px-5 text-sm">
              <Row k="Производитель" v={asset.manufacturer} />
              <Row k="Модель" v={asset.model} />
              <Row k="Вариант" v={asset.variant} />
              {specEntries.map(([k, v]) => (
                <Row key={k} k={specLabel(k)} v={v} />
              ))}
              <Row k="Магазин" v={asset.retailer} />
              <Row k="Серийный номер" v={asset.serialNumber} mono />
              <Row k="IMEI" v={asset.imei} mono />
              <Row k="Гарантия до" v={asset.warrantyExpiration ? formatDate(asset.warrantyExpiration) : null} />
              <Row k="Заметки" v={asset.notes} />
            </dl>
          </Panel>

          {valuation?.notes.length ? (
            <Panel tone="flat" className="p-5">
              <span className="label-mono text-gray">Как получена оценка</span>
              <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-gray">
                {valuation.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-gray-2">Рыночная стоимость — оценка на основе доступных рыночных данных; фактическая цена продажи может отличаться.</p>
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
      <dt className="label-mono pt-0.5 text-gray-2">{k}</dt>
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
