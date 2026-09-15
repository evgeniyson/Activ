import type { CurrencyCode } from "@/lib/currency";
import type { AssetCategory } from "./categories";

export type { CurrencyCode, AssetCategory };

export const CONDITIONS = ["like_new", "excellent", "good", "fair", "poor"] as const;
export type Condition = (typeof CONDITIONS)[number];
export const CONDITION_LABELS: Record<Condition, string> = {
  like_new: "Как новый",
  excellent: "Отличное",
  good: "Хорошее",
  fair: "Среднее",
  poor: "Плохое",
};

export const ASSET_STATUSES = ["active", "sold", "lost", "archived"] as const;
export type AssetStatus = (typeof ASSET_STATUSES)[number];

export const MARKET_REGIONS = ["RU", "KZ", "BY", "EU", "US", "UK", "AE", "TR", "CN"] as const;
export type MarketRegion = (typeof MARKET_REGIONS)[number];
export const DEFAULT_REGION: MarketRegion = "RU";
export const REGION_LABELS: Record<MarketRegion, string> = {
  RU: "Россия",
  KZ: "Казахстан",
  BY: "Беларусь",
  EU: "Евросоюз",
  US: "США",
  UK: "Великобритания",
  AE: "ОАЭ",
  TR: "Турция",
  CN: "Китай",
};

export interface Profile {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  preferredCurrency: CurrencyCode;
  marketRegion: MarketRegion;
  onboardingCompleted: boolean;
  notificationPrefs: NotificationPrefs;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPrefs {
  priceChanges: boolean;
  sellOpportunities: boolean;
  warrantyAlerts: boolean;
  monthlyReport: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  priceChanges: true,
  sellOpportunities: true,
  warrantyAlerts: true,
  monthlyReport: true,
};

export type SpecMap = Record<string, string>;

export interface Asset {
  id: string;
  userId: string;
  name: string;
  category: AssetCategory;
  manufacturer: string | null;
  model: string | null;
  variant: string | null;
  description: string | null;
  specs: SpecMap;
  /** Catalog product id when the asset was matched to a known product */
  catalogId: string | null;
  purchasePrice: number;
  purchaseCurrency: CurrencyCode;
  purchaseDate: string; // YYYY-MM-DD
  retailer: string | null;
  condition: Condition;
  currentEstimatedValue: number | null;
  currentLowEstimate: number | null;
  currentHighEstimate: number | null;
  quickSaleValue: number | null;
  valuationConfidence: number | null;
  valuationCurrency: CurrencyCode;
  valuationDate: string | null;
  identificationConfidence: number | null;
  serialNumber: string | null;
  imei: string | null;
  warrantyExpiration: string | null; // YYYY-MM-DD
  notes: string | null;
  status: AssetStatus;
  soldPrice: number | null;
  soldDate: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AssetImage {
  id: string;
  assetId: string;
  userId: string;
  url: string;
  storagePath: string | null;
  width: number | null;
  height: number | null;
  isCover: boolean;
  createdAt: string;
}

export const EXPENSE_TYPES = ["repair", "accessory", "maintenance", "insurance", "subscription", "upgrade", "other"] as const;
export type ExpenseType = (typeof EXPENSE_TYPES)[number];
export const EXPENSE_LABELS: Record<ExpenseType, string> = {
  repair: "Ремонт",
  accessory: "Аксессуар",
  maintenance: "Обслуживание",
  insurance: "Страховка",
  subscription: "Подписка",
  upgrade: "Апгрейд",
  other: "Другое",
};

export interface AssetExpense {
  id: string;
  assetId: string;
  userId: string;
  type: ExpenseType;
  amount: number;
  currency: CurrencyCode;
  date: string; // YYYY-MM-DD
  title: string;
  notes: string | null;
  createdAt: string;
}

export const DOCUMENT_TYPES = ["receipt", "warranty", "invoice", "manual", "other"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface AssetDocument {
  id: string;
  assetId: string;
  userId: string;
  type: DocumentType;
  title: string;
  url: string;
  storagePath: string | null;
  createdAt: string;
}

export type ValuationSourceId = "internal" | "ebay" | "marketplace" | "manual" | "mock";

export interface AssetValueHistory {
  id: string;
  assetId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  estimatedValue: number;
  lowEstimate: number;
  highEstimate: number;
  quickSaleEstimate: number | null;
  currency: CurrencyCode;
  source: ValuationSourceId;
  confidence: number;
  comparablesCount: number | null;
  createdAt: string;
}

export const ASSET_EVENT_TYPES = [
  "purchased",
  "valuation",
  "expense",
  "warranty_added",
  "condition_changed",
  "sold",
  "note",
  "document_added",
  "image_added",
  "edited",
] as const;
export type AssetEventType = (typeof ASSET_EVENT_TYPES)[number];

export interface AssetEvent {
  id: string;
  assetId: string;
  userId: string;
  type: AssetEventType;
  date: string; // YYYY-MM-DD
  title: string;
  description: string | null;
  amount: number | null;
  currency: CurrencyCode | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

export interface PortfolioSnapshot {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  totalValue: number;
  purchaseValue: number;
  totalDepreciation: number;
  currency: CurrencyCode;
  assetCount: number;
  createdAt: string;
}

export const NOTIFICATION_TYPES = [
  "price_changed",
  "value_dropped",
  "value_increased",
  "good_time_to_sell",
  "warranty_expiring",
  "monthly_report",
  "system",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  assetId: string | null;
  href: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ValuationSource {
  id: ValuationSourceId;
  name: string;
  description: string;
  enabled: boolean;
  /** Relative weight when blending providers */
  weight: number;
}

/** Aggregated numbers for one asset — derived, never stored. */
export interface AssetMetrics {
  purchasePrice: number; // in display currency
  expensesTotal: number; // in display currency
  currentValue: number | null;
  lowEstimate: number | null;
  highEstimate: number | null;
  quickSale: number | null;
  depreciation: number | null; // currentValue - purchasePrice (negative = loss)
  depreciationPct: number | null;
  ownershipCost: number | null; // purchase + expenses - currentValue
  daysOwned: number;
  dailyCost: number | null;
  currency: CurrencyCode;
}
