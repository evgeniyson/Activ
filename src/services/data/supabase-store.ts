import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Asset,
  AssetDocument,
  AssetEvent,
  AssetExpense,
  AssetImage,
  AssetValueHistory,
  Notification,
  PortfolioSnapshot,
  Profile,
} from "@/types/domain";
import { DEFAULT_NOTIFICATION_PREFS } from "@/types/domain";
import type {
  AssetPatch,
  DataStore,
  NewAsset,
  NewDocument,
  NewEvent,
  NewExpense,
  NewImage,
  NewNotification,
  NewSnapshot,
  NewValueHistory,
  ProfilePatch,
} from "./store";

type Row = Record<string, unknown>;

const num = (v: unknown): number | null => (v == null ? null : Number(v));
const str = (v: unknown): string | null => (v == null ? null : String(v));

/** Supabase-backed store. RLS enforces ownership; we still filter by user_id explicitly. */
export class SupabaseStore implements DataStore {
  constructor(private readonly sb: SupabaseClient) {}

  private fail(ctx: string, error: { message: string } | null): never {
    throw new Error(`[supabase] ${ctx}: ${error?.message ?? "unknown error"}`);
  }

  // ── Profiles ────────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const { data, error } = await this.sb.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) this.fail("getProfile", error);
    return data ? mapProfile(data) : null;
  }

  async upsertProfile(userId: string, patch: ProfilePatch & { email?: string | null }) {
    const row: Row = { id: userId };
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.displayName !== undefined) row.display_name = patch.displayName;
    if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
    if (patch.country !== undefined) row.country = patch.country;
    if (patch.preferredCurrency !== undefined) row.preferred_currency = patch.preferredCurrency;
    if (patch.marketRegion !== undefined) row.market_region = patch.marketRegion;
    if (patch.onboardingCompleted !== undefined) row.onboarding_completed = patch.onboardingCompleted;
    if (patch.notificationPrefs !== undefined) row.notification_prefs = patch.notificationPrefs;
    const { data, error } = await this.sb.from("profiles").upsert(row, { onConflict: "id" }).select("*").single();
    if (error) this.fail("upsertProfile", error);
    return mapProfile(data);
  }

  // ── Assets ──────────────────────────────────────────────────────────
  async listAssets(userId: string, opts?: { status?: Asset["status"] | "all" }) {
    let q = this.sb.from("assets").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    const status = opts?.status ?? "active";
    if (status !== "all") q = q.eq("status", status);
    const { data, error } = await q;
    if (error) this.fail("listAssets", error);
    return (data ?? []).map(mapAsset);
  }

  async getAsset(userId: string, id: string) {
    const { data, error } = await this.sb.from("assets").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
    if (error) this.fail("getAsset", error);
    return data ? mapAsset(data) : null;
  }

  async createAsset(userId: string, data: NewAsset) {
    const { data: row, error } = await this.sb
      .from("assets")
      .insert({ ...assetToRow(data), user_id: userId })
      .select("*")
      .single();
    if (error) this.fail("createAsset", error);
    return mapAsset(row);
  }

  async updateAsset(userId: string, id: string, patch: AssetPatch) {
    const { data, error } = await this.sb
      .from("assets")
      .update(assetToRow(patch))
      .eq("user_id", userId)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) this.fail("updateAsset", error);
    return data ? mapAsset(data) : null;
  }

  async deleteAsset(userId: string, id: string) {
    const { error, count } = await this.sb.from("assets").delete({ count: "exact" }).eq("user_id", userId).eq("id", id);
    if (error) this.fail("deleteAsset", error);
    return (count ?? 0) > 0;
  }

  // ── Images ──────────────────────────────────────────────────────────
  async listImages(userId: string, assetId: string) {
    const { data, error } = await this.sb.from("asset_images").select("*").eq("user_id", userId).eq("asset_id", assetId).order("created_at");
    if (error) this.fail("listImages", error);
    return (data ?? []).map(mapImage);
  }
  async addImage(userId: string, d: NewImage) {
    const { data, error } = await this.sb
      .from("asset_images")
      .insert({ asset_id: d.assetId, user_id: userId, url: d.url, storage_path: d.storagePath, width: d.width, height: d.height, is_cover: d.isCover })
      .select("*")
      .single();
    if (error) this.fail("addImage", error);
    return mapImage(data);
  }
  async deleteImage(userId: string, id: string) {
    const { error, count } = await this.sb.from("asset_images").delete({ count: "exact" }).eq("user_id", userId).eq("id", id);
    if (error) this.fail("deleteImage", error);
    return (count ?? 0) > 0;
  }

  // ── Expenses ────────────────────────────────────────────────────────
  async listExpenses(userId: string, assetId?: string) {
    let q = this.sb.from("asset_expenses").select("*").eq("user_id", userId).order("date", { ascending: false });
    if (assetId) q = q.eq("asset_id", assetId);
    const { data, error } = await q;
    if (error) this.fail("listExpenses", error);
    return (data ?? []).map(mapExpense);
  }
  async addExpense(userId: string, d: NewExpense) {
    const { data, error } = await this.sb
      .from("asset_expenses")
      .insert({ asset_id: d.assetId, user_id: userId, type: d.type, amount: d.amount, currency: d.currency, date: d.date, title: d.title, notes: d.notes })
      .select("*")
      .single();
    if (error) this.fail("addExpense", error);
    return mapExpense(data);
  }
  async deleteExpense(userId: string, id: string) {
    const { error, count } = await this.sb.from("asset_expenses").delete({ count: "exact" }).eq("user_id", userId).eq("id", id);
    if (error) this.fail("deleteExpense", error);
    return (count ?? 0) > 0;
  }

  // ── Documents ───────────────────────────────────────────────────────
  async listDocuments(userId: string, assetId: string) {
    const { data, error } = await this.sb.from("asset_documents").select("*").eq("user_id", userId).eq("asset_id", assetId).order("created_at");
    if (error) this.fail("listDocuments", error);
    return (data ?? []).map(mapDocument);
  }
  async addDocument(userId: string, d: NewDocument) {
    const { data, error } = await this.sb
      .from("asset_documents")
      .insert({ asset_id: d.assetId, user_id: userId, type: d.type, title: d.title, url: d.url, storage_path: d.storagePath })
      .select("*")
      .single();
    if (error) this.fail("addDocument", error);
    return mapDocument(data);
  }
  async deleteDocument(userId: string, id: string) {
    const { error, count } = await this.sb.from("asset_documents").delete({ count: "exact" }).eq("user_id", userId).eq("id", id);
    if (error) this.fail("deleteDocument", error);
    return (count ?? 0) > 0;
  }

  // ── Value history ───────────────────────────────────────────────────
  async listValueHistory(userId: string, assetId?: string) {
    let q = this.sb.from("asset_value_history").select("*").eq("user_id", userId).order("date").order("created_at");
    if (assetId) q = q.eq("asset_id", assetId);
    const { data, error } = await q;
    if (error) this.fail("listValueHistory", error);
    return (data ?? []).map(mapHistory);
  }
  async addValueHistory(userId: string, entries: NewValueHistory[]) {
    if (!entries.length) return [];
    const rows = entries.map((e) => ({
      asset_id: e.assetId,
      user_id: userId,
      date: e.date,
      estimated_value: e.estimatedValue,
      low_estimate: e.lowEstimate,
      high_estimate: e.highEstimate,
      quick_sale_estimate: e.quickSaleEstimate,
      currency: e.currency,
      source: e.source,
      confidence: e.confidence,
      comparables_count: e.comparablesCount,
    }));
    const { data, error } = await this.sb.from("asset_value_history").insert(rows).select("*");
    if (error) this.fail("addValueHistory", error);
    return (data ?? []).map(mapHistory);
  }

  // ── Events ──────────────────────────────────────────────────────────
  async listEvents(userId: string, opts?: { assetId?: string; limit?: number }) {
    let q = this.sb.from("asset_events").select("*").eq("user_id", userId).order("date", { ascending: false }).order("created_at", { ascending: false });
    if (opts?.assetId) q = q.eq("asset_id", opts.assetId);
    if (opts?.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) this.fail("listEvents", error);
    return (data ?? []).map(mapEvent);
  }
  async addEvent(userId: string, d: NewEvent) {
    const { data, error } = await this.sb
      .from("asset_events")
      .insert({ asset_id: d.assetId, user_id: userId, type: d.type, date: d.date, title: d.title, description: d.description, amount: d.amount, currency: d.currency, meta: d.meta })
      .select("*")
      .single();
    if (error) this.fail("addEvent", error);
    return mapEvent(data);
  }

  // ── Snapshots ───────────────────────────────────────────────────────
  async listSnapshots(userId: string, opts?: { from?: string; to?: string }) {
    let q = this.sb.from("portfolio_snapshots").select("*").eq("user_id", userId).order("date");
    if (opts?.from) q = q.gte("date", opts.from);
    if (opts?.to) q = q.lte("date", opts.to);
    const { data, error } = await q;
    if (error) this.fail("listSnapshots", error);
    return (data ?? []).map(mapSnapshot);
  }
  async upsertSnapshots(userId: string, snapshots: NewSnapshot[]) {
    if (!snapshots.length) return;
    const rows = snapshots.map((s) => ({
      user_id: userId,
      date: s.date,
      total_value: s.totalValue,
      purchase_value: s.purchaseValue,
      total_depreciation: s.totalDepreciation,
      currency: s.currency,
      asset_count: s.assetCount,
    }));
    const { error } = await this.sb.from("portfolio_snapshots").upsert(rows, { onConflict: "user_id,date" });
    if (error) this.fail("upsertSnapshots", error);
  }

  // ── Notifications ───────────────────────────────────────────────────
  async listNotifications(userId: string, opts?: { unreadOnly?: boolean; limit?: number }) {
    let q = this.sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (opts?.unreadOnly) q = q.is("read_at", null);
    if (opts?.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) this.fail("listNotifications", error);
    return (data ?? []).map(mapNotification);
  }
  async addNotification(userId: string, d: NewNotification) {
    const { data, error } = await this.sb
      .from("notifications")
      .insert({ user_id: userId, type: d.type, title: d.title, body: d.body, asset_id: d.assetId, href: d.href })
      .select("*")
      .single();
    if (error) this.fail("addNotification", error);
    return mapNotification(data);
  }
  async markNotificationsRead(userId: string, ids: string[] | "all") {
    let q = this.sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", userId).is("read_at", null);
    if (ids !== "all") q = q.in("id", ids);
    const { error } = await q;
    if (error) this.fail("markNotificationsRead", error);
  }
  async countUnreadNotifications(userId: string) {
    const { count, error } = await this.sb.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId).is("read_at", null);
    if (error) this.fail("countUnreadNotifications", error);
    return count ?? 0;
  }

  async deleteAllUserData(userId: string) {
    // Cascades remove children of assets; snapshots and notifications are user-scoped.
    for (const table of ["assets", "portfolio_snapshots", "notifications"]) {
      const { error } = await this.sb.from(table).delete().eq("user_id", userId);
      if (error) this.fail(`deleteAllUserData:${table}`, error);
    }
  }
}

