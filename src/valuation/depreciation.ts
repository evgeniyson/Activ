import type { AssetCategory, Condition, MarketRegion } from "@/types/domain";

export interface DepreciationCurve {
  /** Immediate loss the moment the product leaves the store (0..1) */
  launchDrop: number;
  /** Time constant in months: how fast value decays toward the floor */
  tau: number;
  /** Long-run residual ratio of launch price */
  floor: number;
}

/**
 * Category curves. `ratio(ageMonths)` describes the used-market price of a
 * product as a fraction of its launch price, for an item in "excellent"
 * condition, as a function of the product's age since release.
 */
export const CATEGORY_CURVES: Record<AssetCategory, DepreciationCurve> = {
  smartphone: { launchDrop: 0.1, tau: 30, floor: 0.15 },
  laptop: { launchDrop: 0.15, tau: 36, floor: 0.15 },
  tablet: { launchDrop: 0.15, tau: 32, floor: 0.15 },
  smartwatch: { launchDrop: 0.15, tau: 30, floor: 0.15 },
  headphones: { launchDrop: 0.2, tau: 30, floor: 0.25 },
  camera: { launchDrop: 0.1, tau: 48, floor: 0.25 },
  lens: { launchDrop: 0.08, tau: 60, floor: 0.4 },
  gaming_console: { launchDrop: 0.08, tau: 40, floor: 0.45 },
  gpu: { launchDrop: 0.1, tau: 36, floor: 0.2 },
  pc_component: { launchDrop: 0.12, tau: 30, floor: 0.15 },
  monitor: { launchDrop: 0.15, tau: 30, floor: 0.15 },
  drone: { launchDrop: 0.12, tau: 30, floor: 0.2 },
  audio: { launchDrop: 0.15, tau: 36, floor: 0.2 },
  bicycle: { launchDrop: 0.15, tau: 48, floor: 0.25 },
  e_scooter: { launchDrop: 0.2, tau: 24, floor: 0.15 },
  watch: { launchDrop: 0.05, tau: 120, floor: 0.6 },
  sneakers: { launchDrop: 0.3, tau: 24, floor: 0.2 },
  fashion: { launchDrop: 0.4, tau: 18, floor: 0.1 },
  bag: { launchDrop: 0.2, tau: 60, floor: 0.35 },
  instrument: { launchDrop: 0.1, tau: 72, floor: 0.4 },
  collectible: { launchDrop: 0, tau: 200, floor: 0.8 },
  furniture: { launchDrop: 0.3, tau: 36, floor: 0.15 },
  appliance: { launchDrop: 0.25, tau: 30, floor: 0.1 },
  tool: { launchDrop: 0.2, tau: 48, floor: 0.25 },
  vehicle: { launchDrop: 0.12, tau: 48, floor: 0.2 },
  other: { launchDrop: 0.2, tau: 36, floor: 0.15 },
};

export function curveRatio(curve: DepreciationCurve, ageMonths: number): number {
  const age = Math.max(0, ageMonths);
  const top = 1 - curve.launchDrop;
  return curve.floor + (top - curve.floor) * Math.exp(-age / curve.tau);
}

/** How well a manufacturer's products hold value relative to the category curve. */
export const BRAND_RETENTION: Record<string, number> = {
  apple: 1.08,
  samsung: 0.95,
  google: 0.9,
  oneplus: 0.88,
  xiaomi: 0.85,
  sony: 1.03,
  fujifilm: 1.1,
  canon: 1.0,
  nikon: 1.0,
  leica: 1.15,
  nintendo: 1.1,
  microsoft: 0.95,
  valve: 1.02,
  nvidia: 1.02,
  amd: 0.98,
  intel: 0.95,
  dji: 1.0,
  gopro: 0.92,
  garmin: 1.0,
  bose: 0.95,
  sennheiser: 0.97,
  dell: 0.9,
  lenovo: 0.92,
  hp: 0.88,
  asus: 0.92,
  lg: 0.92,
  framework: 1.0,
  sonos: 0.95,
  rolex: 1.2,
  omega: 1.05,
};

export function brandRetention(manufacturer: string | null): number {
  if (!manufacturer) return 1;
  return BRAND_RETENTION[manufacturer.trim().toLowerCase()] ?? 1;
}

export const CONDITION_FACTORS: Record<Condition, number> = {
  like_new: 1.06,
  excellent: 1.0,
  good: 0.9,
  fair: 0.78,
  poor: 0.58,
};

/** Price level of the used market relative to the EU baseline (in EUR terms). */
export const REGION_FACTORS: Record<MarketRegion, number> = {
  RU: 1.12,
  KZ: 1.08,
  BY: 1.1,
  EU: 1.0,
  US: 0.96,
  UK: 0.98,
  AE: 0.95,
  TR: 1.15,
  CN: 0.9,
};

/**
 * Extra pressure when a successor product is on the market: ramps from −6%
 * at release to −12% after six months.
 */
export function successorPressure(monthsSinceSuccessor: number | null): number {
  if (monthsSinceSuccessor == null || monthsSinceSuccessor < 0) return 1;
  const t = Math.min(6, monthsSinceSuccessor) / 6;
  return 1 - (0.06 + 0.06 * t);
}

/** Seasonal demand for consumer electronics (month is 0-based). */
export function seasonalFactor(category: AssetCategory, month: number): number {
  const electronics: AssetCategory[] = [
    "smartphone",
    "laptop",
    "tablet",
    "smartwatch",
    "headphones",
    "gaming_console",
    "gpu",
    "pc_component",
    "monitor",
    "audio",
  ];
  if (!electronics.includes(category)) return 1;
  // Sept–Oct: launch season, prices soften. Nov–Dec: demand, prices firm.
  const table = [1.0, 0.995, 0.995, 1.0, 1.0, 1.0, 0.995, 0.99, 0.985, 0.985, 1.01, 1.015];
  return table[month] ?? 1;
}
