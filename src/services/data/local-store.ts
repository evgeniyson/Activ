import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
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

/**
 * File-backed store for zero-config local development and previews.
 * Persists to `.data/activ-local.json` (git-ignored). Not for production.
 */
interface Db {
  profiles: Record<string, Profile>;
  assets: Asset[];
  images: AssetImage[];
  expenses: AssetExpense[];
  documents: AssetDocument[];
  history: AssetValueHistory[];
  events: AssetEvent[];
  snapshots: PortfolioSnapshot[];
  notifications: Notification[];
}

const EMPTY: Db = {
  profiles: {},
  assets: [],
  images: [],
  expenses: [],
  documents: [],
  history: [],
  events: [],
  snapshots: [],
  notifications: [],
};

declare global {
  var __activLocalDb: { db: Db; file: string } | undefined;
}

function dataDir() {
  return process.env.ACTIV_DATA_DIR ?? path.join(process.cwd(), ".data");
}

function load(): { db: Db; file: string } {
  if (globalThis.__activLocalDb) return globalThis.__activLocalDb;
  const dir = dataDir();
  const file = path.join(dir, "activ-local.json");
  let db: Db = structuredClone(EMPTY);
  try {
    if (fs.existsSync(file)) db = { ...structuredClone(EMPTY), ...(JSON.parse(fs.readFileSync(file, "utf8")) as Partial<Db>) };
  } catch {
    db = structuredClone(EMPTY);
  }
  globalThis.__activLocalDb = { db, file };
  return globalThis.__activLocalDb;
}

