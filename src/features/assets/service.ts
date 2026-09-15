import "server-only";
import { addMonths, daysBetween, formatDate, parseISODate, startOfDayUTC, toISODate } from "@/lib/dates";
import { computeAssetMetrics } from "@/lib/finance";
import type { DataStore, NewAsset, NewValueHistory } from "@/services/data/store";
import type { Asset, AssetEvent, AssetExpense, AssetImage, AssetMetrics, AssetValueHistory, Profile } from "@/types/domain";
import { getValuationEngine, type ValuationRequest, type ValuationResult } from "@/valuation";

export function buildValuationRequest(asset: Pick<Asset, "category" | "manufacturer" | "model" | "variant" | "specs" | "condition" | "catalogId" | "purchasePrice" | "purchaseCurrency" | "purchaseDate">, profile: Pick<Profile, "marketRegion" | "preferredCurrency">, asOf?: Date): ValuationRequest {
  return {
    category: asset.category,
    manufacturer: asset.manufacturer,
    model: asset.model,
    variant: asset.variant,
    specs: asset.specs ?? {},
    condition: asset.condition,
    catalogId: asset.catalogId,
    purchasePrice: asset.purchasePrice,
    purchaseCurrency: asset.purchaseCurrency,
    purchaseDate: asset.purchaseDate,
    region: profile.marketRegion,
    currency: profile.preferredCurrency,
    asOf,
  };
}

/** Run the engine and persist the result as the asset's current valuation + a history row. */
export async function revalueAsset(store: DataStore, userId: string, asset: Asset, profile: Profile, opts?: { force?: boolean; now?: Date }): Promise<{ asset: Asset; result: ValuationResult | null }> {
  const now = opts?.now ?? new Date();
  const today = toISODate(now);
  if (!opts?.force && asset.valuationDate === today && asset.currentEstimatedValue != null && asset.valuationCurrency === profile.preferredCurrency) {
    return { asset, result: null };
  }
  const engine = getValuationEngine();
  const result = await engine.value(buildValuationRequest(asset, profile, now));
  if (!result) return { asset, result: null };

  const updated = await store.updateAsset(userId, asset.id, {
    currentEstimatedValue: result.estimatedValue,
    currentLowEstimate: result.lowEstimate,
    currentHighEstimate: result.highEstimate,
    quickSaleValue: result.quickSaleEstimate,
    valuationConfidence: result.confidence,
    valuationCurrency: result.currency,
    valuationDate: result.valuationDate,
    catalogId: asset.catalogId ?? result.matchedCatalogId,
  });
  await store.addValueHistory(userId, [
    {
      assetId: asset.id,
      date: result.valuationDate,
      estimatedValue: result.estimatedValue,
      lowEstimate: result.lowEstimate,
      highEstimate: result.highEstimate,
      quickSaleEstimate: result.quickSaleEstimate,
      currency: result.currency,
      source: result.sources.length === 1 ? result.sources[0].id : "internal",
      confidence: result.confidence,
      comparablesCount: result.comparablesCount,
    },
  ]);
  return { asset: updated ?? asset, result };
}

/**
 * Build monthly valuation points from the purchase date up to (not including)
 * today so charts have a past. Deterministic, so re-running is idempotent
 * for the same inputs; we only backfill when the asset has no history yet.
 */
