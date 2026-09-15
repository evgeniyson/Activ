import { convert, type CurrencyCode } from "./currency";
import { daysBetween, parseISODate } from "./dates";
import type { Asset, AssetExpense, AssetMetrics } from "@/types/domain";

/**
 * Cost of ownership =
 *   Purchase Price + Maintenance + Repairs + Accessories − Current Market Value
 * Daily ownership cost = total ownership cost / days owned (min 1 day)
 */
export function computeAssetMetrics(
  asset: Asset,
  expenses: AssetExpense[],
  displayCurrency: CurrencyCode,
  now: Date = new Date(),
): AssetMetrics {
  const purchasePrice = convert(asset.purchasePrice, asset.purchaseCurrency, displayCurrency);
  const expensesTotal = expenses.reduce((sum, e) => sum + convert(e.amount, e.currency, displayCurrency), 0);

  const hasValuation = asset.currentEstimatedValue != null;
  const cv = (v: number | null) => (v == null ? null : convert(v, asset.valuationCurrency, displayCurrency));

  const currentValue = hasValuation ? cv(asset.currentEstimatedValue) : null;
  const lowEstimate = cv(asset.currentLowEstimate);
  const highEstimate = cv(asset.currentHighEstimate);
  const quickSale = cv(asset.quickSaleValue);

  const endDate = asset.status === "sold" && asset.soldDate ? parseISODate(asset.soldDate) : now;
  const daysOwned = Math.max(1, daysBetween(parseISODate(asset.purchaseDate), endDate));

  const effectiveValue =
    asset.status === "sold" && asset.soldPrice != null ? convert(asset.soldPrice, asset.purchaseCurrency, displayCurrency) : currentValue;

  const depreciation = effectiveValue == null ? null : effectiveValue - purchasePrice;
  const depreciationPct = depreciation == null || purchasePrice === 0 ? null : depreciation / purchasePrice;
  const ownershipCost = effectiveValue == null ? null : purchasePrice + expensesTotal - effectiveValue;
  const dailyCost = ownershipCost == null ? null : ownershipCost / daysOwned;

  return {
    purchasePrice,
    expensesTotal,
    currentValue,
    lowEstimate,
    highEstimate,
    quickSale,
    depreciation,
    depreciationPct,
    ownershipCost,
    daysOwned,
    dailyCost,
    currency: displayCurrency,
  };
}

export interface PortfolioTotals {
  currentValue: number;
  purchaseValue: number;
  expensesTotal: number;
  depreciation: number;
  depreciationPct: number;
  ownershipCost: number;
  dailyCost: number;
  assetCount: number;
  valuedCount: number;
  currency: CurrencyCode;
}

export function computePortfolioTotals(
  items: { asset: Asset; metrics: AssetMetrics }[],
  currency: CurrencyCode,
): PortfolioTotals {
  const active = items.filter((i) => i.asset.status === "active");
  let currentValue = 0;
  let purchaseValue = 0;
  let expensesTotal = 0;
  let dailyCost = 0;
  let valuedCount = 0;
  for (const { metrics } of active) {
    purchaseValue += metrics.purchasePrice;
    expensesTotal += metrics.expensesTotal;
    if (metrics.currentValue != null) {
      currentValue += metrics.currentValue;
      valuedCount++;
    }
    if (metrics.dailyCost != null) dailyCost += metrics.dailyCost;
  }
  const depreciation = currentValue - purchaseValue;
  return {
    currentValue,
    purchaseValue,
    expensesTotal,
    depreciation,
    depreciationPct: purchaseValue > 0 ? depreciation / purchaseValue : 0,
    ownershipCost: purchaseValue + expensesTotal - currentValue,
    dailyCost,
    assetCount: active.length,
    valuedCount,
    currency,
  };
}

/** Annualised depreciation rate given a purchase→now change and days owned. */
export function annualisedRate(depreciationPct: number, daysOwned: number): number {
  if (daysOwned <= 0) return 0;
  const years = daysOwned / 365.25;
  if (years < 0.05) return depreciationPct / Math.max(years, 0.05);
  // Geometric annualisation of the retained ratio
  const retained = Math.max(0.01, 1 + depreciationPct);
  return Math.pow(retained, 1 / years) - 1;
}
