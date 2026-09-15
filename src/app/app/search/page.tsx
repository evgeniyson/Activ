import type { Metadata } from "next";
import { AssetsList } from "@/components/assets/assets-list";
import { PageHeader } from "@/components/shell/page-header";
import { getPortfolioOverview } from "@/features/portfolio/service";
import { ensureProfile } from "@/features/profile/service";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";

export const metadata: Metadata = { title: "Поиск" };
export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  const overview = await getPortfolioOverview(store, user.id, profile);
  return (
    <>
      <PageHeader index="Q" title="Поиск" description="Модель, производитель, категория, заметки или серийный номер." />
      <AssetsList items={overview.items} currency={overview.currency} initialQuery={q ?? ""} />
    </>
  );
}