// ── Mappers ─────────────────────────────────────────────────────────────
function mapProfile(r: Row): Profile {
  return {
    id: String(r.id),
    email: str(r.email),
    displayName: str(r.display_name),
    avatarUrl: str(r.avatar_url),
    country: str(r.country),
    preferredCurrency: (r.preferred_currency as Profile["preferredCurrency"]) ?? "EUR",
    marketRegion: (r.market_region as Profile["marketRegion"]) ?? "EU",
    onboardingCompleted: Boolean(r.onboarding_completed),
    notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS, ...((r.notification_prefs as Partial<Profile["notificationPrefs"]>) ?? {}) },
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapAsset(r: Row): Asset {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    name: String(r.name),
    category: r.category as Asset["category"],
    manufacturer: str(r.manufacturer),
    model: str(r.model),
    variant: str(r.variant),
    description: str(r.description),
    specs: (r.specs as Asset["specs"]) ?? {},
    catalogId: str(r.catalog_id),
    purchasePrice: Number(r.purchase_price),
    purchaseCurrency: r.purchase_currency as Asset["purchaseCurrency"],
    purchaseDate: String(r.purchase_date),
    retailer: str(r.retailer),
    condition: r.condition as Asset["condition"],
    currentEstimatedValue: num(r.current_estimated_value),
    currentLowEstimate: num(r.current_low_estimate),
    currentHighEstimate: num(r.current_high_estimate),
    quickSaleValue: num(r.quick_sale_value),
    valuationConfidence: num(r.valuation_confidence),
    valuationCurrency: (r.valuation_currency as Asset["valuationCurrency"]) ?? "EUR",
    valuationDate: str(r.valuation_date),
    identificationConfidence: num(r.identification_confidence),
    serialNumber: str(r.serial_number),
    imei: str(r.imei),
    warrantyExpiration: str(r.warranty_expiration),
    notes: str(r.notes),
    status: r.status as Asset["status"],
    soldPrice: num(r.sold_price),
    soldDate: str(r.sold_date),
    coverImageUrl: str(r.cover_image_url),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function assetToRow(a: AssetPatch): Row {
  const row: Row = {};
  const set = (k: string, v: unknown) => {
    if (v !== undefined) row[k] = v;
  };
  set("name", a.name);
  set("category", a.category);
  set("manufacturer", a.manufacturer);
  set("model", a.model);
  set("variant", a.variant);
  set("description", a.description);
  set("specs", a.specs);
  set("catalog_id", a.catalogId);
  set("purchase_price", a.purchasePrice);
  set("purchase_currency", a.purchaseCurrency);
  set("purchase_date", a.purchaseDate);
  set("retailer", a.retailer);
  set("condition", a.condition);
  set("current_estimated_value", a.currentEstimatedValue);
  set("current_low_estimate", a.currentLowEstimate);
  set("current_high_estimate", a.currentHighEstimate);
  set("quick_sale_value", a.quickSaleValue);
  set("valuation_confidence", a.valuationConfidence);
  set("valuation_currency", a.valuationCurrency);
  set("valuation_date", a.valuationDate);
  set("identification_confidence", a.identificationConfidence);
  set("serial_number", a.serialNumber);
  set("imei", a.imei);
  set("warranty_expiration", a.warrantyExpiration);
  set("notes", a.notes);
  set("status", a.status);
  set("sold_price", a.soldPrice);
  set("sold_date", a.soldDate);
  set("cover_image_url", a.coverImageUrl);
  return row;
}

function mapImage(r: Row): AssetImage {
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    userId: String(r.user_id),
    url: String(r.url),
    storagePath: str(r.storage_path),
    width: num(r.width),
    height: num(r.height),
    isCover: Boolean(r.is_cover),
    createdAt: String(r.created_at),
  };
}

function mapExpense(r: Row): AssetExpense {
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    userId: String(r.user_id),
    type: r.type as AssetExpense["type"],
    amount: Number(r.amount),
    currency: r.currency as AssetExpense["currency"],
    date: String(r.date),
    title: String(r.title),
    notes: str(r.notes),
    createdAt: String(r.created_at),
  };
}

