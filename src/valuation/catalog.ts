import type { AssetCategory } from "@/types/domain";

/**
 * Internal product catalog. Prices are EUR launch prices (RRP, EU market).
 * This is the reference set for the InternalPricingProvider; it is also used
 * by the mock identification provider and the barcode lookup.
 *
 * Adding a product here is all that is needed for it to be valued.
 */
export interface CatalogVariant {
  /** Variant key, e.g. "256 GB" or "16 GB / 512 GB" */
  name: string;
  launchPriceEur: number;
  /** Spec values this variant implies (used for matching) */
  specs?: Record<string, string>;
}

export interface CatalogProduct {
  id: string;
  category: AssetCategory;
  manufacturer: string;
  model: string;
  aliases?: string[];
  releaseDate: string; // YYYY-MM-DD
  launchPriceEur: number;
  variants?: CatalogVariant[];
  successorId?: string;
  /** Typical refresh cycle in months */
  refreshMonths: number;
  /** 0..1 how quickly it sells on the used market */
  liquidity: number;
  /** 0..1 demand strength on the used market */
  demand: number;
  /** Optional EAN/UPC codes for barcode lookup */
  barcodes?: string[];
  /** Default spec values */
  specs?: Record<string, string>;
  /** Product-specific value retention multiplier (cult products, limited supply) */
  retentionBoost?: number;
}

const P = (p: CatalogProduct) => p;

