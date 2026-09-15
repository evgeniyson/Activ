import { convert, type CurrencyCode } from "@/lib/currency";
import { daysBetween, monthsBetween, parseISODate } from "@/lib/dates";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Asset } from "@/types/domain";
import { getCatalogProduct, type ValuationResult } from "@/valuation";

export type Verdict = "hold" | "consider_selling" | "strong_sell" | "insufficient_data";

export interface Recommendation {
  verdict: Verdict;
  title: string;
  summary: string;
  reasons: string[];
  expectedSale: number | null;
  quickSale: number | null;
  /** 0..1 how strong the sell signal is */
  score: number;
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  hold: "Hold",
  consider_selling: "Consider Selling",
  strong_sell: "Strong Sell Opportunity",
  insufficient_data: "Insufficient Data",
};

/**
 * "Should I sell?" — a probabilistic read on depreciation speed, trend,
 * product age, refresh cycle, liquidity and demand. Never a guarantee.
 */
export function buildRecommendation(input: { asset: Asset; valuation: ValuationResult | null; displayCurrency: CurrencyCode; now?: Date }): Recommendation {
  const { asset, valuation, displayCurrency } = input;
  const now = input.now ?? new Date();
  if (!valuation || valuation.confidence < 0.45 || asset.status !== "active") {
    return {
      verdict: "insufficient_data",
      title: VERDICT_LABELS.insufficient_data,
      summary: "We don't have enough market data on this item to give a read. Set a manual value or check back after a few price updates.",
      reasons: [],
      expectedSale: null,
      quickSale: null,
      score: 0,
    };
  }
  const cur = displayCurrency;
  const value = convert(valuation.estimatedValue, valuation.currency, cur);
  const quick = convert(valuation.quickSaleEstimate, valuation.currency, cur);
  const product = getCatalogProduct(asset.catalogId ?? valuation.matchedCatalogId);
  const reasons: string[] = [];
  let score = 0;

  const t30 = valuation.trend30d ?? 0;
  const t90 = valuation.trend90d ?? 0;
  if (t90 <= -0.08) {
    score += 0.3;
    reasons.push(`Lost approximately ${formatPercent(Math.abs(t90))} of its market value during the last 90 days.`);
  } else if (t90 <= -0.05) {
    score += 0.1;
    reasons.push(`Market value slipped about ${formatPercent(Math.abs(t90))} over 90 days.`);
  } else if (t90 > 0.01) {
    score -= 0.2;
    reasons.push("Market value has been stable or rising recently.");
  }
  if (t30 < t90 / 3 - 0.005) {
    score += 0.15;
    reasons.push("The depreciation rate is currently increasing.");
  } else if (t30 > t90 / 3 + 0.005) {
    score -= 0.05;
    reasons.push("Depreciation is slowing down.");
  }

  if (product) {
    const ageMonths = monthsBetween(parseISODate(product.releaseDate), now);
    const cycle = product.refreshMonths;
    const untilRefresh = cycle - (ageMonths % cycle);
    const successor = getCatalogProduct(product.successorId);
    if (successor && parseISODate(successor.releaseDate) <= now) {
      score += 0.2;
      reasons.push(`A newer generation (${successor.model}) is already on sale, which usually pushes used prices down.`);
    } else if (untilRefresh <= 2.5 && ageMonths > 6) {
      score += 0.2;
      reasons.push(`A product refresh is likely within ~${Math.max(1, Math.round(untilRefresh))} month${Math.round(untilRefresh) === 1 ? "" : "s"}; prices typically dip after launches.`);
    }
    if (product.liquidity >= 0.85) {
      score += 0.05;
      reasons.push("High liquidity: items like this usually sell within days.");
    } else if (product.liquidity < 0.7) {
      score -= 0.05;
      reasons.push("Lower liquidity: expect a slower sale or a discount for a quick one.");
    }
    if (product.demand >= 0.9) {
      score -= 0.05;
      reasons.push("Demand is strong, which supports the price if you keep it.");
    }
  }

  const daysOwned = daysBetween(parseISODate(asset.purchaseDate), now);
  const purchase = convert(asset.purchasePrice, asset.purchaseCurrency, cur);
  const retained = purchase > 0 ? value / purchase : 1;
  if (daysOwned < 90) {
    score -= 0.15;
    reasons.push("You bought this recently — selling now usually crystallises the steepest part of the depreciation curve.");
  }
  if (retained < 0.35) {
    score -= 0.1;
    reasons.push(`It has already lost ${formatPercent(1 - retained)}; the remaining downside is limited.`);
  }

  score = Math.max(0, Math.min(1, score + 0.15));
  const verdict: Verdict = score >= 0.7 ? "strong_sell" : score >= 0.45 ? "consider_selling" : "hold";
  const summary =
    verdict === "hold"
      ? `Holding looks reasonable. Expected sale value today is around ${formatMoney(value, cur)}.`
      : verdict === "consider_selling"
        ? `If you were planning to replace it, now is a sensible window. Estimated sale value: ${formatMoney(value, cur)}.`
        : `Signals suggest the market for this item may soften. Estimated sale value: ${formatMoney(value, cur)} (about ${formatMoney(quick, cur)} for a quick sale).`;

  return { verdict, title: VERDICT_LABELS[verdict], summary, reasons, expectedSale: value, quickSale: quick, score };
}
