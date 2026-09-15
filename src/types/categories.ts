/**
 * Категории активов. В базе категория хранится как текст, поэтому новые
 * категории добавляются здесь без миграции.
 */
export const CATEGORY_GROUPS = {
  electronics: "Электроника",
  mobility: "Транспорт",
  fashion: "Одежда и часы",
  music: "Музыка",
  collectibles: "Коллекционное",
  home: "Дом и инструменты",
  vehicles: "Автомобили",
  other: "Прочее",
} as const;

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;

export interface CategoryMeta {
  id: AssetCategory;
  label: string;
  group: CategoryGroup;
  /** Полноценная поддержка AI/оценки в MVP */
  mvp: boolean;
  /** Типичные ключи характеристик, которые просим извлечь у AI */
  specKeys: string[];
}

export const CATEGORIES = {
  smartphone: { id: "smartphone", label: "Смартфоны", group: "electronics", mvp: true, specKeys: ["storage", "color", "connectivity"] },
  laptop: { id: "laptop", label: "Ноутбуки", group: "electronics", mvp: true, specKeys: ["chip", "memory", "storage", "screen", "color"] },
  tablet: { id: "tablet", label: "Планшеты", group: "electronics", mvp: true, specKeys: ["storage", "connectivity", "screen", "color"] },
  smartwatch: { id: "smartwatch", label: "Смарт-часы", group: "electronics", mvp: true, specKeys: ["size", "case", "connectivity", "color"] },
  headphones: { id: "headphones", label: "Наушники", group: "electronics", mvp: true, specKeys: ["type", "color"] },
  camera: { id: "camera", label: "Камеры", group: "electronics", mvp: true, specKeys: ["sensor", "kit", "shutter_count"] },
  lens: { id: "lens", label: "Объективы", group: "electronics", mvp: true, specKeys: ["mount", "focal_length", "aperture"] },
  gaming_console: { id: "gaming_console", label: "Игровые консоли", group: "electronics", mvp: true, specKeys: ["edition", "storage"] },
  gpu: { id: "gpu", label: "Видеокарты", group: "electronics", mvp: true, specKeys: ["memory", "board_partner"] },
  pc_component: { id: "pc_component", label: "Комплектующие ПК", group: "electronics", mvp: true, specKeys: ["type", "spec"] },
  monitor: { id: "monitor", label: "Мониторы", group: "electronics", mvp: true, specKeys: ["size", "resolution", "panel"] },
  drone: { id: "drone", label: "Дроны", group: "electronics", mvp: true, specKeys: ["kit"] },
  audio: { id: "audio", label: "Аудио", group: "electronics", mvp: true, specKeys: ["type"] },
  bicycle: { id: "bicycle", label: "Велосипеды", group: "mobility", mvp: false, specKeys: ["frame_size", "groupset", "year"] },
  e_scooter: { id: "e_scooter", label: "Электросамокаты", group: "mobility", mvp: false, specKeys: ["range"] },
  watch: { id: "watch", label: "Часы", group: "fashion", mvp: false, specKeys: ["reference", "material", "size"] },
  sneakers: { id: "sneakers", label: "Кроссовки", group: "fashion", mvp: false, specKeys: ["size", "colorway"] },
  fashion: { id: "fashion", label: "Одежда", group: "fashion", mvp: false, specKeys: ["size", "material"] },
  bag: { id: "bag", label: "Сумки", group: "fashion", mvp: false, specKeys: ["material", "size"] },
  instrument: { id: "instrument", label: "Музыкальные инструменты", group: "music", mvp: false, specKeys: ["type", "year"] },
  collectible: { id: "collectible", label: "Коллекционные предметы", group: "collectibles", mvp: false, specKeys: ["edition", "grade"] },
  furniture: { id: "furniture", label: "Мебель", group: "home", mvp: false, specKeys: ["material"] },
  appliance: { id: "appliance", label: "Бытовая техника", group: "home", mvp: false, specKeys: ["type"] },
  tool: { id: "tool", label: "Инструменты", group: "home", mvp: false, specKeys: ["type"] },
  vehicle: { id: "vehicle", label: "Автомобили", group: "vehicles", mvp: false, specKeys: ["year", "mileage"] },
  other: { id: "other", label: "Прочее", group: "other", mvp: false, specKeys: [] },
} as const satisfies Record<string, Omit<CategoryMeta, "id"> & { id: string }>;

export type AssetCategory = keyof typeof CATEGORIES;
export const CATEGORY_IDS = Object.keys(CATEGORIES) as AssetCategory[];

export function isAssetCategory(v: unknown): v is AssetCategory {
  return typeof v === "string" && v in CATEGORIES;
}

export function categoryLabel(id: string): string {
  return isAssetCategory(id) ? CATEGORIES[id].label : "Прочее";
}

export function categoryMeta(id: string): CategoryMeta {
  return (isAssetCategory(id) ? CATEGORIES[id] : CATEGORIES.other) as CategoryMeta;
}

/** Русские подписи для ключей характеристик */
export const SPEC_LABELS: Record<string, string> = {
  storage: "Память",
  memory: "ОЗУ",
  color: "Цвет",
  connectivity: "Связь",
  chip: "Процессор",
  screen: "Экран",
  size: "Размер",
  case: "Корпус",
  type: "Тип",
  sensor: "Сенсор",
  kit: "Комплект",
  shutter_count: "Пробег затвора",
  mount: "Байонет",
  focal_length: "Фокусное расстояние",
  aperture: "Диафрагма",
  edition: "Издание",
  board_partner: "Производитель платы",
  spec: "Характеристика",
  resolution: "Разрешение",
  panel: "Матрица",
  frame_size: "Размер рамы",
  groupset: "Группсет",
  year: "Год",
  range: "Запас хода",
  reference: "Референс",
  material: "Материал",
  colorway: "Расцветка",
  grade: "Грейд",
  mileage: "Пробег",
};

export function specLabel(key: string): string {
  return SPEC_LABELS[key] ?? key.replace(/_/g, " ");
}
