import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { markNotificationsReadAction } from "@/features/notifications/actions";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/dates";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import type { NotificationType } from "@/types/domain";
import { MarkReadOnView } from "@/components/notifications/mark-read-on-view";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<NotificationType, string> = {
  price_changed: "Price",
  value_dropped: "Value dropped",
  value_increased: "Value up",
  good_time_to_sell: "Sell signal",
  warranty_expiring: "Warranty",
  monthly_report: "Report",
  system: "System",
};

export default async function NotificationsPage() {
  const user = await requireUser();
  const store = await getStore();
  const list = await store.listNotifications(user.id, { limit: 100 });
  const unread = list.filter((n) => !n.readAt).map((n) => n.id);

  return (
    <>
      <PageHeader
        index="005"
        title="Notifications"
        description="Price moves, sell signals, warranty alerts and monthly reports."
        action={
          unread.length ? (
            <form action={markNotificationsReadAction.bind(null, "all")}>
              <Button type="submit" variant="outline" size="sm">
                Mark all read
              </Button>
            </form>
          ) : null
        }
      />
      {unread.length ? <MarkReadOnView ids={unread} /> : null}
      {list.length ? (
        <Panel>
          <ul>
            {list.map((n) => {
              const inner = (
                <>
                  <span className={cn("mt-1.5 h-2 w-2 shrink-0", n.readAt ? "bg-hair" : "bg-orange")} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="label-mono text-gray-2">{TYPE_LABEL[n.type]}</span>
                      <span className="label-mono text-gray-2">{relativeTime(n.createdAt)}</span>
                    </div>
                    <p className={cn("mt-0.5 text-[15px] leading-snug", n.readAt ? "font-semibold" : "font-bold")}>{n.title}</p>
                    <p className="mt-0.5 text-[13px] text-gray">{n.body}</p>
                  </div>
                </>
              );
              return (
                <li key={n.id} className="border-b border-hair last:border-b-0">
                  {n.href ? (
                    <Link href={n.href} className="flex gap-3 px-5 py-4 hover:bg-black/[0.03]">
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex gap-3 px-5 py-4">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : (
        <EmptyState title="All quiet." description="You'll hear from us when a value moves noticeably, a warranty is about to end, or it looks like a good time to sell." />
      )}
    </>
  );
}
