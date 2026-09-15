import { convert, type CurrencyCode } from "@/lib/currency";
import { daysBetween, monthsBetween, parseISODate } from "@/lib/dates";
import { formatMoney, formatPercent, plural } from "@/lib/format";
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
  /** 0..1 сила сигнала к продаже */
  score: number;
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  hold: "Держать",
  consider_selling: "Стоит подумать о продаже",
  strong_sell: "Хороший момент для продажи",
  insufficient_data: "Недостаточно данных",
};

/**
 * «Стоит ли продавать?» — вероятностная оценка по скорости амортизации,
 * тренду, возрасту продукта, циклу обновления, ликвидности и спросу.
 * Никогда не гарантия.
 */
export function buildRecommendation(input: { asset: Asset; valuation: ValuationResult | null; displayCurrency: CurrencyCode; now?: Date }): Recommendation {
  const { asset, valuation, displayCurrency } = input;
  const now = input.now ?? new Date();
  if (!valuation || valuation.confidence < 0.45 || asset.status !== "active") {
    return {
      verdict: "insufficient_data",
      title: VERDICT_LABELS.insufficient_data,
      summary: "По этому предмету пока мало рыночных данных. Задайте стоимость вручную или загляните после нескольких обновлений цены.",
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
    reasons.push(`За последние 90 дней потерял примерно ${formatPercent(Math.abs(t90))} рыночной стоимости.`);
  } else if (t90 <= -0.05) {
    score += 0.1;
    reasons.push(`За 90 дней стоимость просела примерно на ${formatPercent(Math.abs(t90))}.`);
  } else if (t90 > 0.01) {
    score -= 0.2;
    reasons.push("В последнее время стоимость стабильна или растёт.");
  }
  if (t30 < t90 / 3 - 0.005) {
    score += 0.15;
    reasons.push("Скорость обесценивания сейчас растёт.");
  } else if (t30 > t90 / 3 + 0.005) {
    score -= 0.05;
    reasons.push("Обесценивание замедляется.");
  }

  if (product) {
    const ageMonths = monthsBetween(parseISODate(product.releaseDate), now);
    const cycle = product.refreshMonths;
    const untilRefresh = cycle - (ageMonths % cycle);
    const successor = getCatalogProduct(product.successorId);
    if (successor && parseISODate(successor.releaseDate) <= now) {
      score += 0.2;
      reasons.push(`Новое поколение (${successor.model}) уже в продаже — обычно это давит на цены б/у.`);
    } else if (untilRefresh <= 2.5 && ageMonths > 6) {
      score += 0.2;
      const m = Math.max(1, Math.round(untilRefresh));
      reasons.push(`Обновление линейки вероятно в ближайшие ~${plural(m, ["месяц", "месяца", "месяцев"])}; после анонсов цены обычно проседают.`);
    }
    if (product.liquidity >= 0.85) {
      score += 0.05;
      reasons.push("Высокая ликвидность: такие вещи обычно продаются за несколько дней.");
    } else if (product.liquidity < 0.7) {
      score -= 0.05;
      reasons.push("Ликвидность ниже средней: продажа займёт больше времени или потребует скидки.");
    }
    if (product.demand >= 0.9) {
      score -= 0.05;
      reasons.push("Спрос высокий — это поддерживает цену, если оставить вещь себе.");
    }
  }

  const daysOwned = daysBetween(parseISODate(asset.purchaseDate), now);
  const purchase = convert(asset.purchasePrice, asset.purchaseCurrency, cur);
  const retained = purchase > 0 ? value / purchase : 1;
  if (daysOwned < 90) {
    score -= 0.15;
    reasons.push("Покупка недавняя — продажа сейчас зафиксирует самый крутой участок кривой обесценивания.");
  }
  if (retained < 0.35) {
    score -= 0.1;
    reasons.push(`Уже потеряно ${formatPercent(1 - retained)} стоимости; дальнейшее падение ограничено.`);
  }

  score = Math.max(0, Math.min(1, score + 0.15));
  const verdict: Verdict = score >= 0.7 ? "strong_sell" : score >= 0.45 ? "consider_selling" : "hold";
  const summary =
    verdict === "hold"
      ? `Держать выглядит разумно. Ожидаемая цена продажи сегодня — около ${formatMoney(value, cur)}.`
      : verdict === "consider_selling"
        ? `Если вы планировали замену, сейчас удачное окно. Ожидаемая цена продажи: ${formatMoney(value, cur)}.`
        : `Сигналы указывают, что рынок по этому предмету может просесть. Ожидаемая цена продажи: ${formatMoney(value, cur)} (около ${formatMoney(quick, cur)} при быстрой продаже).`;

  return { verdict, title: VERDICT_LABELS[verdict], summary, reasons, expectedSale: value, quickSale: quick, score };
}
