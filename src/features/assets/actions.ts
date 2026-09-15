"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { track } from "@/lib/analytics";
import { toISODate } from "@/lib/dates";
import { convert } from "@/lib/currency";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { getFileStorage } from "@/services/storage";
import { ensureProfile } from "@/features/profile/service";
import type { Asset, AssetCategory, Condition, CurrencyCode } from "@/types/domain";
import { CONDITION_LABELS } from "@/types/domain";
import { createAssetSchema, expenseSchema, manualValueSchema, markSoldSchema, updateAssetSchema } from "./schemas";
import { createAssetWithValuation, revalueAsset } from "./service";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string; field?: string };

function fail(err: z.ZodError): ActionResult<never> {
  const issue = err.issues[0];
  return { ok: false, error: issue?.message ?? "Invalid input.", field: issue?.path.join(".") };
}

function revalidateAll(assetId?: string) {
  revalidatePath("/app");
  revalidatePath("/app/assets");
  revalidatePath("/app/insights");
  revalidatePath("/app/activity");
  if (assetId) revalidatePath(`/app/assets/${assetId}`);
}

export interface CreatedAssetSummary {
  id: string;
  name: string;
  purchasePrice: number;
  currentValue: number | null;
  lowEstimate: number | null;
  highEstimate: number | null;
  depreciation: number | null;
  dailyCost: number | null;
  daysOwned: number;
  confidence: number | null;
  currency: CurrencyCode;
}

export async function createAssetAction(raw: unknown): Promise<ActionResult<CreatedAssetSummary>> {
  const user = await requireUser();
  const parsed = createAssetSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  const input = parsed.data;
  const store = await getStore();
  const profile = await ensureProfile(store, user);

  const { asset, valuation } = await createAssetWithValuation(store, user.id, profile, {
    name: input.name,
    category: input.category as AssetCategory,
    manufacturer: input.manufacturer ?? null,
    model: input.model ?? null,
    variant: input.variant ?? null,
    description: input.description ?? null,
    specs: input.specs,
    catalogId: input.catalogId ?? null,
    purchasePrice: input.purchasePrice,
    purchaseCurrency: input.purchaseCurrency as CurrencyCode,
    purchaseDate: input.purchaseDate,
    retailer: input.retailer ?? null,
    condition: input.condition as Condition,
    identificationConfidence: input.identificationConfidence ?? null,
    serialNumber: input.serialNumber ?? null,
    imei: input.imei ?? null,
    warrantyExpiration: input.warrantyExpiration ?? null,
    notes: input.notes ?? null,
    coverImageUrl: input.scanImage?.url ?? null,
  });

  if (input.scanImage) {
    // Ownership check: the stored path must belong to this user.
    if (input.scanImage.storagePath.startsWith(`${user.id}/`)) {
      await store.addImage(user.id, { assetId: asset.id, url: input.scanImage.url, storagePath: input.scanImage.storagePath, width: input.scanImage.width, height: input.scanImage.height, isCover: true });
    }
  }
  track("asset_created", { category: asset.category, hasValuation: Boolean(valuation) });
  revalidateAll(asset.id);

  const cur = profile.preferredCurrency;
  const purchase = convert(asset.purchasePrice, asset.purchaseCurrency, cur);
  const value = asset.currentEstimatedValue == null ? null : convert(asset.currentEstimatedValue, asset.valuationCurrency, cur);
  const days = Math.max(1, Math.floor((Date.now() - new Date(`${asset.purchaseDate}T00:00:00Z`).getTime()) / 86_400_000));
  return {
    ok: true,
    data: {
      id: asset.id,
      name: asset.name,
      purchasePrice: purchase,
      currentValue: value,
      lowEstimate: asset.currentLowEstimate == null ? null : convert(asset.currentLowEstimate, asset.valuationCurrency, cur),
      highEstimate: asset.currentHighEstimate == null ? null : convert(asset.currentHighEstimate, asset.valuationCurrency, cur),
      depreciation: value == null ? null : value - purchase,
      dailyCost: value == null ? null : (purchase - value) / days,
      daysOwned: days,
      confidence: asset.valuationConfidence,
      currency: cur,
    },
  };
}

export async function updateAssetAction(id: string, raw: unknown): Promise<ActionResult<Asset>> {
  const user = await requireUser();
  const parsed = updateAssetSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  const store = await getStore();
  const existing = await store.getAsset(user.id, id);
  if (!existing) return { ok: false, error: "Asset not found." };
  const patch = parsed.data;
  const updated = await store.updateAsset(user.id, id, {
    ...(patch as Partial<Asset>),
    specs: patch.specs ?? existing.specs,
  });
  if (!updated) return { ok: false, error: "Asset not found." };

  if (patch.condition && patch.condition !== existing.condition) {
    await store.addEvent(user.id, { assetId: id, type: "condition_changed", date: toISODate(new Date()), title: `Condition changed to ${CONDITION_LABELS[patch.condition as Condition]}`, description: null, amount: null, currency: null, meta: null });
  } else {
    await store.addEvent(user.id, { assetId: id, type: "edited", date: toISODate(new Date()), title: "Details updated", description: null, amount: null, currency: null, meta: null });
  }
  if (patch.warrantyExpiration && patch.warrantyExpiration !== existing.warrantyExpiration) {
    await store.addEvent(user.id, { assetId: id, type: "warranty_added", date: toISODate(new Date()), title: "Warranty updated", description: `Valid until ${patch.warrantyExpiration}`, amount: null, currency: null, meta: null });
  }
  // Re-run valuation if anything price-relevant changed.
  const relevant = ["condition", "model", "manufacturer", "variant", "category", "specs", "catalogId", "purchasePrice", "purchaseDate"] as const;
  if (relevant.some((k) => patch[k] !== undefined)) {
    const profile = await ensureProfile(store, user);
    await revalueAsset(store, user.id, updated, profile, { force: true });
  }
  revalidateAll(id);
  return { ok: true, data: updated };
}

