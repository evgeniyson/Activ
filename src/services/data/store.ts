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

/**
 * Data access boundary. Every call is scoped by `userId`; implementations
 * MUST enforce ownership (Supabase does so via RLS, the local store filters
 * explicitly). Callers never pass ids of other users' rows through.
 */
export type NewAsset = Omit<Asset, "id" | "userId" | "createdAt" | "updatedAt">;
export type AssetPatch = Partial<Omit<Asset, "id" | "userId" | "createdAt" | "updatedAt">>;
export type NewImage = Omit<AssetImage, "id" | "userId" | "createdAt">;
export type NewExpense = Omit<AssetExpense, "id" | "userId" | "createdAt">;
export type NewDocument = Omit<AssetDocument, "id" | "userId" | "createdAt">;
export type NewValueHistory = Omit<AssetValueHistory, "id" | "userId" | "createdAt">;
export type NewEvent = Omit<AssetEvent, "id" | "userId" | "createdAt">;
export type NewSnapshot = Omit<PortfolioSnapshot, "id" | "userId" | "createdAt">;
export type NewNotification = Omit<Notification, "id" | "userId" | "createdAt" | "readAt">;
export type ProfilePatch = Partial<Omit<Profile, "id" | "createdAt" | "updatedAt">>;

export interface DataStore {
  // Profiles
  getProfile(userId: string): Promise<Profile | null>;
  upsertProfile(userId: string, patch: ProfilePatch & { email?: string | null }): Promise<Profile>;

  // Assets
  listAssets(userId: string, opts?: { status?: Asset["status"] | "all" }): Promise<Asset[]>;
  getAsset(userId: string, id: string): Promise<Asset | null>;
  createAsset(userId: string, data: NewAsset): Promise<Asset>;
  updateAsset(userId: string, id: string, patch: AssetPatch): Promise<Asset | null>;
  deleteAsset(userId: string, id: string): Promise<boolean>;

  // Images
  listImages(userId: string, assetId: string): Promise<AssetImage[]>;
  addImage(userId: string, data: NewImage): Promise<AssetImage>;
  deleteImage(userId: string, id: string): Promise<boolean>;

  // Expenses
  listExpenses(userId: string, assetId?: string): Promise<AssetExpense[]>;
  addExpense(userId: string, data: NewExpense): Promise<AssetExpense>;
  deleteExpense(userId: string, id: string): Promise<boolean>;

  // Documents
  listDocuments(userId: string, assetId: string): Promise<AssetDocument[]>;
  addDocument(userId: string, data: NewDocument): Promise<AssetDocument>;
  deleteDocument(userId: string, id: string): Promise<boolean>;

  // Value history (append-only)
  listValueHistory(userId: string, assetId?: string): Promise<AssetValueHistory[]>;
  addValueHistory(userId: string, entries: NewValueHistory[]): Promise<AssetValueHistory[]>;

  // Events
  listEvents(userId: string, opts?: { assetId?: string; limit?: number }): Promise<AssetEvent[]>;
  addEvent(userId: string, data: NewEvent): Promise<AssetEvent>;

  // Portfolio snapshots
  listSnapshots(userId: string, opts?: { from?: string; to?: string }): Promise<PortfolioSnapshot[]>;
  upsertSnapshots(userId: string, snapshots: NewSnapshot[]): Promise<void>;

  // Notifications
  listNotifications(userId: string, opts?: { unreadOnly?: boolean; limit?: number }): Promise<Notification[]>;
  addNotification(userId: string, data: NewNotification): Promise<Notification>;
  markNotificationsRead(userId: string, ids: string[] | "all"): Promise<void>;
  countUnreadNotifications(userId: string): Promise<number>;

  // Danger zone
  deleteAllUserData(userId: string): Promise<void>;
}