export const CATALOG: CatalogProduct[] = [
  // ── Smartphones ──────────────────────────────────────────────────────
  P({
    id: "apple-iphone-18-pro",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 18 Pro",
    releaseDate: "2026-09-18",
    launchPriceEur: 1399,
    variants: [
      { name: "256 GB", launchPriceEur: 1399, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1649, specs: { storage: "512 GB" } },
      { name: "1 TB", launchPriceEur: 1899, specs: { storage: "1 TB" } },
    ],
    refreshMonths: 12,
    liquidity: 0.95,
    demand: 0.95,
  }),
  P({
    id: "apple-iphone-17-pro",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 17 Pro",
    aliases: ["iPhone 17 Pro Max"],
    releaseDate: "2025-09-19",
    launchPriceEur: 1299,
    variants: [
      { name: "256 GB", launchPriceEur: 1299, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1549, specs: { storage: "512 GB" } },
      { name: "1 TB", launchPriceEur: 1799, specs: { storage: "1 TB" } },
    ],
    successorId: "apple-iphone-18-pro",
    refreshMonths: 12,
    liquidity: 0.95,
    demand: 0.92,
    barcodes: ["195949836893", "195949837203"],
  }),
  P({
    id: "apple-iphone-17",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 17",
    releaseDate: "2025-09-19",
    launchPriceEur: 949,
    variants: [
      { name: "256 GB", launchPriceEur: 949, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1199, specs: { storage: "512 GB" } },
    ],
    refreshMonths: 12,
    liquidity: 0.93,
    demand: 0.9,
  }),
  P({
    id: "apple-iphone-air",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone Air",
    releaseDate: "2025-09-19",
    launchPriceEur: 1199,
    variants: [
      { name: "256 GB", launchPriceEur: 1199, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1449, specs: { storage: "512 GB" } },
    ],
    refreshMonths: 12,
    liquidity: 0.85,
    demand: 0.7,
  }),
  P({
    id: "apple-iphone-16-pro",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 16 Pro",
    aliases: ["iPhone 16 Pro Max"],
    releaseDate: "2024-09-20",
    launchPriceEur: 1199,
    variants: [
      { name: "128 GB", launchPriceEur: 1199, specs: { storage: "128 GB" } },
      { name: "256 GB", launchPriceEur: 1329, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1579, specs: { storage: "512 GB" } },
      { name: "1 TB", launchPriceEur: 1829, specs: { storage: "1 TB" } },
    ],
    successorId: "apple-iphone-17-pro",
    refreshMonths: 12,
    liquidity: 0.95,
    demand: 0.88,
  }),
  P({
    id: "apple-iphone-16",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 16",
    releaseDate: "2024-09-20",
    launchPriceEur: 949,
    variants: [
      { name: "128 GB", launchPriceEur: 949, specs: { storage: "128 GB" } },
      { name: "256 GB", launchPriceEur: 1079, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1329, specs: { storage: "512 GB" } },
    ],
    successorId: "apple-iphone-17",
    refreshMonths: 12,
    liquidity: 0.93,
    demand: 0.85,
  }),
  P({
    id: "apple-iphone-15-pro",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 15 Pro",
    aliases: ["iPhone 15 Pro Max"],
    releaseDate: "2023-09-22",
    launchPriceEur: 1199,
    variants: [
      { name: "128 GB", launchPriceEur: 1199, specs: { storage: "128 GB" } },
      { name: "256 GB", launchPriceEur: 1329, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1579, specs: { storage: "512 GB" } },
    ],
    successorId: "apple-iphone-16-pro",
    refreshMonths: 12,
    liquidity: 0.93,
    demand: 0.8,
  }),
  P({
    id: "apple-iphone-15",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 15",
    releaseDate: "2023-09-22",
    launchPriceEur: 949,
    variants: [
      { name: "128 GB", launchPriceEur: 949, specs: { storage: "128 GB" } },
      { name: "256 GB", launchPriceEur: 1079, specs: { storage: "256 GB" } },
    ],
    successorId: "apple-iphone-16",
    refreshMonths: 12,
    liquidity: 0.92,
    demand: 0.78,
  }),
  P({
    id: "samsung-galaxy-s25-ultra",
    category: "smartphone",
    manufacturer: "Samsung",
    model: "Galaxy S25 Ultra",
    releaseDate: "2025-02-07",
    launchPriceEur: 1449,
    variants: [
      { name: "256 GB", launchPriceEur: 1449, specs: { storage: "256 GB" } },
      { name: "512 GB", launchPriceEur: 1569, specs: { storage: "512 GB" } },
      { name: "1 TB", launchPriceEur: 1809, specs: { storage: "1 TB" } },
    ],
    refreshMonths: 12,
    liquidity: 0.88,
    demand: 0.8,
  }),
  P({
    id: "samsung-galaxy-s25",
    category: "smartphone",
    manufacturer: "Samsung",
    model: "Galaxy S25",
    releaseDate: "2025-02-07",
    launchPriceEur: 899,
    variants: [
      { name: "128 GB", launchPriceEur: 899, specs: { storage: "128 GB" } },
      { name: "256 GB", launchPriceEur: 959, specs: { storage: "256 GB" } },
    ],
    refreshMonths: 12,
    liquidity: 0.85,
    demand: 0.72,
  }),
  P({
    id: "samsung-galaxy-s24-ultra",
    category: "smartphone",
    manufacturer: "Samsung",
    model: "Galaxy S24 Ultra",
    releaseDate: "2024-01-31",
    launchPriceEur: 1449,
    successorId: "samsung-galaxy-s25-ultra",
    refreshMonths: 12,
    liquidity: 0.86,
    demand: 0.7,
  }),
  P({
    id: "google-pixel-10-pro",
    category: "smartphone",
    manufacturer: "Google",
    model: "Pixel 10 Pro",
    releaseDate: "2025-08-28",
    launchPriceEur: 1099,
    variants: [
      { name: "128 GB", launchPriceEur: 1099, specs: { storage: "128 GB" } },
      { name: "256 GB", launchPriceEur: 1199, specs: { storage: "256 GB" } },
    ],
    refreshMonths: 12,
    liquidity: 0.8,
    demand: 0.7,
  }),
  P({
    id: "google-pixel-9-pro",
    category: "smartphone",
    manufacturer: "Google",
    model: "Pixel 9 Pro",
    releaseDate: "2024-08-22",
    launchPriceEur: 1099,
    successorId: "google-pixel-10-pro",
    refreshMonths: 12,
    liquidity: 0.8,
    demand: 0.65,
  }),
  P({
    id: "google-pixel-9",
    category: "smartphone",
    manufacturer: "Google",
    model: "Pixel 9",
    releaseDate: "2024-08-22",
    launchPriceEur: 899,
    refreshMonths: 12,
    liquidity: 0.78,
    demand: 0.62,
  }),

  // ── Laptops ──────────────────────────────────────────────────────────
  P({
    id: "apple-macbook-air-13-m4",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Air 13″ M4",
    aliases: ["MacBook Air M4", "MacBook Air 13-inch M4"],
    releaseDate: "2025-03-12",
    launchPriceEur: 1199,
    variants: [
      { name: "16 GB / 256 GB", launchPriceEur: 1199, specs: { memory: "16 GB", storage: "256 GB" } },
      { name: "16 GB / 512 GB", launchPriceEur: 1449, specs: { memory: "16 GB", storage: "512 GB" } },
      { name: "24 GB / 512 GB", launchPriceEur: 1699, specs: { memory: "24 GB", storage: "512 GB" } },
    ],
    specs: { chip: "M4", screen: "13.6″" },
    refreshMonths: 15,
    liquidity: 0.9,
    demand: 0.88,
  }),
  P({
    id: "apple-macbook-air-15-m4",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Air 15″ M4",
    aliases: ["MacBook Air 15-inch M4"],
    releaseDate: "2025-03-12",
    launchPriceEur: 1449,
    variants: [
      { name: "16 GB / 256 GB", launchPriceEur: 1449, specs: { memory: "16 GB", storage: "256 GB" } },
      { name: "16 GB / 512 GB", launchPriceEur: 1699, specs: { memory: "16 GB", storage: "512 GB" } },
    ],
    specs: { chip: "M4", screen: "15.3″" },
    refreshMonths: 15,
    liquidity: 0.88,
    demand: 0.85,
  }),
  P({
    id: "apple-macbook-air-13-m3",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Air 13″ M3",
    aliases: ["MacBook Air M3"],
    releaseDate: "2024-03-08",
    launchPriceEur: 1299,
    variants: [
      { name: "8 GB / 256 GB", launchPriceEur: 1299, specs: { memory: "8 GB", storage: "256 GB" } },
      { name: "16 GB / 512 GB", launchPriceEur: 1729, specs: { memory: "16 GB", storage: "512 GB" } },
    ],
    specs: { chip: "M3", screen: "13.6″" },
    successorId: "apple-macbook-air-13-m4",
    refreshMonths: 15,
    liquidity: 0.9,
    demand: 0.8,
  }),
  P({
    id: "apple-macbook-air-13-m2",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Air 13″ M2",
    aliases: ["MacBook Air M2"],
    releaseDate: "2022-07-15",
    launchPriceEur: 1499,
    specs: { chip: "M2", screen: "13.6″" },
    successorId: "apple-macbook-air-13-m3",
    refreshMonths: 15,
    liquidity: 0.9,
    demand: 0.72,
  }),
  P({
    id: "apple-macbook-pro-14-m5",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Pro 14″ M5",
    aliases: ["MacBook Pro M5"],
    releaseDate: "2025-10-22",
    launchPriceEur: 1899,
    variants: [
      { name: "16 GB / 512 GB", launchPriceEur: 1899, specs: { memory: "16 GB", storage: "512 GB" } },
      { name: "24 GB / 1 TB", launchPriceEur: 2349, specs: { memory: "24 GB", storage: "1 TB" } },
    ],
    specs: { chip: "M5", screen: "14.2″" },
    refreshMonths: 14,
    liquidity: 0.88,
    demand: 0.9,
  }),
  P({
    id: "apple-macbook-pro-14-m4",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Pro 14″ M4",
    aliases: ["MacBook Pro M4"],
    releaseDate: "2024-11-08",
    launchPriceEur: 1899,
    variants: [
      { name: "16 GB / 512 GB", launchPriceEur: 1899, specs: { memory: "16 GB", storage: "512 GB" } },
      { name: "24 GB / 1 TB", launchPriceEur: 2349, specs: { memory: "24 GB", storage: "1 TB" } },
    ],
    specs: { chip: "M4", screen: "14.2″" },
    successorId: "apple-macbook-pro-14-m5",
    refreshMonths: 14,
    liquidity: 0.88,
    demand: 0.85,
  }),
  P({
    id: "apple-macbook-pro-14-m4-pro",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Pro 14″ M4 Pro",
    releaseDate: "2024-11-08",
    launchPriceEur: 2399,
    variants: [
      { name: "24 GB / 512 GB", launchPriceEur: 2399, specs: { memory: "24 GB", storage: "512 GB" } },
      { name: "24 GB / 1 TB", launchPriceEur: 2649, specs: { memory: "24 GB", storage: "1 TB" } },
    ],
    specs: { chip: "M4 Pro", screen: "14.2″" },
    refreshMonths: 14,
    liquidity: 0.85,
    demand: 0.85,
  }),
  P({
    id: "apple-macbook-pro-16-m4-pro",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Pro 16″ M4 Pro",
    releaseDate: "2024-11-08",
    launchPriceEur: 2999,
    specs: { chip: "M4 Pro", screen: "16.2″" },
    refreshMonths: 14,
    liquidity: 0.82,
    demand: 0.82,
  }),
  P({
    id: "apple-macbook-pro-14-m3-pro",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Pro 14″ M3 Pro",
    releaseDate: "2023-11-07",
    launchPriceEur: 2499,
    specs: { chip: "M3 Pro", screen: "14.2″" },
    successorId: "apple-macbook-pro-14-m4-pro",
    refreshMonths: 14,
    liquidity: 0.85,
    demand: 0.75,
  }),
  P({
    id: "dell-xps-13-9350",
    category: "laptop",
    manufacturer: "Dell",
    model: "XPS 13 (9350)",
    aliases: ["XPS 13"],
    releaseDate: "2024-09-24",
    launchPriceEur: 1499,
    refreshMonths: 12,
    liquidity: 0.7,
    demand: 0.6,
  }),
  P({
    id: "lenovo-thinkpad-x1-carbon-g13",
    category: "laptop",
    manufacturer: "Lenovo",
    model: "ThinkPad X1 Carbon Gen 13",
    aliases: ["X1 Carbon"],
    releaseDate: "2025-02-25",
    launchPriceEur: 1999,
    refreshMonths: 12,
    liquidity: 0.72,
    demand: 0.65,
  }),
  P({
    id: "framework-laptop-13",
    category: "laptop",
    manufacturer: "Framework",
    model: "Laptop 13",
    releaseDate: "2025-04-09",
    launchPriceEur: 1299,
    refreshMonths: 12,
    liquidity: 0.65,
    demand: 0.7,
  }),

  // ── Tablets ──────────────────────────────────────────────────────────
  P({
    id: "apple-ipad-pro-11-m4",
    category: "tablet",
    manufacturer: "Apple",
    model: "iPad Pro 11″ M4",
    aliases: ["iPad Pro M4"],
    releaseDate: "2024-05-15",
    launchPriceEur: 1199,
    variants: [
      { name: "256 GB Wi‑Fi", launchPriceEur: 1199, specs: { storage: "256 GB", connectivity: "Wi‑Fi" } },
      { name: "256 GB Cellular", launchPriceEur: 1449, specs: { storage: "256 GB", connectivity: "Wi‑Fi + Cellular" } },
      { name: "512 GB Wi‑Fi", launchPriceEur: 1449, specs: { storage: "512 GB", connectivity: "Wi‑Fi" } },
    ],
    refreshMonths: 18,
    liquidity: 0.85,
    demand: 0.8,
  }),
  P({
    id: "apple-ipad-air-11-m3",
    category: "tablet",
    manufacturer: "Apple",
    model: "iPad Air 11″ M3",
    aliases: ["iPad Air M3"],
    releaseDate: "2025-03-12",
    launchPriceEur: 699,
    variants: [
      { name: "128 GB Wi‑Fi", launchPriceEur: 699, specs: { storage: "128 GB", connectivity: "Wi‑Fi" } },
      { name: "256 GB Wi‑Fi", launchPriceEur: 829, specs: { storage: "256 GB", connectivity: "Wi‑Fi" } },
    ],
    refreshMonths: 15,
    liquidity: 0.85,
    demand: 0.78,
  }),
  P({
    id: "apple-ipad-a16",
    category: "tablet",
    manufacturer: "Apple",
    model: "iPad (A16)",
    aliases: ["iPad 11th gen"],
    releaseDate: "2025-03-12",
    launchPriceEur: 399,
    refreshMonths: 18,
    liquidity: 0.85,
    demand: 0.75,
  }),
  P({
    id: "apple-ipad-mini-a17-pro",
    category: "tablet",
    manufacturer: "Apple",
    model: "iPad mini (A17 Pro)",
    aliases: ["iPad mini 7"],
    releaseDate: "2024-10-23",
    launchPriceEur: 599,
    refreshMonths: 24,
    liquidity: 0.8,
    demand: 0.72,
  }),
  P({
    id: "samsung-galaxy-tab-s10-ultra",
    category: "tablet",
    manufacturer: "Samsung",
    model: "Galaxy Tab S10 Ultra",
    releaseDate: "2024-10-03",
    launchPriceEur: 1339,
    refreshMonths: 12,
    liquidity: 0.7,
    demand: 0.6,
  }),

  // ── Smartwatches ─────────────────────────────────────────────────────
  P({
    id: "apple-watch-series-11",
    category: "smartwatch",
    manufacturer: "Apple",
    model: "Apple Watch Series 11",
    aliases: ["Watch Series 11"],
    releaseDate: "2025-09-19",
    launchPriceEur: 449,
    variants: [
      { name: "42 mm GPS", launchPriceEur: 449, specs: { size: "42 mm", connectivity: "GPS" } },
      { name: "46 mm GPS", launchPriceEur: 479, specs: { size: "46 mm", connectivity: "GPS" } },
      { name: "46 mm Cellular", launchPriceEur: 599, specs: { size: "46 mm", connectivity: "GPS + Cellular" } },
    ],
    refreshMonths: 12,
    liquidity: 0.88,
    demand: 0.85,
  }),
  P({
    id: "apple-watch-series-10",
    category: "smartwatch",
    manufacturer: "Apple",
    model: "Apple Watch Series 10",
    aliases: ["Watch Series 10"],
    releaseDate: "2024-09-20",
    launchPriceEur: 449,
    variants: [
      { name: "42 mm GPS", launchPriceEur: 449, specs: { size: "42 mm", connectivity: "GPS" } },
      { name: "46 mm GPS", launchPriceEur: 479, specs: { size: "46 mm", connectivity: "GPS" } },
      { name: "46 mm Cellular", launchPriceEur: 599, specs: { size: "46 mm", connectivity: "GPS + Cellular" } },
    ],
    successorId: "apple-watch-series-11",
    refreshMonths: 12,
    liquidity: 0.88,
    demand: 0.78,
  }),
  P({
    id: "apple-watch-ultra-3",
    category: "smartwatch",
    manufacturer: "Apple",
    model: "Apple Watch Ultra 3",
    releaseDate: "2025-09-19",
    launchPriceEur: 899,
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.85,
  }),
  P({
    id: "apple-watch-ultra-2",
    category: "smartwatch",
    manufacturer: "Apple",
    model: "Apple Watch Ultra 2",
    releaseDate: "2023-09-22",
    launchPriceEur: 899,
    successorId: "apple-watch-ultra-3",
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.75,
  }),
  P({
    id: "garmin-fenix-8",
    category: "smartwatch",
    manufacturer: "Garmin",
    model: "Fēnix 8",
    aliases: ["Fenix 8"],
    releaseDate: "2024-08-27",
    launchPriceEur: 999,
    refreshMonths: 24,
    liquidity: 0.75,
    demand: 0.75,
  }),
  P({
    id: "samsung-galaxy-watch-8",
    category: "smartwatch",
    manufacturer: "Samsung",
    model: "Galaxy Watch 8",
    releaseDate: "2025-07-25",
    launchPriceEur: 379,
    refreshMonths: 12,
    liquidity: 0.75,
    demand: 0.6,
  }),

  // ── Headphones ───────────────────────────────────────────────────────
  P({
    id: "apple-airpods-pro-3",
    category: "headphones",
    manufacturer: "Apple",
    model: "AirPods Pro 3",
    aliases: ["AirPods Pro (3rd generation)"],
    releaseDate: "2025-09-19",
    launchPriceEur: 249,
    refreshMonths: 30,
    liquidity: 0.92,
    demand: 0.9,
  }),
  P({
    id: "apple-airpods-pro-2",
    category: "headphones",
    manufacturer: "Apple",
    model: "AirPods Pro 2",
    aliases: ["AirPods Pro (2nd generation)", "AirPods Pro 2 USB-C"],
    releaseDate: "2022-09-23",
    launchPriceEur: 279,
    successorId: "apple-airpods-pro-3",
    refreshMonths: 30,
    liquidity: 0.92,
    demand: 0.8,
    barcodes: ["195949052828"],
  }),
  P({
    id: "apple-airpods-max",
    category: "headphones",
    manufacturer: "Apple",
    model: "AirPods Max",
    releaseDate: "2020-12-15",
    launchPriceEur: 579,
    refreshMonths: 48,
    liquidity: 0.8,
    demand: 0.65,
  }),
  P({
    id: "sony-wh-1000xm6",
    category: "headphones",
    manufacturer: "Sony",
    model: "WH-1000XM6",
    releaseDate: "2025-05-22",
    launchPriceEur: 449,
    refreshMonths: 30,
    liquidity: 0.85,
    demand: 0.82,
  }),
  P({
    id: "sony-wh-1000xm5",
    category: "headphones",
    manufacturer: "Sony",
    model: "WH-1000XM5",
    releaseDate: "2022-05-20",
    launchPriceEur: 419,
    successorId: "sony-wh-1000xm6",
    refreshMonths: 30,
    liquidity: 0.85,
    demand: 0.7,
  }),
  P({
    id: "bose-qc-ultra-headphones",
    category: "headphones",
    manufacturer: "Bose",
    model: "QuietComfort Ultra Headphones",
    aliases: ["QC Ultra"],
    releaseDate: "2023-10-10",
    launchPriceEur: 449,
    refreshMonths: 30,
    liquidity: 0.8,
    demand: 0.68,
  }),

  // ── Cameras ──────────────────────────────────────────────────────────
  P({
    id: "sony-a7-iv",
    category: "camera",
    manufacturer: "Sony",
    model: "α7 IV",
    aliases: ["A7 IV", "Alpha 7 IV", "ILCE-7M4", "a7iv"],
    releaseDate: "2021-12-01",
    launchPriceEur: 2799,
    variants: [
      { name: "Body only", launchPriceEur: 2799, specs: { kit: "Body only" } },
      { name: "28–70 mm kit", launchPriceEur: 3099, specs: { kit: "28–70 mm kit" } },
    ],
    specs: { sensor: "33 MP full-frame" },
    refreshMonths: 48,
    liquidity: 0.85,
    demand: 0.85,
  }),
  P({
    id: "sony-a7c-ii",
    category: "camera",
    manufacturer: "Sony",
    model: "α7C II",
    aliases: ["A7C II", "ILCE-7CM2"],
    releaseDate: "2023-10-01",
    launchPriceEur: 2399,
    refreshMonths: 36,
    liquidity: 0.82,
    demand: 0.82,
  }),
  P({
    id: "sony-a7r-v",
    category: "camera",
    manufacturer: "Sony",
    model: "α7R V",
    aliases: ["A7R V", "ILCE-7RM5"],
    releaseDate: "2022-12-01",
    launchPriceEur: 4499,
    refreshMonths: 42,
    liquidity: 0.75,
    demand: 0.75,
  }),
  P({
    id: "canon-eos-r6-ii",
    category: "camera",
    manufacturer: "Canon",
    model: "EOS R6 Mark II",
    aliases: ["R6 II", "R6 Mark II"],
    releaseDate: "2022-12-01",
    launchPriceEur: 2899,
    refreshMonths: 42,
    liquidity: 0.82,
    demand: 0.8,
  }),
  P({
    id: "canon-eos-r5-ii",
    category: "camera",
    manufacturer: "Canon",
    model: "EOS R5 Mark II",
    aliases: ["R5 II", "R5 Mark II"],
    releaseDate: "2024-08-01",
    launchPriceEur: 4499,
    refreshMonths: 48,
    liquidity: 0.75,
    demand: 0.82,
  }),
  P({
    id: "fujifilm-x-t5",
    category: "camera",
    manufacturer: "Fujifilm",
    model: "X-T5",
    releaseDate: "2022-11-17",
    launchPriceEur: 1999,
    refreshMonths: 36,
    liquidity: 0.85,
    demand: 0.85,
  }),
  P({
    id: "fujifilm-x100vi",
    category: "camera",
    manufacturer: "Fujifilm",
    model: "X100VI",
    releaseDate: "2024-02-28",
    launchPriceEur: 1799,
    refreshMonths: 48,
    liquidity: 0.95,
    demand: 0.98,
    retentionBoost: 1.18,
  }),
  P({
    id: "nikon-z6-iii",
    category: "camera",
    manufacturer: "Nikon",
    model: "Z6 III",
    aliases: ["Z6III"],
    releaseDate: "2024-06-17",
    launchPriceEur: 2999,
    refreshMonths: 42,
    liquidity: 0.78,
    demand: 0.78,
  }),
  P({
    id: "dji-osmo-pocket-3",
    category: "camera",
    manufacturer: "DJI",
    model: "Osmo Pocket 3",
    releaseDate: "2023-10-25",
    launchPriceEur: 539,
    refreshMonths: 30,
    liquidity: 0.9,
    demand: 0.9,
  }),
  P({
    id: "gopro-hero-13-black",
    category: "camera",
    manufacturer: "GoPro",
    model: "HERO13 Black",
    aliases: ["Hero 13"],
    releaseDate: "2024-09-10",
    launchPriceEur: 449,
    refreshMonths: 12,
    liquidity: 0.8,
    demand: 0.6,
  }),

  // ── Lenses ───────────────────────────────────────────────────────────
  P({
    id: "sony-fe-24-70-gm-ii",
    category: "lens",
    manufacturer: "Sony",
    model: "FE 24–70 mm f/2.8 GM II",
    aliases: ["24-70 GM II", "SEL2470GM2"],
    releaseDate: "2022-06-01",
    launchPriceEur: 2499,
    refreshMonths: 72,
    liquidity: 0.82,
    demand: 0.85,
  }),
  P({
    id: "sigma-35-f14-dg-dn-art",
    category: "lens",
    manufacturer: "Sigma",
    model: "35 mm f/1.4 DG DN Art",
    releaseDate: "2021-04-01",
    launchPriceEur: 899,
    refreshMonths: 72,
    liquidity: 0.78,
    demand: 0.7,
  }),

  // ── Gaming consoles ──────────────────────────────────────────────────
  P({
    id: "sony-playstation-5",
    category: "gaming_console",
    manufacturer: "Sony",
    model: "PlayStation 5",
    aliases: ["PS5"],
    releaseDate: "2020-11-19",
    launchPriceEur: 499,
    variants: [
      { name: "Disc Edition", launchPriceEur: 499, specs: { edition: "Disc Edition" } },
      { name: "Digital Edition", launchPriceEur: 399, specs: { edition: "Digital Edition" } },
    ],
    successorId: "sony-playstation-5-pro",
    refreshMonths: 60,
    liquidity: 0.92,
    demand: 0.8,
    barcodes: ["711719395201", "711719541028"],
  }),
  P({
    id: "sony-playstation-5-slim",
    category: "gaming_console",
    manufacturer: "Sony",
    model: "PlayStation 5 Slim",
    aliases: ["PS5 Slim"],
    releaseDate: "2023-11-10",
    launchPriceEur: 549,
    variants: [
      { name: "Disc Edition", launchPriceEur: 549, specs: { edition: "Disc Edition" } },
      { name: "Digital Edition", launchPriceEur: 449, specs: { edition: "Digital Edition" } },
    ],
    refreshMonths: 48,
    liquidity: 0.92,
    demand: 0.82,
  }),
  P({
    id: "sony-playstation-5-pro",
    category: "gaming_console",
    manufacturer: "Sony",
    model: "PlayStation 5 Pro",
    aliases: ["PS5 Pro"],
    releaseDate: "2024-11-07",
    launchPriceEur: 799,
    refreshMonths: 48,
    liquidity: 0.88,
    demand: 0.8,
  }),
  P({
    id: "microsoft-xbox-series-x",
    category: "gaming_console",
    manufacturer: "Microsoft",
    model: "Xbox Series X",
    releaseDate: "2020-11-10",
    launchPriceEur: 499,
    refreshMonths: 60,
    liquidity: 0.85,
    demand: 0.65,
  }),
  P({
    id: "nintendo-switch-2",
    category: "gaming_console",
    manufacturer: "Nintendo",
    model: "Switch 2",
    releaseDate: "2025-06-05",
    launchPriceEur: 469,
    refreshMonths: 72,
    liquidity: 0.95,
    demand: 0.95,
  }),
  P({
    id: "nintendo-switch-oled",
    category: "gaming_console",
    manufacturer: "Nintendo",
    model: "Switch OLED",
    releaseDate: "2021-10-08",
    launchPriceEur: 349,
    successorId: "nintendo-switch-2",
    refreshMonths: 72,
    liquidity: 0.92,
    demand: 0.75,
  }),
  P({
    id: "valve-steam-deck-oled",
    category: "gaming_console",
    manufacturer: "Valve",
    model: "Steam Deck OLED",
    releaseDate: "2023-11-16",
    launchPriceEur: 569,
    variants: [
      { name: "512 GB", launchPriceEur: 569, specs: { storage: "512 GB" } },
      { name: "1 TB", launchPriceEur: 679, specs: { storage: "1 TB" } },
    ],
    refreshMonths: 36,
    liquidity: 0.85,
    demand: 0.85,
  }),

  // ── GPUs ─────────────────────────────────────────────────────────────
  P({
    id: "nvidia-rtx-5090",
    category: "gpu",
    manufacturer: "NVIDIA",
    model: "GeForce RTX 5090",
    aliases: ["RTX 5090"],
    releaseDate: "2025-01-30",
    launchPriceEur: 2329,
    specs: { memory: "32 GB GDDR7" },
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.95,
  }),
  P({
    id: "nvidia-rtx-5080",
    category: "gpu",
    manufacturer: "NVIDIA",
    model: "GeForce RTX 5080",
    aliases: ["RTX 5080"],
    releaseDate: "2025-01-30",
    launchPriceEur: 1169,
    specs: { memory: "16 GB GDDR7" },
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.85,
  }),
  P({
    id: "nvidia-rtx-5070-ti",
    category: "gpu",
    manufacturer: "NVIDIA",
    model: "GeForce RTX 5070 Ti",
    aliases: ["RTX 5070 Ti"],
    releaseDate: "2025-02-20",
    launchPriceEur: 879,
    specs: { memory: "16 GB GDDR7" },
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.82,
  }),
  P({
    id: "nvidia-rtx-4090",
    category: "gpu",
    manufacturer: "NVIDIA",
    model: "GeForce RTX 4090",
    aliases: ["RTX 4090"],
    releaseDate: "2022-10-12",
    launchPriceEur: 1949,
    specs: { memory: "24 GB GDDR6X" },
    successorId: "nvidia-rtx-5090",
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.85,
  }),
  P({
    id: "nvidia-rtx-4080-super",
    category: "gpu",
    manufacturer: "NVIDIA",
    model: "GeForce RTX 4080 Super",
    aliases: ["RTX 4080 Super", "RTX 4080S"],
    releaseDate: "2024-01-31",
    launchPriceEur: 1109,
    specs: { memory: "16 GB GDDR6X" },
    successorId: "nvidia-rtx-5080",
    refreshMonths: 24,
    liquidity: 0.82,
    demand: 0.75,
  }),
  P({
    id: "nvidia-rtx-4070-super",
    category: "gpu",
    manufacturer: "NVIDIA",
    model: "GeForce RTX 4070 Super",
    aliases: ["RTX 4070 Super"],
    releaseDate: "2024-01-17",
    launchPriceEur: 659,
    specs: { memory: "12 GB GDDR6X" },
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.75,
  }),
  P({
    id: "amd-rx-9070-xt",
    category: "gpu",
    manufacturer: "AMD",
    model: "Radeon RX 9070 XT",
    aliases: ["RX 9070 XT"],
    releaseDate: "2025-03-06",
    launchPriceEur: 689,
    specs: { memory: "16 GB GDDR6" },
    refreshMonths: 24,
    liquidity: 0.8,
    demand: 0.8,
  }),

  // ── PC components ────────────────────────────────────────────────────
  P({
    id: "amd-ryzen-7-9800x3d",
    category: "pc_component",
    manufacturer: "AMD",
    model: "Ryzen 7 9800X3D",
    releaseDate: "2024-11-07",
    launchPriceEur: 529,
    specs: { type: "CPU" },
    refreshMonths: 18,
    liquidity: 0.85,
    demand: 0.9,
  }),
  P({
    id: "amd-ryzen-9-9950x",
    category: "pc_component",
    manufacturer: "AMD",
    model: "Ryzen 9 9950X",
    releaseDate: "2024-08-15",
    launchPriceEur: 699,
    specs: { type: "CPU" },
    refreshMonths: 18,
    liquidity: 0.8,
    demand: 0.75,
  }),
  P({
    id: "intel-core-ultra-9-285k",
    category: "pc_component",
    manufacturer: "Intel",
    model: "Core Ultra 9 285K",
    releaseDate: "2024-10-24",
    launchPriceEur: 629,
    specs: { type: "CPU" },
    refreshMonths: 15,
    liquidity: 0.75,
    demand: 0.6,
  }),

  // ── Monitors ─────────────────────────────────────────────────────────
  P({
    id: "apple-studio-display",
    category: "monitor",
    manufacturer: "Apple",
    model: "Studio Display",
    releaseDate: "2022-03-18",
    launchPriceEur: 1749,
    specs: { size: "27″", resolution: "5K" },
    refreshMonths: 48,
    liquidity: 0.8,
    demand: 0.78,
  }),
  P({
    id: "lg-ultragear-27gr95qe",
    category: "monitor",
    manufacturer: "LG",
    model: "UltraGear 27GR95QE OLED",
    aliases: ["27GR95QE"],
    releaseDate: "2023-01-15",
    launchPriceEur: 999,
    specs: { size: "27″", resolution: "1440p", panel: "OLED 240 Hz" },
    refreshMonths: 24,
    liquidity: 0.7,
    demand: 0.6,
  }),
  P({
    id: "samsung-odyssey-oled-g8-g80sd",
    category: "monitor",
    manufacturer: "Samsung",
    model: "Odyssey OLED G8 (G80SD)",
    aliases: ["Odyssey OLED G8"],
    releaseDate: "2024-06-01",
    launchPriceEur: 1199,
    specs: { size: "32″", resolution: "4K", panel: "OLED 240 Hz" },
    refreshMonths: 24,
    liquidity: 0.7,
    demand: 0.65,
  }),

  // ── Drones ───────────────────────────────────────────────────────────
  P({
    id: "dji-mini-4-pro",
    category: "drone",
    manufacturer: "DJI",
    model: "Mini 4 Pro",
    releaseDate: "2023-09-25",
    launchPriceEur: 799,
    variants: [
      { name: "Standard", launchPriceEur: 799, specs: { kit: "Standard" } },
      { name: "Fly More Combo", launchPriceEur: 1129, specs: { kit: "Fly More Combo" } },
    ],
    refreshMonths: 24,
    liquidity: 0.85,
    demand: 0.85,
  }),
  P({
    id: "dji-air-3s",
    category: "drone",
    manufacturer: "DJI",
    model: "Air 3S",
    releaseDate: "2024-10-15",
    launchPriceEur: 1099,
    variants: [
      { name: "Standard", launchPriceEur: 1099, specs: { kit: "Standard" } },
      { name: "Fly More Combo", launchPriceEur: 1499, specs: { kit: "Fly More Combo" } },
    ],
    refreshMonths: 24,
    liquidity: 0.82,
    demand: 0.82,
  }),
  P({
    id: "dji-mavic-4-pro",
    category: "drone",
    manufacturer: "DJI",
    model: "Mavic 4 Pro",
    releaseDate: "2025-05-13",
    launchPriceEur: 2099,
    refreshMonths: 30,
    liquidity: 0.8,
    demand: 0.85,
  }),

  // ── Audio ────────────────────────────────────────────────────────────
  P({
    id: "sonos-era-300",
    category: "audio",
    manufacturer: "Sonos",
    model: "Era 300",
    releaseDate: "2023-03-28",
    launchPriceEur: 499,
    refreshMonths: 48,
    liquidity: 0.75,
    demand: 0.65,
  }),
  P({
    id: "apple-homepod-2",
    category: "audio",
    manufacturer: "Apple",
    model: "HomePod (2nd generation)",
    aliases: ["HomePod 2"],
    releaseDate: "2023-02-03",
    launchPriceEur: 349,
    refreshMonths: 48,
    liquidity: 0.78,
    demand: 0.65,
  }),
];

