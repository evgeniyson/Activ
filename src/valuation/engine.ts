import { roundMarketPrice } from "@/lib/currency";
import { addDays, toISODate } from "@/lib/dates";
import type { ValuationSource } from "@/types/domain";
import { EbayProvider } from "./providers/ebay";
import { InternalPricingProvider } from "./providers/internal";
import { ManualProvider } from "./providers/manual";
import { MarketplaceProvider } from "./providers/marketplace";
import type { MarketTrend, ProviderEstimate, ValuationProvider, ValuationRequest, ValuationResult } from "./types";

export class ValuationEngine {
  constructor(private readonly providers: ValuationProvider[]) {}

  get availableProviders(): ValuationProvider[] {
    return this.providers.filter((p) => p.isAvailable());
  }

  describeSources(): ValuationSource[] {
    return this.providers.map((p) => ({
      id: p.id,
      name: p.name,
      description: describe(p.id),
      enabled: p.isAvailable(),
      weight: p.weight,
    }));
  }

  /** Blend all available providers into a single estimate. */
  async value(req: ValuationRequest): Promise<ValuationResult | null> {
    const asOf = req.asOf ?? new Date();
    const estimates = await this.collect({ ...req, asOf });
    if (!estimates.length) return null;
    const blended = blend(estimates, req.currency);

    // Trend: compare against the same request 30 / 90 days earlier.
    // Only providers that support historical evaluation contribute; we ask
    // the same providers so the comparison is apples-to-apples.
    const [past30, past90] = await Promise.all([
      this.collect({ ...req, asOf: addDays(asOf, -30), manualOverride: null }),
      this.collect({ ...req, asOf: addDays(asOf, -90), manualOverride: null }),
    ]);
    const nowInternal = estimates.filter((e) => e.source !== "manual");
    const trend30d = ratio(nowInternal, past30, req.currency);
    const trend90d = ratio(nowInternal, past90, req.currency);

    return {
      ...blended,
      valuationDate: toISODate(asOf),
      trend30d,
      trend90d,
      marketTrend: classifyTrend(trend30d, trend90d),
      matchedCatalogId: estimates.find((e) => e.matchedCatalogId)?.matchedCatalogId ?? null,
      notes: estimates.flatMap((e) => e.notes ?? []),
    };
  }

  /** Cheap point estimate for history backfill: no trend computation. */
  async valueAt(req: ValuationRequest, asOf: Date): Promise<ProviderEstimate | null> {
    const estimates = await this.collect({ ...req, asOf, manualOverride: null });
    if (!estimates.length) return null;
    const b = blend(estimates, req.currency);
    return {
      source: estimates.length === 1 ? estimates[0].source : "internal",
      estimatedValue: b.estimatedValue,
      lowEstimate: b.lowEstimate,
      highEstimate: b.highEstimate,
      quickSaleEstimate: b.quickSaleEstimate,
      confidence: b.confidence,
      comparablesCount: b.comparablesCount,
      currency: req.currency,
    };
  }

  private async collect(req: ValuationRequest): Promise<ProviderEstimate[]> {
    const results = await Promise.allSettled(this.availableProviders.map((p) => p.estimate(req)));
    const out: ProviderEstimate[] = [];
    for (const r of results) {
      if (r.status === "fulfilled" && r.value && Number.isFinite(r.value.estimatedValue) && r.value.estimatedValue > 0) out.push(r.value);
    }
    return out;
  }
}

function blend(estimates: ProviderEstimate[], currency: ValuationRequest["currency"]) {
  const weights = estimates.map((e) => weightOf(e.source) * Math.max(0.05, e.confidence));
  const total = weights.reduce((a, b) => a + b, 0);
  const wavg = (pick: (e: ProviderEstimate) => number) => estimates.reduce((s, e, i) => s + pick(e) * weights[i], 0) / total;
  const est = wavg((e) => e.estimatedValue);
  // Confidence rises slightly when independent sources agree.
  const maxConf = Math.max(...estimates.map((e) => e.confidence));
  const spread = estimates.length > 1 ? (Math.max(...estimates.map((e) => e.estimatedValue)) - Math.min(...estimates.map((e) => e.estimatedValue))) / est : 0;
  const agreementBonus = estimates.length > 1 ? Math.max(0, 0.06 - spread * 0.3) : 0;
  const confidence = Math.min(0.96, maxConf + agreementBonus);
  return {
    estimatedValue: roundMarketPrice(est, currency),
    lowEstimate: roundMarketPrice(Math.min(wavg((e) => e.lowEstimate), est), currency),
    highEstimate: roundMarketPrice(Math.max(wavg((e) => e.highEstimate), est), currency),
    quickSaleEstimate: roundMarketPrice(wavg((e) => e.quickSaleEstimate), currency),
    confidence: Math.round(confidence * 100) / 100,
    comparablesCount: estimates.reduce((s, e) => s + e.comparablesCount, 0),
    currency,
    sources: estimates.map((e, i) => ({ id: e.source, value: e.estimatedValue, confidence: e.confidence, weight: Math.round((weights[i] / total) * 100) / 100 })),
  };
}

function ratio(now: ProviderEstimate[], past: ProviderEstimate[], currency: ValuationRequest["currency"]): number | null {
  if (!now.length || !past.length) return null;
  const a = blend(now, currency).estimatedValue;
  const b = blend(past, currency).estimatedValue;
  if (!b) return null;
  return Math.round((a / b - 1) * 1000) / 1000;
}

function classifyTrend(t30: number | null, t90: number | null): MarketTrend {
  const t = t30 ?? (t90 == null ? null : t90 / 3);
  if (t == null) return "stable";
  if (t <= -0.04) return "falling_fast";
  if (t <= -0.012) return "falling";
  if (t >= 0.012) return "rising";
  return "stable";
}

const WEIGHTS: Record<ProviderEstimate["source"], number> = {
  internal: 1,
  ebay: 1.4,
  marketplace: 1.2,
  manual: 3,
  mock: 0.5,
};
function weightOf(source: ProviderEstimate["source"]) {
  return WEIGHTS[source] ?? 1;
}

function describe(id: ProviderEstimate["source"]): string {
  switch (id) {
    case "internal":
      return "Детерминированная модель: цена на старте продаж, возраст продукта, состояние, регион и сезонность.";
    case "ebay":
      return "Медиана активных объявлений eBay в вашем регионе.";
    case "marketplace":
      return "Партнёрский ценовой фид (Авито и др.).";
    case "manual":
      return "Значения, которые вы указали сами: по предложению покупателя или оценке.";
    case "mock":
      return "Детерминированная заглушка для тестов.";
  }
}

let engine: ValuationEngine | null = null;
/** Default engine: every provider is registered; unavailable ones are skipped at runtime. */
export function getValuationEngine(): ValuationEngine {
  if (!engine) {
    engine = new ValuationEngine([new ManualProvider(), new InternalPricingProvider(), new EbayProvider(), new MarketplaceProvider()]);
  }
  return engine;
}
