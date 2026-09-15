import { describe, expect, it } from "vitest";
import { computeAssetMetrics, computePortfolioTotals } from "./finance";
import type { Asset, AssetExpense } from "@/types/domain";

const base: Asset = {
  id: "a1",
  userId: "u1",
  name: "iPhone 17 Pro",
  category: "smartphone",
  manufacturer: "Apple",
  model: "iPhone 17 Pro",
  variant: "256 GB",
  description: null,
  specs: {},
  catalogId: "apple-iphone-17-pro",
  purchasePrice: 1299,
  purchaseCurrency: "EUR",
  purchaseDate: "2025-10-20",
  retailer: null,
  condition: "excellent",
  currentEstimatedValue: 930,
  currentLowEstimate: 890,
  currentHighEstimate: 970,
  quickSaleValue: 850,
  valuationConfidence: 0.91,
  valuationCurrency: "EUR",
  valuationDate: "2026-09-14",
  identificationConfidence: 0.97,
  serialNumber: null,
  imei: null,
  warrantyExpiration: null,
  notes: null,
  status: "active",
  soldPrice: null,
  soldDate: null,
  coverImageUrl: null,
  createdAt: "2025-10-20T00:00:00Z",
  updatedAt: "2025-10-20T00:00:00Z",
};

describe("computeAssetMetrics", () => {
  const now = new Date("2026-09-14T12:00:00Z");
  it("computes depreciation and daily ownership cost", () => {
    const m = computeAssetMetrics(base, [], "EUR", now);
    expect(m.daysOwned).toBe(329);
    expect(m.depreciation).toBe(-369);
    expect(m.depreciationPct).toBeCloseTo(-0.284, 3);
    expect(m.ownershipCost).toBe(369);
    expect(m.dailyCost).toBeCloseTo(1.12, 2);
  });
  it("adds expenses to the cost of ownership", () => {
    const exp: AssetExpense[] = [
      { id: "e1", assetId: "a1", userId: "u1", type: "repair", amount: 149, currency: "EUR", date: "2026-04-18", title: "Battery", notes: null, createdAt: "" },
    ];
    const m = computeAssetMetrics(base, exp, "EUR", now);
    expect(m.expensesTotal).toBe(149);
    expect(m.ownershipCost).toBe(518);
  });
  it("uses the sold price for sold assets", () => {
    const m = computeAssetMetrics({ ...base, status: "sold", soldPrice: 900, soldDate: "2026-06-01" }, [], "EUR", now);
    expect(m.depreciation).toBe(-399);
    expect(m.daysOwned).toBe(224);
  });
  it("converts to the display currency", () => {
    const m = computeAssetMetrics(base, [], "USD", now);
    expect(m.purchasePrice).toBeCloseTo(1299 * 1.09, 1);
  });
});

describe("computePortfolioTotals", () => {
  it("sums active assets only", () => {
    const now = new Date("2026-09-14T12:00:00Z");
    const a = computeAssetMetrics(base, [], "EUR", now);
    const sold = computeAssetMetrics({ ...base, id: "a2", status: "sold", soldPrice: 800, soldDate: "2026-01-01" }, [], "EUR", now);
    const t = computePortfolioTotals(
      [
        { asset: base, metrics: a },
        { asset: { ...base, id: "a2", status: "sold" }, metrics: sold },
      ],
      "EUR",
    );
    expect(t.assetCount).toBe(1);
    expect(t.currentValue).toBe(930);
    expect(t.purchaseValue).toBe(1299);
    expect(t.depreciation).toBe(-369);
  });
});
