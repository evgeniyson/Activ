import type { Metadata } from "next";
import Link from "next/link";
import { AssetRow } from "@/components/assets/asset-row";
import { PortfolioChart } from "@/components/portfolio/portfolio-chart";
import { PageHeader } from "@/components/shell/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ArrowRight, Plus } from "@/components/ui/icons";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Delta, Money, Stat } from "@/components/ui/stat";
import { loadDemoPortfolioAction } from "@/features/demo/actions";
import { generateNotifications } from "@/features/notifications/service";
import { getPortfolioOverview } from "@/features/portfolio/service";
import { ensureProfile } from "@/features/profile/service";
import { buildValuationRequest } from "@/features/assets/service";
import { formatMoney, formatPercent, plural } from "@/lib/format";
import { track } from "@/lib/analytics";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { getValuationEngine, type ValuationResult } from "@/valuation";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Обзор" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  const overview = await getPortfolioOverview(store, user.id, profile);
  track("portfolio_viewed", { assets: overview.items.length });

  if (overview.items.length) {
    const engine = getValuationEngine();
    const valuations = new Map<string, ValuationResult | null>();
    for (const { asset } of overview.items.slice(0, 20)) valuations.set(asset.id, await engine.value(buildValuationRequest(asset, profile)));
    await generateNotifications(store, user.id, profile, overview.items.map((i) => i.asset), valuations);
  }

  const { totals, currency, items, series, change30d, change30dPct } = overview;
  const topMovers = [...items].filter((i) => i.change30d != null).sort((a, b) => (a.change30d ?? 0) - (b.change30d ?? 0)).slice(0, 3);
  const dailyTotal = totals.dailyCost;

  if (!items.length) {
    return (
      <>
        <PageHeader index="000" title="Обзор" description="Финансовый портфель ваших вещей." />
        <EmptyState
          title="Ваш портфель пуст."
          description="Начните с того, что у вас уже есть. Вы увидите, сколько это стоит сегодня, сколько потеряло в цене и во сколько обходится владение каждый день."
          action={
            <>
              <ButtonLink href="/app/assets/new?method=camera" variant="accent">
                Отсканировать первый актив
              </ButtonLink>
              <ButtonLink href="/app/assets/new?method=manual" variant="outline">
                Добавить вручную
              </ButtonLink>
              <form action={loadDemoPortfolioAction}>
                <Button type="submit" variant="ghost">
                  Попробовать на демо-портфеле →
                </Button>
              </form>
            </>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        index="001"
        title="Ваши активы"
        description={`${plural(totals.assetCount, ["предмет", "предмета", "предметов"])} · ${totals.valuedCount} с оценкой · ${formatMoney(totals.expensesTotal, currency)} доп. расходов`}
        action={
          <ButtonLink href="/app/assets/new" variant="accent" className="hidden lg:inline-flex">
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> Добавить актив
          </ButtonLink>
        }
      />

      <section className="grid gap-px border border-hair bg-hair sm:grid-cols-2 lg:grid-cols-4" aria-label="Сводка по портфелю">
        <div className="col-span-full bg-ink px-5 py-6 text-paper sm:col-span-2 lg:col-span-2 lg:px-7 lg:py-8">
          <span className="label-mono text-paper/60">Текущая стоимость</span>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
            <Money amount={totals.currentValue} currency={currency} animate className="text-[2.4rem] font-extrabold leading-none display-tight sm:text-6xl" />
            <Delta amount={change30d} ratio={change30dPct} currency={currency} size="md" className="mb-1 [&>*]:text-paper [&>*:last-child]:text-paper/60" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="label-mono text-paper/60">За 30 дней</span>
            <span className="h-px flex-1 bg-paper/20" />
            <span className="label-mono text-orange">Диапазон оценки ±{formatPercent(rangeWidth(items))}</span>
          </div>
        </div>
        <div className="bg-paper px-5 py-5 lg:px-6">
          <Stat label="Куплено за" value={<Money amount={totals.purchaseValue} currency={currency} />} size="md" />
          <div className="mt-4 border-t border-hair pt-3">
            <Stat label="Доп. расходы" value={<Money amount={totals.expensesTotal} currency={currency} />} size="sm" />
          </div>
        </div>
        <div className="bg-paper px-5 py-5 lg:px-6">
          <Stat label="Общее обесценивание" value={<Money amount={totals.depreciation} currency={currency} signed />} size="md" tone={totals.depreciation < 0 ? "negative" : "positive"} sub={<Delta ratio={totals.depreciationPct} currency={currency} />} />
          <div className="mt-4 border-t border-hair pt-3">
            <Stat label="Стоимость владения" value={<span className="tnum">{formatMoney(dailyTotal, currency, { decimals: 0 })}<span className="text-sm font-semibold text-gray"> / день</span></span>} size="sm" />
          </div>
        </div>
      </section>

      <Panel className="mt-4">
        <PortfolioChart series={series} currency={currency} />
      </Panel>

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-3">
        <Panel className="min-w-0 lg:col-span-2">
          <PanelHeader
            index="002"
            title="Активы"
            action={
              <Link href="/app/assets" className="label-mono-md flex items-center gap-1 text-ink hover:text-orange">
                Все активы <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            }
          />
          {[...items]
            .sort((a, b) => (b.metrics.currentValue ?? 0) - (a.metrics.currentValue ?? 0))
            .slice(0, 6)
            .map((item, i) => (
              <AssetRow key={item.asset.id} asset={item.asset} metrics={item.metrics} currency={currency} index={i} change30d={item.change30d} />
            ))}
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel tone="orange" className="p-5">
            <span className="label-mono text-ink/70">Стоимость владения</span>
            <p className="tnum mt-2 text-4xl font-extrabold display-tight">{formatMoney(dailyTotal, currency, { decimals: 0 })}<span className="text-base font-semibold"> / день</span></p>
            <p className="mt-3 text-[13px] leading-relaxed text-ink/80">
              Во сколько вам в среднем обходится владение всем портфелем каждый день: цена покупки плюс расходы минус то, сколько вещи стоят сейчас.
            </p>
            <Link href="/app/insights" className="label-mono-md mt-4 inline-flex items-center gap-1 border-b border-ink pb-0.5 hover:text-paper hover:border-paper">
              Аналитика <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </Panel>

          <Panel>
            <PanelHeader index="003" title="Движение за 30 дней" />
            {topMovers.length ? (
              topMovers.map(({ asset, change30d, metrics }) => (
                <Link key={asset.id} href={`/app/assets/${asset.id}`} className="flex items-center justify-between gap-3 border-b border-hair px-5 py-3 last:border-b-0 hover:bg-black/[0.03]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{asset.name}</p>
                    <p className="label-mono text-gray-2">{metrics.currentValue != null ? formatMoney(metrics.currentValue, currency) : "—"}</p>
                  </div>
                  <Delta amount={change30d} currency={currency} />
                </Link>
              ))
            ) : (
              <p className="px-5 py-6 text-sm text-gray">Движение появится после первой переоценки активов.</p>
            )}
          </Panel>
        </div>
      </div>
      <p className="mt-6 text-[12px] text-gray-2">Рыночная стоимость — оценка на основе доступных рыночных данных; фактическая цена продажи может отличаться.</p>
    </>
  );
}

function rangeWidth(items: { metrics: { currentValue: number | null; lowEstimate: number | null; highEstimate: number | null } }[]): number {
  let est = 0;
  let width = 0;
  for (const { metrics } of items) {
    if (metrics.currentValue == null || metrics.lowEstimate == null || metrics.highEstimate == null) continue;
    est += metrics.currentValue;
    width += (metrics.highEstimate - metrics.lowEstimate) / 2;
  }
  return est ? width / est : 0;
}
