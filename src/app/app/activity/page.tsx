import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";

export const metadata: Metadata = { title: "Activity" };
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const user = await requireUser();
  const store = await getStore();
  const [events, assets] = await Promise.all([store.listEvents(user.id, { limit: 120 }), store.listAssets(user.id, { status: "all" })]);
  const names = new Map(assets.map((a) => [a.id, a.name]));

  const groups = new Map<string, typeof events>();
  for (const e of events) {
    const key = e.date.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <>
      <PageHeader index="006" title="Activity" description="Everything that happened across your portfolio." />
      {events.length ? (
        [...groups.entries()].map(([month, list]) => (
          <section key={month} className="mb-6">
            <h2 className="label-mono mb-2 text-gray">{formatDate(`${month}-01`, { day: undefined, month: "long", year: "numeric" })}</h2>
            <Panel>
              {list.map((e) => (
                <Link key={e.id} href={`/app/assets/${e.assetId}`} className="flex items-center gap-4 border-b border-hair px-5 py-3.5 last:border-b-0 hover:bg-black/[0.03]">
                  <span className={cn("h-2 w-2 shrink-0", e.type === "valuation" ? "bg-orange" : e.type === "sold" ? "bg-orange-3" : "bg-ink")} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {names.get(e.assetId) ?? "Asset"} <span className="font-medium text-gray">· {e.title}</span>
                    </p>
                    <p className="label-mono text-gray-2">
                      {formatDate(e.date)}
                      {e.description ? ` · ${e.description}` : ""}
                    </p>
                  </div>
                  {e.amount != null && e.currency ? <span className="tnum text-sm font-bold">{formatMoney(e.amount, e.currency)}</span> : null}
                </Link>
              ))}
            </Panel>
          </section>
        ))
      ) : (
        <EmptyState title="No activity yet." description="Purchases, valuations, expenses and sales will show up here as a single feed." />
      )}
    </>
  );
}
