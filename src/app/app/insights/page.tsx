import type { Metadata } from "next";
import Link from "next/link";
import { AssetThumb } from "@/components/assets/asset-row";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "@/components/ui/icons";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Delta, Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { buildValuationRequest } from "@/features/assets/service";
import { buildRecommendation, type Recommendation } from "@/features/insights/keep-sell";
import { availableMonths, buildMonthlyReport, previousMonthKey } from "@/features/insights/report";
import { getPortfolioOverview } from "@/features/portfolio/service";
import { ensureProfile } from "@/features/profile/service";
import { track } from "@/lib/analytics";
import { annualisedRate } from "@/lib/finance";
import { formatMoney, formatPercent, plural } from "@/lib/format";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { getValuationEngine } from "@/valuation";
import { MonthPicker } from "@/components/insights/month-picker";

export const metadata: Metadata = { title: "Аналитика" };
export const dynamic = "force-dynamic";

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  const overview = await getPortfolioOverview(store, user.id, profile);
  const cur = overview.currency;

  if (!overview.items.length) {
    return (
      <>
        <PageHeader index="004" title="Аналитика" />
        <EmptyState title="Пока нечего анализировать." description="Добавьте несколько активов — и мы покажем, что дешевеет быстрее всего, что стоит продать и во сколько обошёлся каждый месяц." action={<ButtonLink href="/app/assets/new" variant="accent">Добавить актив</ButtonLink>} />
      </>
    );
  }

  const engine = getValuationEngine();
  const recs: { asset: (typeof overview.items)[number]["asset"]; rec: Recommendation; metrics: (typeof overview.items)[number]["metrics"] }[] = [];
  for (const { asset, metrics } of overview.items) {
    const valuation = await engine.value(buildValuationRequest(asset, profile));
    recs.push({ asset, metrics, rec: buildRecommendation({ asset, valuation, displayCurrency: cur }) });
  }
  track("sell_recommendation_viewed", { count: recs.length });
  const sellCandidates = recs.filter((r) => r.rec.verdict === "strong_sell" || r.rec.verdict === "consider_selling").sort((a, b) => b.rec.score - a.rec.score);
  const holds = recs.filter((r) => r.rec.verdict === "hold");

  const history = await store.listValueHistory(user.id);
  const months = availableMonths(overview.items);
  const selectedMonth = month && months.includes(month) ? month : months.includes(previousMonthKey()) ? previousMonthKey() : months[0];
  const report = selectedMonth ? buildMonthlyReport(overview.items, history, cur, selectedMonth) : null;

  const fastest = [...overview.items]
    .filter((i) => i.metrics.depreciationPct != null)
    .map((i) => ({ ...i, annual: annualisedRate(i.metrics.depreciationPct ?? 0, i.metrics.daysOwned) }))
    .sort((a, b) => a.annual - b.annual)
    .slice(0, 5);
  const costliest = [...overview.items].filter((i) => i.metrics.dailyCost != null).sort((a, b) => (b.metrics.dailyCost ?? 0) - (a.metrics.dailyCost ?? 0)).slice(0, 5);

  return (
    <>
      <PageHeader index="004" title="Аналитика" description="Что теряет в цене, что стоит продать и во сколько на самом деле обошёлся каждый месяц." />

      {report ? (
        <Panel tone="ink" className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-paper/15 px-5 py-4">
            <div>
              <span className="label-mono text-paper/60">Ежемесячный отчёт</span>
              <h2 className="text-2xl font-extrabold display-tight">{report.label}</h2>
            </div>
            <MonthPicker months={months} value={report.month} />
          </div>
          <div className="grid gap-px bg-paper/15 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-ink px-5 py-5">
              <Stat label={<span className="text-paper/60">Стоимость портфеля</span>} value={<span className="text-paper">{formatMoney(report.portfolioValue, cur)}</span>} sub={<Delta amount={report.change} ratio={report.changePct} currency={cur} className="[&>*]:text-paper [&>*:last-child]:text-paper/60" />} />
            </div>
            <ReportCell label="Самая большая потеря" name={report.biggestLoss?.asset.name} value={report.biggestLoss ? formatMoney(report.biggestLoss.change, cur, { signed: true }) : "—"} tone="negative" href={report.biggestLoss ? `/app/assets/${report.biggestLoss.asset.id}` : undefined} />
            <ReportCell label="Лучший результат" name={report.bestPerformer?.asset.name} value={report.bestPerformer ? formatMoney(report.bestPerformer.change, cur, { signed: true }) : "—"} tone={report.bestPerformer && report.bestPerformer.change >= 0 ? "positive" : "neutral"} href={report.bestPerformer ? `/app/assets/${report.bestPerformer.asset.id}` : undefined} />
            <ReportCell label="Дороже всего во владении" name={report.mostExpensiveToOwn?.asset.name} value={report.mostExpensiveToOwn ? `${formatMoney(report.mostExpensiveToOwn.dailyCost, cur, { decimals: 0 })}/день` : "—"} tone="orange" href={report.mostExpensiveToOwn ? `/app/assets/${report.mostExpensiveToOwn.asset.id}` : undefined} />
          </div>
        </Panel>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader index="S" title="Стоит ли продавать?" subtitle={`${plural(sellCandidates.length, ["предмет стоит", "предмета стоит", "предметов стоит"])} рассмотреть · ${holds.length} держать`} />
          {sellCandidates.length ? (
            sellCandidates.map(({ asset, rec }) => (
              <Link key={asset.id} href={`/app/assets/${asset.id}#insights`} className="flex items-center gap-4 border-b border-hair px-5 py-3.5 last:border-b-0 hover:bg-black/[0.03]">
                <AssetThumb asset={asset} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{asset.name}</p>
                  <p className="truncate text-[12px] text-gray">{rec.reasons[0] ?? rec.summary}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge tone={rec.verdict === "strong_sell" ? "orange" : "outline"}>{rec.verdict === "strong_sell" ? "Продавать" : "Подумать"}</Badge>
                  {rec.expectedSale != null ? <span className="tnum text-[12px] text-gray">≈ {formatMoney(rec.expectedSale, cur)}</span> : null}
                </div>
              </Link>
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-gray">Ничего срочно продавать не нужно. Держать выглядит разумно по всему портфелю.</p>
          )}
          {holds.length ? (
            <div className="border-t border-hair px-5 py-3">
              <span className="label-mono text-gray-2">Держать: {holds.map((h) => h.asset.name).join(", ")}</span>
            </div>
          ) : null}
        </Panel>

        <Panel>
          <PanelHeader index="F" title="Быстрее всего дешевеют" subtitle="Годовой темп потери стоимости с момента покупки" />
          {fastest.map(({ asset, metrics, annual }) => (
            <Link key={asset.id} href={`/app/assets/${asset.id}`} className="flex items-center gap-4 border-b border-hair px-5 py-3.5 last:border-b-0 hover:bg-black/[0.03]">
              <AssetThumb asset={asset} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{asset.name}</p>
                <p className="label-mono text-gray-2">{formatMoney(metrics.depreciation ?? 0, cur, { signed: true })} всего</p>
              </div>
              <span className="tnum text-sm font-bold text-orange-3">{formatPercent(annual, { signed: true })}<span className="label-mono ml-1 text-gray-2">/год</span></span>
            </Link>
          ))}
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader index="C" title="Дороже всего во владении" subtitle="Цена покупки + расходы − текущая стоимость, за день владения" />
          <div className="grid gap-px bg-hair sm:grid-cols-2 lg:grid-cols-5">
            {costliest.map(({ asset, metrics }, i) => (
              <Link key={asset.id} href={`/app/assets/${asset.id}`} className={`${i === 0 ? "bg-orange hover:bg-orange-2" : "bg-paper hover:bg-black/[0.03]"} flex flex-col gap-3 p-5`}>
                <span className="label-mono text-gray">{String(i + 1).padStart(2, "0")}</span>
                <p className="text-sm font-bold leading-tight">{asset.name}</p>
                <p className="tnum mt-auto text-2xl font-extrabold display-tight">{formatMoney(metrics.dailyCost ?? 0, cur, { decimals: 0 })}<span className="text-xs font-semibold text-gray"> /день</span></p>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <p className="mt-6 flex flex-wrap items-center gap-2 text-[12px] text-gray-2">
        Рекомендации — вероятностная оценка рыночных сигналов, а не финансовый совет.
        <Link href="/app/settings" className="inline-flex items-center gap-1 text-gray hover:text-ink">
          Источники оценки <ArrowRight className="h-3 w-3" aria-hidden="true" />
        </Link>
      </p>
    </>
  );
}

function ReportCell({ label, name, value, tone, href }: { label: string; name?: string; value: string; tone: "negative" | "positive" | "orange" | "neutral"; href?: string }) {
  const color = tone === "negative" ? "text-orange-2" : tone === "positive" ? "text-[#7ee2a0]" : tone === "orange" ? "text-orange" : "text-paper";
  const inner = (
    <>
      <span className="label-mono text-paper/60">{label}</span>
      <p className="mt-1 truncate text-sm font-semibold text-paper">{name ?? "Недостаточно данных"}</p>
      <p className={`tnum mt-2 text-2xl font-extrabold display-tight ${color}`}>{value}</p>
    </>
  );
  return href ? (
    <Link href={href} className="bg-ink px-5 py-5 hover:bg-ink-2">
      {inner}
    </Link>
  ) : (
    <div className="bg-ink px-5 py-5">{inner}</div>
  );
}