export async function backfillValueHistory(store: DataStore, userId: string, asset: Asset, profile: Profile, now = new Date()): Promise<AssetValueHistory[]> {
  const engine = getValuationEngine();
  const req = buildValuationRequest(asset, profile);
  const purchase = parseISODate(asset.purchaseDate);
  const entries: NewValueHistory[] = [];
  const today = startOfDayUTC(now);

  // Purchase-day point, then the first of each following month, then weekly for the last 8 weeks.
  const dates: Date[] = [purchase];
  let cursor = new Date(Date.UTC(purchase.getUTCFullYear(), purchase.getUTCMonth() + 1, 1));
  while (cursor < today) {
    dates.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  for (let w = 8; w >= 1; w--) {
    const d = new Date(today.getTime() - w * 7 * 86_400_000);
    if (d > purchase) dates.push(d);
  }
  const unique = [...new Map(dates.map((d) => [toISODate(d), d])).values()].sort((a, b) => a.getTime() - b.getTime()).filter((d) => d < today);

  for (const d of unique) {
    const est = await engine.valueAt(req, d);
    if (!est) continue;
    entries.push({
      assetId: asset.id,
      date: toISODate(d),
      estimatedValue: est.estimatedValue,
      lowEstimate: est.lowEstimate,
      highEstimate: est.highEstimate,
      quickSaleEstimate: est.quickSaleEstimate,
      currency: est.currency,
      source: est.source,
      confidence: est.confidence,
      comparablesCount: est.comparablesCount,
    });
  }
  return store.addValueHistory(userId, entries);
}

export interface CreateAssetInput extends Omit<NewAsset, "currentEstimatedValue" | "currentLowEstimate" | "currentHighEstimate" | "quickSaleValue" | "valuationConfidence" | "valuationCurrency" | "valuationDate" | "status" | "soldPrice" | "soldDate" | "coverImageUrl"> {
  coverImageUrl?: string | null;
}

export async function createAssetWithValuation(store: DataStore, userId: string, profile: Profile, input: CreateAssetInput) {
  const asset = await store.createAsset(userId, {
    ...input,
    coverImageUrl: input.coverImageUrl ?? null,
    currentEstimatedValue: null,
    currentLowEstimate: null,
    currentHighEstimate: null,
    quickSaleValue: null,
    valuationConfidence: null,
    valuationCurrency: profile.preferredCurrency,
    valuationDate: null,
    status: "active",
    soldPrice: null,
    soldDate: null,
  });
  await store.addEvent(userId, {
    assetId: asset.id,
    type: "purchased",
    date: asset.purchaseDate,
    title: "Покупка",
    description: asset.retailer ? `В ${asset.retailer}` : null,
    amount: asset.purchasePrice,
    currency: asset.purchaseCurrency,
    meta: null,
  });
  if (asset.warrantyExpiration) {
    await store.addEvent(userId, {
      assetId: asset.id,
      type: "warranty_added",
      date: asset.purchaseDate,
      title: "Добавлена гарантия",
      description: `Действует до ${formatDate(asset.warrantyExpiration)}`,
      amount: null,
      currency: null,
      meta: null,
    });
  }
  await backfillValueHistory(store, userId, asset, profile);
  const { asset: valued, result } = await revalueAsset(store, userId, asset, profile, { force: true });
  return { asset: valued, valuation: result };
}

export interface AssetDetail {
  asset: Asset;
  metrics: AssetMetrics;
  expenses: AssetExpense[];
  images: AssetImage[];
  history: AssetValueHistory[];
  events: AssetEvent[];
  valuation: ValuationResult | null;
  /** Timeline merges events + notable valuation points, newest first */
  timeline: TimelineItem[];
}

export interface TimelineItem {
  id: string;
  date: string;
  kind: AssetEvent["type"];
  title: string;
  description: string | null;
  amount: number | null;
  currency: Asset["purchaseCurrency"] | null;
}

export async function getAssetDetail(store: DataStore, userId: string, id: string, profile: Profile): Promise<AssetDetail | null> {
  let asset = await store.getAsset(userId, id);
  if (!asset) return null;
  let valuation: ValuationResult | null = null;
  if (asset.status === "active") {
    const r = await revalueAsset(store, userId, asset, profile);
    asset = r.asset;
    valuation = r.result;
  }
  const [expenses, images, history, events] = await Promise.all([
    store.listExpenses(userId, id),
    store.listImages(userId, id),
    store.listValueHistory(userId, id),
    store.listEvents(userId, { assetId: id }),
  ]);
  if (!valuation && asset.status === "active") {
    // Cached: recompute trend cheaply from history rather than re-running providers.
    valuation = await getValuationEngine().value(buildValuationRequest(asset, profile));
  }
  const metrics = computeAssetMetrics(asset, expenses, profile.preferredCurrency);
  return { asset, metrics, expenses, images, history, events, valuation, timeline: buildTimeline(events, history) };
}

export function buildTimeline(events: AssetEvent[], history: AssetValueHistory[]): TimelineItem[] {
  const items: TimelineItem[] = events.map((e) => ({
    id: e.id,
    date: e.date,
    kind: e.type,
    title: e.title,
    description: e.description,
    amount: e.amount,
    currency: e.currency,
  }));
  // Add quarterly valuation checkpoints (+ the latest) so the timeline shows the price journey.
  const byDate = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const picked: AssetValueHistory[] = [];
  let lastMonthKey = "";
  byDate.forEach((h, i) => {
    const d = parseISODate(h.date);
    const key = `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3)}`;
    const isLast = i === byDate.length - 1;
    if ((key !== lastMonthKey && i > 0) || isLast) {
      picked.push(h);
      lastMonthKey = key;
    }
  });
  for (const h of picked) {
    items.push({
      id: `h-${h.id}`,
      date: h.date,
      kind: "valuation",
      title: "Рыночная стоимость",
      description: h.source === "manual" ? "Задана вручную" : `Оценка · уверенность ${Math.round(h.confidence * 100)}%`,
      amount: h.estimatedValue,
      currency: h.currency,
    });
  }
  return items.sort((a, b) => b.date.localeCompare(a.date) || rank(b.kind) - rank(a.kind));
}

function rank(kind: AssetEvent["type"]) {
  return kind === "purchased" ? 0 : kind === "valuation" ? 1 : 2;
}

export function ownershipDays(asset: Asset, now = new Date()): number {
  return Math.max(1, daysBetween(parseISODate(asset.purchaseDate), now));
}
