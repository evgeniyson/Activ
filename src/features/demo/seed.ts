import "server-only";
import type { DataStore } from "@/services/data/store";
import type { AssetCategory, Condition, CurrencyCode, ExpenseType, Profile } from "@/types/domain";
import { createAssetWithValuation } from "@/features/assets/service";

interface SeedAsset {
  name: string;
  category: AssetCategory;
  manufacturer: string;
  model: string;
  variant: string | null;
  catalogId: string;
  specs: Record<string, string>;
  purchasePrice: number;
  purchaseCurrency: CurrencyCode;
  purchaseDate: string;
  retailer: string | null;
  condition: Condition;
  serialNumber: string | null;
  warrantyExpiration: string | null;
  notes: string | null;
  expenses?: { type: ExpenseType; amount: number; date: string; title: string }[];
}

/** Realistic demo portfolio — dates relative to Sept 2026. */
export const DEMO_ASSETS: SeedAsset[] = [
  {
    name: "iPhone 17 Pro",
    category: "smartphone",
    manufacturer: "Apple",
    model: "iPhone 17 Pro",
    variant: "256 GB",
    catalogId: "apple-iphone-17-pro",
    specs: { storage: "256 GB", color: "Deep Blue" },
    purchasePrice: 1299,
    purchaseCurrency: "EUR",
    purchaseDate: "2025-10-20",
    retailer: "Apple Store",
    condition: "excellent",
    serialNumber: "F2LXK7QP0R",
    warrantyExpiration: "2026-10-20",
    notes: "Daily driver. Case since day one.",
    expenses: [
      { type: "accessory", amount: 59, date: "2025-10-22", title: "Leather case" },
      { type: "repair", amount: 149, date: "2026-04-18", title: "Battery replacement" },
    ],
  },
  {
    name: "MacBook Air 13″ M4",
    category: "laptop",
    manufacturer: "Apple",
    model: "MacBook Air 13″ M4",
    variant: "16 GB / 512 GB",
    catalogId: "apple-macbook-air-13-m4",
    specs: { chip: "M4", memory: "16 GB", storage: "512 GB", color: "Midnight" },
    purchasePrice: 1499,
    purchaseCurrency: "EUR",
    purchaseDate: "2025-04-02",
    retailer: "MediaMarkt",
    condition: "excellent",
    serialNumber: "C02ZK3XLMD6T",
    warrantyExpiration: "2027-04-02",
    notes: null,
    expenses: [{ type: "accessory", amount: 89, date: "2025-04-05", title: "USB-C hub" }],
  },
  {
    name: "Sony α7 IV",
    category: "camera",
    manufacturer: "Sony",
    model: "α7 IV",
    variant: "Body only",
    catalogId: "sony-a7-iv",
    specs: { sensor: "33 MP full-frame", kit: "Body only", shutter_count: "18 400" },
    purchasePrice: 2599,
    purchaseCurrency: "EUR",
    purchaseDate: "2023-05-12",
    retailer: "Calumet",
    condition: "good",
    serialNumber: "3175442",
    warrantyExpiration: null,
    notes: "Minor wear on the grip.",
    expenses: [
      { type: "maintenance", amount: 60, date: "2025-11-03", title: "Sensor cleaning" },
      { type: "accessory", amount: 129, date: "2023-05-20", title: "Spare batteries + charger" },
    ],
  },
  {
    name: "PlayStation 5",
    category: "gaming_console",
    manufacturer: "Sony",
    model: "PlayStation 5",
    variant: "Disc Edition",
    catalogId: "sony-playstation-5",
    specs: { edition: "Disc Edition", storage: "825 GB" },
    purchasePrice: 499,
    purchaseCurrency: "EUR",
    purchaseDate: "2021-03-10",
    retailer: "Amazon",
    condition: "good",
    serialNumber: null,
    warrantyExpiration: null,
    notes: null,
    expenses: [{ type: "accessory", amount: 69, date: "2022-01-15", title: "Second DualSense controller" }],
  },
  {
    name: "Apple Watch Series 10",
    category: "smartwatch",
    manufacturer: "Apple",
    model: "Apple Watch Series 10",
    variant: "46 mm GPS",
    catalogId: "apple-watch-series-10",
    specs: { size: "46 mm", connectivity: "GPS", case: "Aluminium", color: "Jet Black" },
    purchasePrice: 479,
    purchaseCurrency: "EUR",
    purchaseDate: "2024-10-01",
    retailer: "Apple Store",
    condition: "excellent",
    serialNumber: null,
    warrantyExpiration: "2026-10-01",
    notes: null,
  },
  {
    name: "AirPods Pro 2",
    category: "headphones",
    manufacturer: "Apple",
    model: "AirPods Pro 2",
    variant: null,
    catalogId: "apple-airpods-pro-2",
    specs: { type: "In-ear, ANC", color: "White" },
    purchasePrice: 279,
    purchaseCurrency: "EUR",
    purchaseDate: "2023-12-20",
    retailer: "Apple Store",
    condition: "good",
    serialNumber: null,
    warrantyExpiration: null,
    notes: "Left bud slightly quieter.",
  },
  {
    name: "GeForce RTX 4080 Super",
    category: "gpu",
    manufacturer: "NVIDIA",
    model: "GeForce RTX 4080 Super",
    variant: null,
    catalogId: "nvidia-rtx-4080-super",
    specs: { memory: "16 GB GDDR6X", board_partner: "ASUS TUF" },
    purchasePrice: 1149,
    purchaseCurrency: "EUR",
    purchaseDate: "2024-02-15",
    retailer: "Alternate",
    condition: "excellent",
    serialNumber: null,
    warrantyExpiration: "2027-02-15",
    notes: null,
  },
];

export async function seedDemoPortfolio(store: DataStore, userId: string, profile: Profile) {
  const created = [];
  for (const s of DEMO_ASSETS) {
    const { asset } = await createAssetWithValuation(store, userId, profile, {
      name: s.name,
      category: s.category,
      manufacturer: s.manufacturer,
      model: s.model,
      variant: s.variant,
      description: null,
      specs: s.specs,
      catalogId: s.catalogId,
      purchasePrice: s.purchasePrice,
      purchaseCurrency: s.purchaseCurrency,
      purchaseDate: s.purchaseDate,
      retailer: s.retailer,
      condition: s.condition,
      identificationConfidence: 0.97,
      serialNumber: s.serialNumber,
      imei: null,
      warrantyExpiration: s.warrantyExpiration,
      notes: s.notes,
    });
    for (const e of s.expenses ?? []) {
      await store.addExpense(userId, { assetId: asset.id, type: e.type, amount: e.amount, currency: s.purchaseCurrency, date: e.date, title: e.title, notes: null });
      await store.addEvent(userId, { assetId: asset.id, type: "expense", date: e.date, title: e.title, description: e.type.charAt(0).toUpperCase() + e.type.slice(1), amount: e.amount, currency: s.purchaseCurrency, meta: null });
    }
    created.push(asset);
  }
  return created;
}