export async function deleteAssetAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const store = await getStore();
  const images = await store.listImages(user.id, id);
  const ok = await store.deleteAsset(user.id, id);
  if (!ok) return { ok: false, error: "Asset not found." };
  const storage = getFileStorage();
  for (const img of images) if (img.storagePath) await storage.remove(img.storagePath).catch(() => {});
  revalidateAll();
  redirect("/app/assets");
}

export async function addExpenseAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  const d = parsed.data;
  const store = await getStore();
  const asset = await store.getAsset(user.id, d.assetId);
  if (!asset) return { ok: false, error: "Asset not found." };
  await store.addExpense(user.id, { assetId: d.assetId, type: d.type, amount: d.amount, currency: d.currency as CurrencyCode, date: d.date, title: d.title, notes: d.notes ?? null });
  await store.addEvent(user.id, { assetId: d.assetId, type: "expense", date: d.date, title: d.title, description: d.type.charAt(0).toUpperCase() + d.type.slice(1), amount: d.amount, currency: d.currency as CurrencyCode, meta: null });
  revalidateAll(d.assetId);
  return { ok: true, data: undefined };
}

export async function deleteExpenseAction(assetId: string, expenseId: string): Promise<ActionResult> {
  const user = await requireUser();
  const store = await getStore();
  const ok = await store.deleteExpense(user.id, expenseId);
  if (!ok) return { ok: false, error: "Expense not found." };
  revalidateAll(assetId);
  return { ok: true, data: undefined };
}

export async function setManualValueAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = manualValueSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  const d = parsed.data;
  const store = await getStore();
  const asset = await store.getAsset(user.id, d.assetId);
  if (!asset) return { ok: false, error: "Asset not found." };
  const profile = await ensureProfile(store, user);
  const cur = profile.preferredCurrency;
  const value = convert(d.value, d.currency as CurrencyCode, cur);
  const today = toISODate(new Date());
  await store.updateAsset(user.id, asset.id, {
    currentEstimatedValue: Math.round(value),
    currentLowEstimate: Math.round(value * 0.95),
    currentHighEstimate: Math.round(value * 1.05),
    quickSaleValue: Math.round(value * 0.9),
    valuationConfidence: 0.75,
    valuationCurrency: cur,
    valuationDate: today,
  });
  await store.addValueHistory(user.id, [{ assetId: asset.id, date: today, estimatedValue: Math.round(value), lowEstimate: Math.round(value * 0.95), highEstimate: Math.round(value * 1.05), quickSaleEstimate: Math.round(value * 0.9), currency: cur, source: "manual", confidence: 0.75, comparablesCount: 1 }]);
  await store.addEvent(user.id, { assetId: asset.id, type: "valuation", date: today, title: "Value set manually", description: null, amount: Math.round(value), currency: cur, meta: null });
  revalidateAll(asset.id);
  return { ok: true, data: undefined };
}

export async function refreshValuationAction(assetId: string): Promise<ActionResult> {
  const user = await requireUser();
  const store = await getStore();
  const asset = await store.getAsset(user.id, assetId);
  if (!asset) return { ok: false, error: "Asset not found." };
  const profile = await ensureProfile(store, user);
  const { result } = await revalueAsset(store, user.id, asset, profile, { force: true });
  if (!result) return { ok: false, error: "No market data available for this item right now." };
  track("valuation_viewed", { assetId });
  revalidateAll(assetId);
  return { ok: true, data: undefined };
}

export async function markSoldAction(raw: unknown): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = markSoldSchema.safeParse(raw);
  if (!parsed.success) return fail(parsed.error);
  const d = parsed.data;
  const store = await getStore();
  const asset = await store.getAsset(user.id, d.assetId);
  if (!asset) return { ok: false, error: "Asset not found." };
  await store.updateAsset(user.id, asset.id, { status: "sold", soldPrice: d.soldPrice, soldDate: d.soldDate });
  await store.addEvent(user.id, { assetId: asset.id, type: "sold", date: d.soldDate, title: "Sold", description: null, amount: d.soldPrice, currency: asset.purchaseCurrency, meta: null });
  track("asset_sold", { category: asset.category });
  revalidateAll(asset.id);
  return { ok: true, data: undefined };
}

export async function restoreAssetAction(assetId: string): Promise<ActionResult> {
  const user = await requireUser();
  const store = await getStore();
  const asset = await store.getAsset(user.id, assetId);
  if (!asset) return { ok: false, error: "Asset not found." };
  await store.updateAsset(user.id, asset.id, { status: "active", soldPrice: null, soldDate: null });
  revalidateAll(assetId);
  return { ok: true, data: undefined };
}
