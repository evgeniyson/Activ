import { convert, roundMarketPrice } from "@/lib/currency";
import { unitHash } from "@/lib/hash";
import type { ProviderEstimate, ValuationProvider, ValuationRequest } from "../types";

/**
 * Deterministic stub used in tests and as a stand-in for a not-yet-connected
 * marketplace. Never enabled in the default engine.
 */
export class MockProvider implements ValuationProvider {
  readonly id = "mock" as const;
  readonly name = "Тестовый провайдер";
  readonly weight = 0.5;

  constructor(private readonly retention = 0.7) {}

  isAvailable() {
    return true;
  }

  async estimate(req: ValuationRequest): Promise<ProviderEstimate | null> {
    const base = convert(req.purchasePrice, req.purchaseCurrency, req.currency) * this.retention;
    const wobble = 1 + (unitHash(`${req.model}`) - 0.5) * 0.1;
    const v = base * wobble;
    return {
      source: "mock",
      estimatedValue: roundMarketPrice(v, req.currency),
      lowEstimate: roundMarketPrice(v * 0.9, req.currency),
      highEstimate: roundMarketPrice(v * 1.1, req.currency),
      quickSaleEstimate: roundMarketPrice(v * 0.85, req.currency),
      confidence: 0.4,
      comparablesCount: 5,
      currency: req.currency,
    };
  }
}
