import { describe, expect, it } from "vitest";
import { InternalPricingProvider } from "./providers/internal";
import { ValuationEngine } from "./engine";
import { ManualProvider } from "./providers/manual";
import { matchCatalog, searchCatalog } from "./catalog";
import type { ValuationRequest } from "./types";

const NOW = new Date("2026-09-15T12:00:00Z");

const iphone: ValuationRequest = {
  category: "smartphone",
  manufacturer: "Apple",
  model: "iPhone 17 Pro",
  variant: "256 GB",
  specs: { storage: "256 GB", color: "Black" },
  condition: "excellent",
  purchasePrice: 1299,
  purchaseCurrency: "EUR",
  purchaseDate: "2025-10-20",
  region: "EU",
  currency: "EUR",
  asOf: NOW,
};

describe("catalog matching", () => {
  it("matches exact model names", () => {
    const m = matchCatalog({ manufacturer: "Apple", model: "iPhone 17 Pro", category: "smartphone", specs: { storage: "512 GB" } });
    expect(m?.product.id).toBe("apple-iphone-17-pro");
    expect(m?.variant?.name).toBe("512 GB");
  });
  it("matches aliases and loose input", () => {
    expect(matchCatalog({ model: "Sony A7 IV" })?.product.id).toBe("sony-a7-iv");
    expect(matchCatalog({ model: "PS5" })?.product.id).toBe("sony-playstation-5");
    expect(matchCatalog({ model: "MacBook Air M4" })?.product.id).toBe("apple-macbook-air-13-m4");
  });
  it("rejects unrelated products", () => {
    expect(matchCatalog({ model: "Dyson V15 Detect" })).toBeNull();
  });
  it("searches", () => {
    expect(searchCatalog("iphone 16")[0].id).toContain("apple-iphone-16");
  });
});

describe("InternalPricingProvider", () => {
  const p = new InternalPricingProvider();
  it("is deterministic and realistic for a known product", async () => {
    const a = await p.estimate(iphone);
    const b = await p.estimate(iphone);
    expect(a).toEqual(b);
    expect(a!.estimatedValue).toBeGreaterThan(750);
    expect(a!.estimatedValue).toBeLessThan(1100);
    expect(a!.lowEstimate).toBeLessThan(a!.estimatedValue);
    expect(a!.highEstimate).toBeGreaterThan(a!.estimatedValue);
    expect(a!.quickSaleEstimate).toBeLessThan(a!.estimatedValue);
    expect(a!.confidence).toBeGreaterThan(0.8);
  });
  it("condition lowers the value", async () => {
    const good = await p.estimate({ ...iphone, condition: "good" });
    const poor = await p.estimate({ ...iphone, condition: "poor" });
    const base = await p.estimate(iphone);
    expect(good!.estimatedValue).toBeLessThan(base!.estimatedValue);
    expect(poor!.estimatedValue).toBeLessThan(good!.estimatedValue);
  });
  it("value declines with time", async () => {
    const later = await p.estimate({ ...iphone, asOf: new Date("2027-09-15T00:00:00Z") });
    const base = await p.estimate(iphone);
    expect(later!.estimatedValue).toBeLessThan(base!.estimatedValue);
  });
  it("falls back to purchase-price model for unknown products with low confidence", async () => {
    const r = await p.estimate({
      ...iphone,
      catalogId: null,
      manufacturer: "Dyson",
      model: "V15 Detect",
      category: "appliance",
      purchasePrice: 699,
      purchaseDate: "2024-01-10",
    });
    expect(r).not.toBeNull();
    expect(r!.confidence).toBeLessThan(0.6);
    expect(r!.estimatedValue).toBeGreaterThan(100);
    expect(r!.estimatedValue).toBeLessThan(699);
  });
  it("converts to the requested currency", async () => {
    const eur = await p.estimate(iphone);
    const usd = await p.estimate({ ...iphone, currency: "USD" });
    expect(usd!.currency).toBe("USD");
    expect(usd!.estimatedValue).toBeGreaterThan(eur!.estimatedValue);
  });
});

describe("ValuationEngine", () => {
  const engine = new ValuationEngine([new ManualProvider(), new InternalPricingProvider()]);
  it("returns a full result with trend", async () => {
    const r = await engine.value(iphone);
    expect(r).not.toBeNull();
    expect(r!.valuationDate).toBe("2026-09-15");
    expect(typeof r!.trend30d).toBe("number");
    expect(r!.sources.map((s) => s.id)).toEqual(["internal"]);
    expect(r!.matchedCatalogId).toBe("apple-iphone-17-pro");
  });
  it("blends a manual override", async () => {
    const r = await engine.value({ ...iphone, manualOverride: { value: 1000, currency: "EUR", date: "2026-09-01" } });
    expect(r!.sources.map((s) => s.id).sort()).toEqual(["internal", "manual"]);
    expect(r!.estimatedValue).toBeGreaterThan(900);
  });
});
