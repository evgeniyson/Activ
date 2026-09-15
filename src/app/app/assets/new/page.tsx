import type { Metadata } from "next";
import { AddAssetFlow, type AddMethod } from "@/components/add-asset/add-asset-flow";
import { ensureProfile } from "@/features/profile/service";
import { hasAnthropicKey } from "@/lib/env";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";

export const metadata: Metadata = { title: "Add Asset" };
export const dynamic = "force-dynamic";

const METHODS: AddMethod[] = ["camera", "upload", "manual", "barcode"];

export default async function NewAssetPage({ searchParams }: { searchParams: Promise<{ method?: string }> }) {
  const { method } = await searchParams;
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  const initial = METHODS.includes(method as AddMethod) ? (method as AddMethod) : null;
  return <AddAssetFlow initialMethod={initial} currency={profile.preferredCurrency} aiEnabled={hasAnthropicKey()} />;
}
