import type { Metadata } from "next";
import { AssetsList } from "@/components/assets/assets-list";
import { PageHeader } from "@/components/shell/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Plus } from "@/components/ui/icons";
import { getPortfolioOverview } from "@/features/portfolio/service";
import { ensureProfile } from "@/features/profile/service";
import { formatMoney, plural } from "@/lib/format";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { SoldAssets } from "@/components/assets/sold-assets";
import { computeAssetMetrics } from "@/lib/finance";

export const metadata: Metadata = { title: "Активы" };
export const dynamic = "force-dynamic";

export default async function AssetsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  const overview = await getPortfolioOverview(store, user.id, profile);
  const sold = (await store.listAssets(user.id, { status: "sold" })).map((asset) => ({ asset, metrics: computeAssetMetrics(asset, [], profile.preferredCurrency) }));

  return (
    <>
      <PageHeader
        index="002"
        title="Активы"
        description={`${plural(overview.totals.assetCount, ["активный", "активных", "активных"])} · оценка ${formatMoney(overview.totals.currentValue, overview.currency)}`}
        action={
          <ButtonLink href="/app/assets/new" variant="accent">
            <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> Добавить актив
          </ButtonLink>
        }
      />
      <AssetsList items={overview.items} currency={overview.currency} initialQuery={q ?? ""} />
      {sold.length ? <SoldAssets items={sold} currency={overview.currency} /> : null}
    </>
  );
}
