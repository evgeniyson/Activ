import { convert, type CurrencyCode } from "@/lib/currency";
import { firstOfMonth, formatMonth, monthKey, toISODate } from "@/lib/dates";
import type { AssetMetrics, Asset, AssetValueHistory } from "@/types/domain";

export interface MonthlyReport {
  month: string; // YYYY-MM
  label: string;
  portfolioValue: number;
  change: number;
  changePct: number;
  biggestLoss: { asset: Asset; change: number } | null;
  bestPerformer: { asset: Asset; change: number } | null;
  mostExpensiveToOwn: { asset: Asset; dailyCost: number } | null;
  perAsset: { asset: Asset; start: number | null; end: number | null; change: number | null }[];
  currency: CurrencyCode;
}

/** Report for a calendar month, derived from value history. */
export function buildMonthlyReport(
  items: { asset: Asset; metrics: AssetMetrics }[],
  history: AssetValueHistory[],
  currency: CurrencyCode,
  month: string,
): MonthlyReport {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day of month
  const startISO = toISODate(start);
  const endISO = toISODate(end);
  const byAsset = new Map<string, AssetValueHistory[]>();
  for (const h of history) {
    const arr = byAsset.get(h.assetId) ?? [];
    arr.push(h);
    byAsset.set(h.assetId, arr);
  }
  const latestOnOrBefore = (hist: AssetValueHistory[], date: string) => {
    let f: AssetValueHistory | null = null;
    for (const h of [...hist].sort((a, b) => a.date.localeCompare(b.date))) if (h.date <= date) f = h;
    return f;
  };

  const perAsset = items
    .filter(({ asset }) => asset.purchaseDate <= endISO)
    .map(({ asset }) => {
      const hist = byAsset.get(asset.id) ?? [];
      const s = latestOnOrBefore(hist, startISO);
      const e = latestOnOrBefore(hist, endISO);
      const startV = s ? convert(s.estimatedValue, s.currency, currency) : null;
      const endV = e ? convert(e.estimatedValue, e.currency, currency) : null;
      const owned = asset.purchaseDate <= startISO;
      return { asset, start: owned ? startV : null, end: endV, change: owned && startV != null && endV != null ? endV - startV : null };
    });

  const portfolioValue = perAsset.reduce((s, x) => s + (x.end ?? 0), 0);
  const startValue = perAsset.reduce((s, x) => s + (x.start ?? 0), 0);
  const change = perAsset.reduce((s, x) => s + (x.change ?? 0), 0);
  const changed = perAsset.filter((x) => x.change != null) as { asset: Asset; change: number }[];
  const biggestLoss = changed.length ? changed.reduce((a, b) => (b.change < a.change ? b : a)) : null;
  const bestPerformer = changed.length ? changed.reduce((a, b) => (b.change > a.change ? b : a)) : null;
  const withCost = items.filter((i) => i.metrics.dailyCost != null);
  const mostExpensiveToOwn = withCost.length ? withCost.reduce((a, b) => ((b.metrics.dailyCost ?? 0) > (a.metrics.dailyCost ?? 0) ? b : a)) : null;

  return {
    month,
    label: formatMonth(start),
    portfolioValue: Math.round(portfolioValue),
    change: Math.round(change),
    changePct: startValue > 0 ? change / startValue : 0,
    biggestLoss: biggestLoss && biggestLoss.change < 0 ? { asset: biggestLoss.asset, change: Math.round(biggestLoss.change) } : null,
    bestPerformer: bestPerformer && bestPerformer.change > (biggestLoss?.change ?? -Infinity) ? { asset: bestPerformer.asset, change: Math.round(bestPerformer.change) } : null,
    mostExpensiveToOwn: mostExpensiveToOwn ? { asset: mostExpensiveToOwn.asset, dailyCost: mostExpensiveToOwn.metrics.dailyCost ?? 0 } : null,
    perAsset,
    currency,
  };
}

export function previousMonthKey(now = new Date()): string {
  const d = firstOfMonth(now);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return monthKey(d);
}

export function availableMonths(items: { asset: Asset }[], now = new Date()): string[] {
  const earliest = items.reduce<string | null>((min, { asset }) => (!min || asset.purchaseDate < min ? asset.purchaseDate : min), null);
  if (!earliest) return [];
  const out: string[] = [];
  const first = firstOfMonth(new Date(`${earliest}T00:00:00Z`));
  const cursor = firstOfMonth(now);
  while (cursor >= first && out.length < 36) {
    out.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return out;
}
