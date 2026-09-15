import { convert, isCurrencyCode, roundMarketPrice } from "@/lib/currency";
import type { MarketRegion } from "@/types/domain";
import type { ProviderEstimate, ValuationProvider, ValuationRequest } from "../types";

/**
 * eBay Browse API provider — integration boundary.
 *
 * Enabled when EBAY_OAUTH_TOKEN is present (an application access token from
 * the client-credentials flow). Queries item summaries for the model in the
 * user's marketplace and derives a robust median. Historical (`asOf`)
 * requests are not supported by the live API and return null, so the engine
 * falls back to the internal model for backfills.
 */
export class EbayProvider implements ValuationProvider {
  readonly id = "ebay" as const;
  readonly name = "eBay listings";
  readonly weight = 1.4;

  private readonly token = process.env.EBAY_OAUTH_TOKEN;
  private readonly endpoint = process.env.EBAY_API_URL ?? "https://api.ebay.com/buy/browse/v1/item_summary/search";

  isAvailable() {
    return Boolean(this.token);
  }

  async estimate(req: ValuationRequest): Promise<ProviderEstimate | null> {
    if (!this.isAvailable() || !req.model) return null;
    if (req.asOf && Date.now() - req.asOf.getTime() > 2 * 86_400_000) return null;

    const q = [req.manufacturer, req.model, req.variant].filter(Boolean).join(" ");
    const params = new URLSearchParams({
      q,
      limit: "50",
      filter: `conditions:{${ebayConditions(req.condition)}},buyingOptions:{FIXED_PRICE}`,
    });
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
      const res = await fetch(`${this.endpoint}?${params}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "X-EBAY-C-MARKETPLACE-ID": marketplaceId(req.region),
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      if (!res.ok) return null;
      const json = (await res.json()) as {
        itemSummaries?: { price?: { value?: string; currency?: string }; title?: string }[];
      };
      const prices: number[] = [];
      for (const item of json.itemSummaries ?? []) {
        const value = Number(item.price?.value);
        const cur = item.price?.currency;
        if (!Number.isFinite(value) || !isCurrencyCode(cur)) continue;
        prices.push(convert(value, cur, req.currency));
      }
      if (prices.length < 3) return null;
      prices.sort((a, b) => a - b);
      // Trim outliers (10% each side), use the median of the remainder.
      const trim = Math.floor(prices.length * 0.1);
      const core = prices.slice(trim, prices.length - trim);
      const median = core[Math.floor(core.length / 2)];
      const low = core[Math.floor(core.length * 0.25)];
      const high = core[Math.floor(core.length * 0.75)];
      const confidence = Math.min(0.9, 0.55 + core.length / 100);
      return {
        source: "ebay",
        estimatedValue: roundMarketPrice(median, req.currency),
        lowEstimate: roundMarketPrice(low, req.currency),
        highEstimate: roundMarketPrice(high, req.currency),
        quickSaleEstimate: roundMarketPrice(low * 0.97, req.currency),
        confidence,
        comparablesCount: core.length,
        currency: req.currency,
        notes: [`${core.length} active eBay listings in ${marketplaceId(req.region)}.`],
      };
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

function marketplaceId(region: MarketRegion): string {
  switch (region) {
    case "US":
      return "EBAY_US";
    case "UK":
      return "EBAY_GB";
    case "CH":
      return "EBAY_CH";
    case "PL":
      return "EBAY_PL";
    default:
      return "EBAY_DE";
  }
}

function ebayConditions(condition: ValuationRequest["condition"]): string {
  switch (condition) {
    case "like_new":
      return "NEW_OTHER|CERTIFIED_REFURBISHED|USED";
    case "excellent":
    case "good":
      return "USED|SELLER_REFURBISHED";
    default:
      return "USED|FOR_PARTS_OR_NOT_WORKING";
  }
}
