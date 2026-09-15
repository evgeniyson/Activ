/**
 * Asset categories. The database stores the category as text, so new
 * categories can be added here without a migration.
 */
export const CATEGORY_GROUPS = {
  electronics: "Consumer Electronics",
  mobility: "Mobility",
  fashion: "Fashion & Watches",
  music: "Music",
  collectibles: "Collectibles",
  home: "Home & Tools",
  vehicles: "Vehicles",
  other: "Other",
} as const;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;

export interface CategoryMeta {
  id: AssetCategory;
  label: string;
  group: CategoryGroup;
  /** Whether the MVP AI/valuation stack has first-class support */
  mvp: boolean;
  /** Typical spec keys we ask the AI to extract */
  specKeys: string[];
}

export const CATEGORIES = {
  smartphone: { id: "smartphone", label: "Smartphones", group: "electronics", mvp: true, specKeys: ["storage", "color", "connectivity"] },
  laptop: { id: "laptop", label: "Laptops", group: "electronics", mvp: true, specKeys: ["chip", "memory", "storage", "screen", "color"] },
  tablet: { id: "tablet", label: "Tablets", group: "electronics", mvp: true, specKeys: ["storage", "connectivity", "screen", "color"] },
  smartwatch: { id: "smartwatch", label: "Smartwatches", group: "electronics", mvp: true, specKeys: ["size", "case", "connectivity", "color"] },
  headphones: { id: "headphones", label: "Headphones", group: "electronics", mvp: true, specKeys: ["type", "color"] },
  camera: { id: "camera", label: "Cameras", group: "electronics", mvp: true, specKeys: ["sensor", "kit", "shutter_count"] },
  lens: { id: "lens", label: "Lenses", group: "electronics", mvp: true, specKeys: ["mount", "focal_length", "aperture"] },
  gaming_console: { id: "gaming_console", label: "Gaming Consoles", group: "electronics", mvp: true, specKeys: ["edition", "storage"] },
  gpu: { id: "gpu", label: "GPUs", group: "electronics", mvp: true, specKeys: ["memory", "board_partner"] },
  pc_component: { id: "pc_component", label: "PC Components", group: "electronics", mvp: true, specKeys: ["type", "spec"] },
  monitor: { id: "monitor", label: "Monitors", group: "electronics", mvp: true, specKeys: ["size", "resolution", "panel"] },
  drone: { id: "drone", label: "Drones", group: "electronics", mvp: true, specKeys: ["kit"] },
  audio: { id: "audio", label: "Audio", group: "electronics", mvp: true, specKeys: ["type"] },
  bicycle: { id: "bicycle", label: "Bicycles", group: "mobility", mvp: false, specKeys: ["frame_size", "groupset", "year"] },
  e_scooter: { id: "e_scooter", label: "E-scooters", group: "mobility", mvp: false, specKeys: ["range"] },
  watch: { id: "watch", label: "Watches", group: "fashion", mvp: false, specKeys: ["reference", "material", "size"] },
  sneakers: { id: "sneakers", label: "Sneakers", group: "fashion", mvp: false, specKeys: ["size", "colorway"] },
  fashion: { id: "fashion", label: "Fashion", group: "fashion", mvp: false, specKeys: ["size", "material"] },
  bag: { id: "bag", label: "Bags", group: "fashion", mvp: false, specKeys: ["material", "size"] },
  instrument: { id: "instrument", label: "Musical Instruments", group: "music", mvp: false, specKeys: ["type", "year"] },
  collectible: { id: "collectible", label: "Collectibles", group: "collectibles", mvp: false, specKeys: ["edition", "grade"] },
  furniture: { id: "furniture", label: "Furniture", group: "home", mvp: false, specKeys: ["material"] },
  appliance: { id: "appliance", label: "Appliances", group: "home", mvp: false, specKeys: ["type"] },
  tool: { id: "tool", label: "Tools", group: "home", mvp: false, specKeys: ["type"] },
  vehicle: { id: "vehicle", label: "Vehicles", group: "vehicles", mvp: false, specKeys: ["year", "mileage"] },
  other: { id: "other", label: "Other", group: "other", mvp: false, specKeys: [] },
} as const satisfies Record<string, Omit<CategoryMeta, "id"> & { id: string }>;

export type AssetCategory = keyof typeof CATEGORIES;
export const CATEGORY_IDS = Object.keys(CATEGORIES) as AssetCategory[];

export function isAssetCategory(v: unknown): v is AssetCategory {
  return typeof v === "string" && v in CATEGORIES;
}

export function categoryLabel(id: string): string {
  return isAssetCategory(id) ? CATEGORIES[id].label : "Other";
}

export function categoryMeta(id: string): CategoryMeta {
  return (isAssetCategory(id) ? CATEGORIES[id] : CATEGORIES.other) as CategoryMeta;
}
