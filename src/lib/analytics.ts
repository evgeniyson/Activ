/**
 * Product analytics boundary. Events are typed; the sink is pluggable.
 * No invasive tracking: we log product events only, never PII payloads.
 */
export type AnalyticsEvent =
  | "signup_completed"
  | "onboarding_completed"
  | "asset_scan_started"
  | "asset_identified"
  | "asset_created"
  | "valuation_viewed"
  | "portfolio_viewed"
  | "asset_sold"
  | "upgrade_calculated"
  | "sell_recommendation_viewed";

export interface AnalyticsSink {
  track(event: AnalyticsEvent, props?: Record<string, string | number | boolean | null>): void;
}

class ConsoleSink implements AnalyticsSink {
  track(event: AnalyticsEvent, props?: Record<string, string | number | boolean | null>) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[analytics] ${event}`, props ?? {});
    }
  }
}

class NoopSink implements AnalyticsSink {
  track() {}
}

let sink: AnalyticsSink = process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1" ? new ConsoleSink() : new NoopSink();

export function setAnalyticsSink(s: AnalyticsSink) {
  sink = s;
}

export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean | null>) {
  try {
    sink.track(event, props);
  } catch {
    // analytics must never break the product
  }
}