function mapDocument(r: Row): AssetDocument {
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    userId: String(r.user_id),
    type: r.type as AssetDocument["type"],
    title: String(r.title),
    url: String(r.url),
    storagePath: str(r.storage_path),
    createdAt: String(r.created_at),
  };
}

function mapHistory(r: Row): AssetValueHistory {
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    userId: String(r.user_id),
    date: String(r.date),
    estimatedValue: Number(r.estimated_value),
    lowEstimate: Number(r.low_estimate),
    highEstimate: Number(r.high_estimate),
    quickSaleEstimate: num(r.quick_sale_estimate),
    currency: r.currency as AssetValueHistory["currency"],
    source: r.source as AssetValueHistory["source"],
    confidence: Number(r.confidence),
    comparablesCount: num(r.comparables_count),
    createdAt: String(r.created_at),
  };
}

function mapEvent(r: Row): AssetEvent {
  return {
    id: String(r.id),
    assetId: String(r.asset_id),
    userId: String(r.user_id),
    type: r.type as AssetEvent["type"],
    date: String(r.date),
    title: String(r.title),
    description: str(r.description),
    amount: num(r.amount),
    currency: (r.currency as AssetEvent["currency"]) ?? null,
    meta: (r.meta as AssetEvent["meta"]) ?? null,
    createdAt: String(r.created_at),
  };
}

function mapSnapshot(r: Row): PortfolioSnapshot {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    date: String(r.date),
    totalValue: Number(r.total_value),
    purchaseValue: Number(r.purchase_value),
    totalDepreciation: Number(r.total_depreciation),
    currency: r.currency as PortfolioSnapshot["currency"],
    assetCount: Number(r.asset_count ?? 0),
    createdAt: String(r.created_at),
  };
}

function mapNotification(r: Row): Notification {
  return {
    id: String(r.id),
    userId: String(r.user_id),
    type: r.type as Notification["type"],
    title: String(r.title),
    body: String(r.body),
    assetId: str(r.asset_id),
    href: str(r.href),
    readAt: str(r.read_at),
    createdAt: String(r.created_at),
  };
}
