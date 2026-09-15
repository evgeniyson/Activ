import { CURRENCIES, convert, roundMarketPrice } from "@/lib/currency";
import { monthsBetween, parseISODate } from "@/lib/dates";
import { signedHash } from "@/lib/hash";
import { getCatalogProduct, matchCatalog, pickVariant, type CatalogProduct, type CatalogVariant } from "../catalog";
import {
  BRAND_RETENTION,
  CATEGORY_CURVES,
  CONDITION_FACTORS,
  REGION_FACTORS,
  brandRetention,
  curveRatio,
  seasonalFactor,
  successorPressure,
} from "../depreciation";
import type { ProviderEstimate, ValuationProvider, ValuationRequest } from "../types";

/**
 * Deterministic internal pricing model.
 *
 *   value = launchPrice
 *         × curve(product age)        — category depreciation curve
 *         × brand retention           — Apple/Fujifilm hold value better
 *         × successor pressure        — newer generation on the market
 *         × condition factor
 *         × region factor
 *         × seasonal + product noise  — deterministic, hash based
 *
 * The same request always produces the same answer for the same `asOf`
 * date, so history can be backfilled and charts never "jump".
 */
export class InternalPricingProvider implements ValuationProvider {
  readonly id = "internal" as const;
  readonly name = "Внутренняя модель";
  readonly weight = 1;

  isAvailable() {
    return true;
  }

  async estimate(req: ValuationRequest): Promise<ProviderEstimate | null> {
    const asOf = req.asOf ?? new Date();
    const matched = resolveProduct(req);
    if (matched) return this.fromCatalog(req, matched.product, matched.variant, matched.score, asOf);
    return this.fromPurchase(req, asOf);
  }

  private fromCatalog(
    req: ValuationRequest,
    product: CatalogProduct,
    variant: CatalogVariant | null,
    matchScore: number,
    asOf: Date,
  ): ProviderEstimate {
    const launch = variant?.launchPriceEur ?? product.launchPriceEur;
    const release = parseISODate(product.releaseDate);
    const ageMonths = Math.max(0, monthsBetween(release, asOf));
    const curve = CATEGORY_CURVES[product.category];
    let ratio = curveRatio(curve, ageMonths) * brandRetention(product.manufacturer);

    const successor = getCatalogProduct(product.successorId);
    if (successor) {
      const sinceSuccessor = monthsBetween(parseISODate(successor.releaseDate), asOf);
      ratio *= successorPressure(sinceSuccessor >= 0 ? sinceSuccessor : null);
    }
    // Demand keeps prices firmer; low liquidity softens them.
    ratio *= 0.95 + product.demand * 0.1;
    ratio *= product.retentionBoost ?? 1;
    ratio = Math.min(0.97, ratio);

    const month = asOf.getUTCMonth();
    const noise = 1 + signedHash(`${product.id}:${asOf.getUTCFullYear()}-${month}`) * 0.02;
    const marketEur =
      launch * ratio * CONDITION_FACTORS[req.condition] * REGION_FACTORS[req.region] * seasonalFactor(product.category, month) * noise;

    // Confidence: strong catalog match, fresh product, liquid market.
    let confidence = 0.8 + product.liquidity * 0.1 + (variant ? 0.03 : 0);
    confidence *= 0.85 + matchScore * 0.15;
    if (ageMonths > 48) confidence -= 0.05;
    if (ageMonths > 84) confidence -= 0.08;
    confidence = clamp(confidence, 0.5, 0.94);

    const comparables = Math.max(
      4,
      Math.round((18 + product.liquidity * 70 + product.demand * 40) * (ageMonths > 60 ? 0.6 : 1) * (1 + signedHash(product.id + ":cmp") * 0.2)),
    );

    return finalize(req, marketEur, confidence, comparables, product, {
      notes: [
        `Сопоставлено с ${product.manufacturer} ${product.model}${variant ? ` (${variant.name})` : ""}.`,
        `Цена на старте продаж ${Math.round(launch * REGION_FACTORS[req.region] * convert(1, "EUR", req.currency)).toLocaleString("ru-RU")} ${CURRENCIES[req.currency].symbol} (${Math.round(launch).toLocaleString("ru-RU")} €), на рынке ${Math.round(ageMonths)} мес.`,
        successor ? `Уже доступно новое поколение (${successor.model}).` : "Преемника на рынке пока нет.",
      ],
    });
  }