const byId = new Map(CATALOG.map((p) => [p.id, p]));

export function getCatalogProduct(id: string | null | undefined): CatalogProduct | null {
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function findByBarcode(code: string): CatalogProduct | null {
  const clean = code.replace(/\D/g, "");
  return CATALOG.find((p) => p.barcodes?.includes(clean)) ?? null;
}

// ── Fuzzy matching ─────────────────────────────────────────────────────
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/α/g, "a")
    .replace(/[″"']/g, "")
    .replace(/[‑–—]/g, "-")
    .replace(/[^a-z0-9+.\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s)
    .split(/[\s\-/]+/)
    .filter((t) => t.length > 0 && t !== "inch");
}

export interface CatalogMatch {
  product: CatalogProduct;
  variant: CatalogVariant | null;
  score: number; // 0..1
}

/**
 * Score a product against manufacturer/model/variant/specs. The score is
 * conservative: a perfect model string match scores ~1, a partial token
 * overlap scores lower. Callers should reject matches below ~0.55.
 */
export function matchCatalog(input: {
  manufacturer?: string | null;
  model?: string | null;
  variant?: string | null;
  category?: AssetCategory | null;
  specs?: Record<string, string>;
}): CatalogMatch | null {
  const model = input.model?.trim();
  if (!model) return null;
  const inTokens = new Set(tokens(`${input.manufacturer ?? ""} ${model}`));
  const inModel = normalize(model);
  let best: CatalogMatch | null = null;

  for (const p of CATALOG) {
    if (input.category && p.category !== input.category) continue;
    const names = [p.model, ...(p.aliases ?? [])];
    let score = 0;
    for (const n of names) {
      const nNorm = normalize(n);
      if (nNorm === inModel) {
        score = Math.max(score, 1);
        continue;
      }
      const nTokens = tokens(`${p.manufacturer} ${n}`);
      const hits = nTokens.filter((t) => inTokens.has(t)).length;
      const modelTokens = tokens(n);
      const modelHits = modelTokens.filter((t) => inTokens.has(t)).length;
      // require every model token to be present for a strong match
      const coverage = modelTokens.length ? modelHits / modelTokens.length : 0;
      const extra = Math.max(0, inTokens.size - hits) * 0.05;
      const s = coverage * 0.9 - extra + (inModel.includes(nNorm) || nNorm.includes(inModel) ? 0.15 : 0);
      score = Math.max(score, Math.min(0.98, s));
    }
    if (input.manufacturer && normalize(input.manufacturer) !== normalize(p.manufacturer)) score -= 0.15;
    if (score > (best?.score ?? 0)) {
      best = { product: p, variant: pickVariant(p, input.variant, input.specs), score };
    }
  }
  return best && best.score >= 0.55 ? best : null;
}

export function pickVariant(
  p: CatalogProduct,
  variant?: string | null,
  specs?: Record<string, string>,
): CatalogVariant | null {
  if (!p.variants?.length) return null;
  if (variant) {
    const v = normalize(variant);
    const direct = p.variants.find((x) => normalize(x.name) === v || v.includes(normalize(x.name)));
    if (direct) return direct;
  }
  if (specs) {
    const norm: Record<string, string> = {};
    for (const [k, val] of Object.entries(specs)) norm[k] = normalize(val);
    let best: { v: CatalogVariant; hits: number } | null = null;
    for (const v of p.variants) {
      if (!v.specs) continue;
      let hits = 0;
      let miss = false;
      for (const [k, val] of Object.entries(v.specs)) {
        if (norm[k] == null) continue;
        if (norm[k].replace(/\s/g, "") === normalize(val).replace(/\s/g, "")) hits++;
        else miss = true;
      }
      if (!miss && hits > 0 && hits > (best?.hits ?? 0)) best = { v, hits };
    }
    if (best) return best.v;
  }
  return null;
}

/** Free-text search over the catalog (used by manual add + mock identification). */
export function searchCatalog(query: string, limit = 8): CatalogProduct[] {
  const q = tokens(query);
  if (!q.length) return [];
  const scored = CATALOG.map((p) => {
    const hay = tokens(`${p.manufacturer} ${p.model} ${(p.aliases ?? []).join(" ")}`);
    let s = 0;
    for (const t of q) {
      if (hay.includes(t)) s += 2;
      else if (hay.some((h) => h.startsWith(t))) s += 1;
    }
    return { p, s };
  })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.p.model.localeCompare(b.p.model));
  return scored.slice(0, limit).map((x) => x.p);
}

export function productDisplayName(p: CatalogProduct): string {
  return `${p.manufacturer} ${p.model}`;
}