let writeTimer: NodeJS.Timeout | null = null;
function persist() {
  const { db, file } = load();
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      const tmp = `${file}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(db));
      fs.renameSync(tmp, file);
    } catch (e) {
      console.error("[local-store] persist failed", e);
    }
  }, 50);
}

const now = () => new Date().toISOString();

export class LocalStore implements DataStore {
  private get db(): Db {
    return load().db;
  }

  async getProfile(userId: string) {
    return this.db.profiles[userId] ?? null;
  }

  async upsertProfile(userId: string, patch: ProfilePatch & { email?: string | null }) {
    const existing = this.db.profiles[userId];
    const profile: Profile = existing
      ? { ...existing, ...patch, updatedAt: now() }
      : {
          id: userId,
          email: patch.email ?? null,
          displayName: patch.displayName ?? null,
          avatarUrl: patch.avatarUrl ?? null,
          country: patch.country ?? null,
          preferredCurrency: patch.preferredCurrency ?? "EUR",
          marketRegion: patch.marketRegion ?? "EU",
          onboardingCompleted: patch.onboardingCompleted ?? false,
          notificationPrefs: patch.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS,
          createdAt: now(),
          updatedAt: now(),
        };
    this.db.profiles[userId] = profile;
    persist();
    return profile;
  }

  async listAssets(userId: string, opts?: { status?: Asset["status"] | "all" }) {
    const status = opts?.status ?? "active";
    return this.db.assets
      .filter((a) => a.userId === userId && (status === "all" || a.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAsset(userId: string, id: string) {
    return this.db.assets.find((a) => a.id === id && a.userId === userId) ?? null;
  }

  async createAsset(userId: string, data: NewAsset) {
    const asset: Asset = { ...data, id: randomUUID(), userId, createdAt: now(), updatedAt: now() };
    this.db.assets.push(asset);
    persist();
    return asset;
  }

  async updateAsset(userId: string, id: string, patch: AssetPatch) {
    const idx = this.db.assets.findIndex((a) => a.id === id && a.userId === userId);
    if (idx < 0) return null;
    const updated: Asset = { ...this.db.assets[idx], ...patch, updatedAt: now() };
    this.db.assets[idx] = updated;
    persist();
    return updated;
  }

  async deleteAsset(userId: string, id: string) {
    const before = this.db.assets.length;
    this.db.assets = this.db.assets.filter((a) => !(a.id === id && a.userId === userId));
    if (this.db.assets.length === before) return false;
    this.db.images = this.db.images.filter((x) => x.assetId !== id);
    this.db.expenses = this.db.expenses.filter((x) => x.assetId !== id);
    this.db.documents = this.db.documents.filter((x) => x.assetId !== id);
    this.db.history = this.db.history.filter((x) => x.assetId !== id);
    this.db.events = this.db.events.filter((x) => x.assetId !== id);
    this.db.notifications = this.db.notifications.filter((x) => x.assetId !== id);
    persist();
    return true;
  }

  async listImages(userId: string, assetId: string) {
    return this.db.images.filter((i) => i.userId === userId && i.assetId === assetId);
  }
  async addImage(userId: string, data: NewImage) {
    const img: AssetImage = { ...data, id: randomUUID(), userId, createdAt: now() };
    this.db.images.push(img);
    persist();
    return img;
  }
  async deleteImage(userId: string, id: string) {
    const before = this.db.images.length;
    this.db.images = this.db.images.filter((i) => !(i.id === id && i.userId === userId));
    persist();
    return this.db.images.length !== before;
  }

  async listExpenses(userId: string, assetId?: string) {
    return this.db.expenses
      .filter((e) => e.userId === userId && (!assetId || e.assetId === assetId))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  async addExpense(userId: string, data: NewExpense) {
    const e: AssetExpense = { ...data, id: randomUUID(), userId, createdAt: now() };
    this.db.expenses.push(e);
    persist();
    return e;
  }
  async deleteExpense(userId: string, id: string) {
    const before = this.db.expenses.length;
    this.db.expenses = this.db.expenses.filter((e) => !(e.id === id && e.userId === userId));
    persist();
    return this.db.expenses.length !== before;
  }

  async listDocuments(userId: string, assetId: string) {
    return this.db.documents.filter((d) => d.userId === userId && d.assetId === assetId);
  }
  async addDocument(userId: string, data: NewDocument) {
    const d: AssetDocument = { ...data, id: randomUUID(), userId, createdAt: now() };
    this.db.documents.push(d);
    persist();
    return d;
  }
  async deleteDocument(userId: string, id: string) {
    const before = this.db.documents.length;
    this.db.documents = this.db.documents.filter((d) => !(d.id === id && d.userId === userId));
    persist();
    return this.db.documents.length !== before;
  }

  async listValueHistory(userId: string, assetId?: string) {
    return this.db.history
      .filter((h) => h.userId === userId && (!assetId || h.assetId === assetId))
      .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  }
  async addValueHistory(userId: string, entries: NewValueHistory[]) {
    const created = entries.map((e) => ({ ...e, id: randomUUID(), userId, createdAt: now() }) as AssetValueHistory);
    this.db.history.push(...created);
    persist();
    return created;
  }

  async listEvents(userId: string, opts?: { assetId?: string; limit?: number }) {
    const list = this.db.events
      .filter((e) => e.userId === userId && (!opts?.assetId || e.assetId === opts.assetId))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    return opts?.limit ? list.slice(0, opts.limit) : list;
  }
  async addEvent(userId: string, data: NewEvent) {
    const e: AssetEvent = { ...data, id: randomUUID(), userId, createdAt: now() };
    this.db.events.push(e);
    persist();
    return e;
  }

  async listSnapshots(userId: string, opts?: { from?: string; to?: string }) {
    return this.db.snapshots
      .filter((s) => s.userId === userId && (!opts?.from || s.date >= opts.from) && (!opts?.to || s.date <= opts.to))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  async upsertSnapshots(userId: string, snapshots: NewSnapshot[]) {
    for (const s of snapshots) {
      const idx = this.db.snapshots.findIndex((x) => x.userId === userId && x.date === s.date);
      if (idx >= 0) this.db.snapshots[idx] = { ...this.db.snapshots[idx], ...s };
      else this.db.snapshots.push({ ...s, id: randomUUID(), userId, createdAt: now() });
    }
    persist();
  }

  async listNotifications(userId: string, opts?: { unreadOnly?: boolean; limit?: number }) {
    const list = this.db.notifications
      .filter((n) => n.userId === userId && (!opts?.unreadOnly || !n.readAt))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return opts?.limit ? list.slice(0, opts.limit) : list;
  }
  async addNotification(userId: string, data: NewNotification) {
    const n: Notification = { ...data, id: randomUUID(), userId, readAt: null, createdAt: now() };
    this.db.notifications.push(n);
    persist();
    return n;
  }
  async markNotificationsRead(userId: string, ids: string[] | "all") {
    for (const n of this.db.notifications) {
      if (n.userId !== userId || n.readAt) continue;
      if (ids === "all" || ids.includes(n.id)) n.readAt = now();
    }
    persist();
  }
  async countUnreadNotifications(userId: string) {
    return this.db.notifications.filter((n) => n.userId === userId && !n.readAt).length;
  }

  async deleteAllUserData(userId: string) {
    const db = this.db;
    db.assets = db.assets.filter((x) => x.userId !== userId);
    db.images = db.images.filter((x) => x.userId !== userId);
    db.expenses = db.expenses.filter((x) => x.userId !== userId);
    db.documents = db.documents.filter((x) => x.userId !== userId);
    db.history = db.history.filter((x) => x.userId !== userId);
    db.events = db.events.filter((x) => x.userId !== userId);
    db.snapshots = db.snapshots.filter((x) => x.userId !== userId);
    db.notifications = db.notifications.filter((x) => x.userId !== userId);
    persist();
  }
}
