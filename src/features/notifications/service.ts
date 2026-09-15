import "server-only";
import { formatMoney, formatPercent } from "@/lib/format";
import { daysBetween, parseISODate, toISODate } from "@/lib/dates";
import type { DataStore } from "@/services/data/store";
import type { Asset, Notification, Profile } from "@/types/domain";
import type { ValuationResult } from "@/valuation";
import { buildRecommendation } from "@/features/insights/keep-sell";

/**
 * Notification rules. Idempotent per (type, asset, day): callers can run
 * this on every dashboard load without spamming the user.
 */
export async function generateNotifications(store: DataStore, userId: string, profile: Profile, assets: Asset[], valuations: Map<string, ValuationResult | null>, now = new Date()): Promise<Notification[]> {
  const prefs = profile.notificationPrefs;
  const recent = await store.listNotifications(userId, { limit: 200 });
  const today = toISODate(now);
  const exists = (type: Notification["type"], assetId: string | null, withinDays = 1) =>
    recent.some((n) => n.type === type && n.assetId === assetId && daysBetween(new Date(n.createdAt), now) < withinDays);
  const created: Notification[] = [];
  const cur = profile.preferredCurrency;

  for (const asset of assets) {
    if (asset.status !== "active") continue;
    const v = valuations.get(asset.id);

    if (prefs.priceChanges && v?.trend30d != null && Math.abs(v.trend30d) >= 0.05 && !exists(v.trend30d < 0 ? "value_dropped" : "value_increased", asset.id, 30)) {
      const dropped = v.trend30d < 0;
      created.push(
        await store.addNotification(userId, {
          type: dropped ? "value_dropped" : "value_increased",
          title: `${asset.name} ${dropped ? "lost" : "gained"} ${formatPercent(Math.abs(v.trend30d))} in 30 days`,
          body: `Estimated value is now ${formatMoney(v.estimatedValue, cur)} (${formatMoney(v.lowEstimate, cur)} – ${formatMoney(v.highEstimate, cur)}).`,
          assetId: asset.id,
          href: `/app/assets/${asset.id}`,
        }),
      );
    }

    if (prefs.sellOpportunities && v && !exists("good_time_to_sell", asset.id, 30)) {
      const rec = buildRecommendation({ asset, valuation: v, displayCurrency: cur, now });
      if (rec.verdict === "strong_sell") {
        created.push(
          await store.addNotification(userId, {
            type: "good_time_to_sell",
            title: `Consider selling ${asset.name}`,
            body: rec.summary,
            assetId: asset.id,
            href: `/app/assets/${asset.id}#insights`,
          }),
        );
      }
    }

    if (prefs.warrantyAlerts && asset.warrantyExpiration) {
      const left = daysBetween(now, parseISODate(asset.warrantyExpiration));
      if (left >= 0 && left <= 30 && !exists("warranty_expiring", asset.id, 30)) {
        created.push(
          await store.addNotification(userId, {
            type: "warranty_expiring",
            title: `Warranty on ${asset.name} ends in ${left} day${left === 1 ? "" : "s"}`,
            body: "Check the device now — repairs after the warranty date are on you.",
            assetId: asset.id,
            href: `/app/assets/${asset.id}`,
          }),
        );
      }
    }
  }

  // Monthly report on the first days of a month.
  if (prefs.monthlyReport && assets.length && now.getUTCDate() <= 3 && !exists("monthly_report", null, 28)) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const label = d.toLocaleString("en-GB", { month: "long", timeZone: "UTC" });
    created.push(
      await store.addNotification(userId, {
        type: "monthly_report",
        title: `Your ${label} report is ready`,
        body: "See how your portfolio moved, the biggest loss and the best performer.",
        assetId: null,
        href: `/app/insights?month=${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      }),
    );
  }
  void today;
  return created;
}
