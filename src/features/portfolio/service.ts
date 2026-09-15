import "server-only";
import { convert, type CurrencyCode } from "@/lib/currency";
import { DAY_MS, addDays, parseISODate, startOfDayUTC, toISODate } from "@/lib/dates";
import { computeAssetMetrics, computePortfolioTotals, type PortfolioTotals } from "@/lib/finance";
import type { DataStore, NewSnapshot } from "@/services/data/store";
import type { Asset, AssetExpense, AssetMetrics, AssetValueHistory, PortfolioSnapshot, Profile } from "@/types/domain";
import { revalueAsset } from "@/features/assets/service";

export interface PortfolioItem {
  asset: Asset;
  metrics: AssetMetrics;
  /** 30-day change in display currency (from history) */
  change30d: number | null;
}

export interface ChartPoint {
  date: string;
  value: number;
  purchase: number;
}

export interface PortfolioOverview {
  items: PortfolioItem[];
  totals: PortfolioTotals;
  change30d: number;
  change30dPct: number;
  series: ChartPoint[];
  currency: CurrencyCode;
}

/** Ensure every active asset has a valuation for today (cheap when cached). */
export async function refreshPortfolioValuations(store: DataStore, userId: string, profile: Profile, assets: Asset[]): Promise<Asset[]> {
  const out: Asset[] = [];
  for (const a of assets) {
    if (a.status !== "active") {
      out.push(a);
      continue;
    }
    const { asset } = await revalueAsset(store, userId, a, profile);
    out.push(asset);
  }
  return out;
}

export async function getPortfolioOverview(store: DataStore, userId: string, profile: Profile, now = new Date()): Promise<PortfolioOverview> {
  const currency = profile.preferredCurrency;
  const rawAssets = await store.listAssets(userId, { status: "active" });
  const assets = await refreshPortfolioValuations(store, userId, profile, rawAssets);
  const [expenses, history] = await Promise.all([store.listExpenses(userId), store.listValueHistory(userId)]);

  const expensesByAsset = groupBy(expenses, (e) => e.assetId);
  const historyByAsset = groupBy(history, (h) => h.assetId);

  const items: PortfolioItem[] = assets.map((asset) => {
    const metrics = computeAssetMetrics(asset, expensesByAsset.get(asset.id) ?? [], currency, now);
    const change30d = changeOver(historyByAsset.get(asset.id) ?? [], 30, currency, now);
    return { asset, metrics, change30d };
  });
  const totals = computePortfolioTotals(items, currency);

  const series = buildSeries(assets, historyByAsset, currency, now, 365);
  await syncSnapshots(store, userId, series, currency, assets.length, now);

  const today = series[series.length - 1]?.value ?? totals.currentValue;
  const past = valueAt(series, toISODate(addDays(now, -30))) ?? today;
  const change30d = today - past;
  return { items, totals, change30d, change30dPct: past > 0 ? change30d / past : 0, series, currency };
}

/** Step-interpolated portfolio value per day from asset value histories. */
export function buildSeries(assets: Asset[], historyByAsset: Map<string, AssetValueHistory[]>, currency: CurrencyCode, now: Date, days: number): ChartPoint[] {
  const end = startOfDayUTC(now);
  const earliest = assets.reduce<Date | null>((min, a) => {
    const d = parseISODate(a.purchaseDate);
    return !min || d < min ? d : min;
  }, null);
  if (!earliest) return [];
  const start = new Date(Math.max(earliest.getTime(), end.getTime() - days * DAY_MS));
  const points: ChartPoint[] = [];
  const sortedHist = new Map<string, AssetValueHistory[]>();
  for (const a of assets) sortedHist.set(a.id, [...(historyByAsset.get(a.id) ?? [])].sort((x, y) => x.date.localeCompare(y.date)));

  for (let t = start.getTime(); t <= end.getTime(); t += DAY_MS) {
    const date = toISODate(new Date(t));
    let value = 0;
    let purchase = 0;
    for (const a of assets) {
      if (a.purchaseDate > date) continue;
      purchase += convert(a.purchasePrice, a.purchaseCurrency, currency);
      const h = latestOnOrBefore(sortedHist.get(a.id) ?? [], date);
      if (h) value += convert(h.estimatedValue, h.currency, currency);
      else if (a.currentEstimatedValue != null && date === toISODate(end)) value += convert(a.currentEstimatedValue, a.valuationCurrency, currency);
      else value += convert(a.purchasePrice, a.purchaseCurrency, currency);
    }
    // Today's point uses the live valuation for consistency with the headline number.
    if (date === toISODate(end)) {
      value = assets.reduce((s, a) => s + (a.currentEstimatedValue != null ? convert(a.currentEstimatedValue, a.valuationCurrency, currency) : 0), 0);
    }
    points.push({ date, value: Math.round(value), purchase: Math.round(purchase) });
  }
  return points;
}

async function syncSnapshots(store: DataStore, userId: string, series: ChartPoint[], currency: CurrencyCode, assetCount: number, now: Date) {
  if (!series.length) return;
  const from = series[0].date;
  const existing = await store.listSnapshots(userId, { from });
  const have = new Set(existing.map((s) => `${s.date}:${s.currency}`));
  const today = toISODate(now);
  const missing: NewSnapshot[] = [];
  for (const p of series) {
    if (p.date !== today && have.has(`${p.date}:${currency}`)) continue;
    missing.push({ date: p.date, totalValue: p.value, purchaseValue: p.purchase, totalDepreciation: p.value - p.purchase, currency, assetCount });
  }
  if (missing.length) await store.upsertSnapshots(userId, missing.slice(-400));
}

export function snapshotsToSeries(snaps: PortfolioSnapshot[]): ChartPoint[] {
  return snaps.map((s) => ({ date: s.date, value: s.totalValue, purchase: s.purchaseValue }));
}

function latestOnOrBefore(hist: AssetValueHistory[], date: string): AssetValueHistory | null {
  let found: AssetValueHistory | null = null;
  for (const h of hist) {
    if (h.date <= date) found = h;
    else break;
  }
  return found;
}

export function changeOver(hist: AssetValueHistory[], days: number, currency: CurrencyCode, now: Date): number | null {
  if (hist.length < 2) return null;
  const sorted = [...hist].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1];
  const past = latestOnOrBefore(sorted, toISODate(addDays(now, -days)));
  if (!past || past.id === latest.id) return null;
  return convert(latest.estimatedValue, latest.currency, currency) - convert(past.estimatedValue, past.currency, currency);
}

function valueAt(series: ChartPoint[], date: string): number | null {
  let v: number | null = null;
  for (const p of series) {
    if (p.date <= date) v = p.value;
    else break;
  }
  return v;
}

function groupBy<T>(list: T[], key: (t: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const item of list) {
    const k = key(item);
    const arr = m.get(k);
    if (arr) arr.push(item);
    else m.set(k, [item]);
  }
  return m;
}

export type { AssetExpense };
