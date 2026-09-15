import { convert, roundMarketPrice } from "@/lib/currency";
import type { ProviderEstimate, ValuationProvider, ValuationRequest } from "../types";

/**
 * User-supplied value. Only participates when the request carries a manual
 * override; then it dominates the blend (weight 3) because the user knows
 * something the market data does not (a recent offer, an appraisal…).
 */
export class ManualProvider implements ValuationProvider {
  readonly id = "manual" as const;
  readonly name = "Manual value";
  readonly weight = 3;

  isAvailable() {
    return true;
  }

  async estimate(req: ValuationRequest): Promise<ProviderEstimate | null> {
    const o = req.manualOverride;
    if (!o || !(o.value > 0)) return null;
    const v = convert(o.value, o.currency, req.currency);
    return {
      source: "manual",
      estimatedValue: roundMarketPrice(v, req.currency),
      lowEstimate: roundMarketPrice(v * 0.95, req.currency),
      highEstimate: roundMarketPrice(v * 1.05, req.currency),
      quickSaleEstimate: roundMarketPrice(v * 0.9, req.currency),
      confidence: 0.75,
      comparablesCount: 1,
      currency: req.currency,
      notes: [`Manual value set on ${o.date}.`],
    };
  }
}