  /**
   * Unknown product: infer a launch price from what the user paid, assuming
   * the item was new at purchase, then apply the category curve from the
   * purchase date onwards. Low confidence by design.
   */
  private fromPurchase(req: ValuationRequest, asOf: Date): ProviderEstimate | null {
    if (!req.purchasePrice || req.purchasePrice <= 0) return null;
    const curve = CATEGORY_CURVES[req.category] ?? CATEGORY_CURVES.other;
    const purchase = parseISODate(req.purchaseDate);
    const ageMonths = Math.max(0, monthsBetween(purchase, asOf));
    const priceEur = convert(req.purchasePrice, req.purchaseCurrency, "EUR");
    // Assume purchased in good/excellent condition; back out the condition factor at purchase.
    const launchEur = priceEur / Math.max(0.5, CONDITION_FACTORS[req.condition] * (1 - curve.launchDrop * 0.5));
    const retention = brandRetention(req.manufacturer);
    let ratio = curveRatio(curve, ageMonths) * retention;
    ratio = Math.min(0.95, ratio);
    const month = asOf.getUTCMonth();
    const key = `${req.manufacturer ?? ""}:${req.model ?? ""}`.toLowerCase();
    const noise = 1 + signedHash(`${key}:${asOf.getUTCFullYear()}-${month}`) * 0.02;
    const marketEur = launchEur * ratio * CONDITION_FACTORS[req.condition] * REGION_FACTORS[req.region] * seasonalFactor(req.category, month) * noise;
    const known = req.manufacturer && req.manufacturer.toLowerCase() in BRAND_RETENTION;
    const confidence = known ? 0.5 : 0.42;
    return finalize(req, marketEur, confidence, known ? 6 : 3, null, {
      notes: [
        "Модель не найдена в каталоге — оценка построена от вашей цены покупки и кривой амортизации категории.",
        "Укажите точную модель для большей точности или задайте стоимость вручную.",
      ],
    });
  }
}

export function resolveProduct(req: ValuationRequest): { product: CatalogProduct; variant: CatalogVariant | null; score: number } | null {
  const direct = getCatalogProduct(req.catalogId);
  if (direct) return { product: direct, variant: pickVariant(direct, req.variant, req.specs), score: 1 };
  const m = matchCatalog({
    manufacturer: req.manufacturer,
    model: req.model,
    variant: req.variant,
    category: req.category,
    specs: req.specs,
  });
  if (!m) return null;
  return { product: m.product, variant: m.variant, score: m.score };
}

function finalize(
  req: ValuationRequest,
  marketEur: number,
  confidence: number,
  comparables: number,
  product: CatalogProduct | null,
  extra: { notes: string[] },
): ProviderEstimate {
  const est = convert(marketEur, "EUR", req.currency);
  const halfWidth = 0.04 + (1 - confidence) * 0.2;
  const liquidity = product?.liquidity ?? 0.6;
  const quickRatio = 0.86 + liquidity * 0.06;
  return {
    source: "internal",
    estimatedValue: roundMarketPrice(est, req.currency),
    lowEstimate: roundMarketPrice(est * (1 - halfWidth), req.currency),
    highEstimate: roundMarketPrice(est * (1 + halfWidth), req.currency),
    quickSaleEstimate: roundMarketPrice(est * quickRatio, req.currency),
    confidence: round2(confidence),
    comparablesCount: comparables,
    currency: req.currency,
    notes: extra.notes,
    matchedCatalogId: product?.id ?? null,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}
function round2(v: number) {
  return Math.round(v * 100) / 100;
}
