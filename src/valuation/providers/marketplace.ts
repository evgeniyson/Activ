import { isCurrencyCode, convert, roundMarketPrice } from "@/lib/currency";
import type { ProviderEstimate, ValuationProvider, ValuationRequest } from "../types";

/**
 * Generic marketplace provider — integration boundary for a partner pricing
 * API (Авито, Back Market, a data vendor…). Expects an endpoint that
 * accepts a JSON POST with the request shape below and answers with
 * `{ median, p25, p75, count, currency }`. Enabled by MARKETPLACE_API_URL.
 */
export class MarketplaceProvider implements ValuationProvider {
  readonly id = "marketplace" as const;
  readonly name = "Данные маркетплейсов";
  readonly weight = 1.2;

  private readonly url = process.env.MARKETPLACE_API_URL;
  private readonly key = process.env.MARKETPLACE_API_KEY;

  isAvailable() {
    return Boolean(this.url);
  }

  async estimate(req: ValuationRequest): Promise<ProviderEstimate | null> {
    if (!this.url || !req.model) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(this.key ? { Authorization: `Bearer ${this.key}` } : {}) },
        body: JSON.stringify({
          category: req.category,
          manufacturer: req.manufacturer,
          model: req.model,
          variant: req.variant,
          specs: req.specs,
          condition: req.condition,
          region: req.region,
          currency: req.currency,
          asOf: req.asOf?.toISOString() ?? null,
        }),
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const j = (await res.json()) as { median?: number; p25?: number; p75?: number; count?: number; currency?: string };
      if (!j.median || !isCurrencyCode(j.currency)) return null;
      const to = (v: number) => roundMarketPrice(convert(v, j.currency as never, req.currency), req.currency);
      const count = j.count ?? 0;
      return {
        source: "marketplace",
        estimatedValue: to(j.median),
        lowEstimate: to(j.p25 ?? j.median * 0.92),
        highEstimate: to(j.p75 ?? j.median * 1.08),
        quickSaleEstimate: to((j.p25 ?? j.median * 0.92) * 0.97),
        confidence: Math.min(0.9, 0.5 + count / 80),
        comparablesCount: count,
        currency: req.currency,
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
