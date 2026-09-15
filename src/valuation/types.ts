import type { CurrencyCode } from "@/lib/currency";
import type { AssetCategory, Condition, MarketRegion, SpecMap, ValuationSourceId } from "@/types/domain";

export interface ValuationRequest {
  category: AssetCategory;
  manufacturer: string | null;
  model: string | null;
  variant: string | null;
  specs: SpecMap;
  condition: Condition;
  /** Known catalog product id (skips fuzzy matching) */
  catalogId?: string | null;
  /** Purchase details are used as a fallback signal for unknown products */
  purchasePrice: number;
  purchaseCurrency: CurrencyCode;
  purchaseDate: string; // YYYY-MM-DD
  region: MarketRegion;
  currency: CurrencyCode;
  /** Evaluate the market as of this date (defaults to now). Enables history backfill. */
  asOf?: Date;
  /** User-provided override, consumed by ManualProvider */
  manualOverride?: { value: number; currency: CurrencyCode; date: string } | null;
}

export interface ProviderEstimate {
  source: ValuationSourceId;
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  quickSaleEstimate: number;
  confidence: number; // 0..1
  comparablesCount: number;
  currency: CurrencyCode;
  /** Optional explanation for the UI (never marketing copy) */
  notes?: string[];
  matchedCatalogId?: string | null;
}

export type MarketTrend = "falling_fast" | "falling" | "stable" | "rising";

export interface ValuationResult {
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  quickSaleEstimate: number;
  confidence: number;
  comparablesCount: number;
  currency: CurrencyCode;
  valuationDate: string; // YYYY-MM-DD
  /** 30-day change ratio, e.g. -0.034 = −3.4% */
  trend30d: number | null;
  trend90d: number | null;
  marketTrend: MarketTrend;
  sources: { id: ValuationSourceId; value: number; confidence: number; weight: number }[];
  matchedCatalogId: string | null;
  notes: string[];
}

export interface ValuationProvider {
  readonly id: ValuationSourceId;
  readonly name: string;
  /** Relative weight when blending with other providers */
  readonly weight: number;
  isAvailable(): boolean;
  /** Return null when the provider has no opinion for this request. */
  estimate(req: ValuationRequest): Promise<ProviderEstimate | null>;
}
