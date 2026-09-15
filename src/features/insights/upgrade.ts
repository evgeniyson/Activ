import { convert, roundMarketPrice, type CurrencyCode } from "@/lib/currency";
import type { Asset } from "@/types/domain";
import { CATALOG, getCatalogProduct, type CatalogProduct } from "@/valuation";

export interface UpgradeOption {
  product: CatalogProduct;
  variantName: string | null;
  price: number;
  currency: CurrencyCode;
  isSuccessor: boolean;
}

export interface UpgradeCalculation {
  current: { name: string; value: number; quickSale: number };
  target: { name: string; price: number };
  /** Price of the target minus expected private sale value */
  upgradeCost: number;
  /** Price of the target minus quick sale value */
  upgradeCostQuick: number;
  currency: CurrencyCode;
}

/** Candidate targets: the successor first, then newer products in the same category. */
export function upgradeOptions(asset: Asset, currency: CurrencyCode, limit = 6): UpgradeOption[] {
  const current = getCatalogProduct(asset.catalogId);
  const successor = getCatalogProduct(current?.successorId);
  const list: UpgradeOption[] = [];
  const push = (p: CatalogProduct, isSuccessor: boolean) => {
    const v = p.variants?.[0];
    list.push({ product: p, variantName: v?.name ?? null, price: roundMarketPrice(convert(v?.launchPriceEur ?? p.launchPriceEur, "EUR", currency), currency), currency, isSuccessor });
  };
  if (successor) push(successor, true);
  const sameCategory = CATALOG.filter((p) => p.category === asset.category && p.id !== current?.id && p.id !== successor?.id).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
  for (const p of sameCategory) {
    if (list.length >= limit) break;
    push(p, false);
  }
  return list;
}

export function calculateUpgrade(asset: Asset, target: { name: string; price: number }, currency: CurrencyCode): UpgradeCalculation | null {
  if (asset.currentEstimatedValue == null) return null;
  const value = convert(asset.currentEstimatedValue, asset.valuationCurrency, currency);
  const quick = convert(asset.quickSaleValue ?? asset.currentEstimatedValue * 0.9, asset.valuationCurrency, currency);
  return {
    current: { name: asset.name, value: Math.round(value), quickSale: Math.round(quick) },
    target,
    upgradeCost: Math.round(target.price - value),
    upgradeCostQuick: Math.round(target.price - quick),
    currency,
  };
}
