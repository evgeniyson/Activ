import "server-only";
import { findByBarcode } from "@/valuation/catalog";
import { ClaudeVisionProvider, finalizeIdentification, variantQuestion } from "./claude";
import { MockIdentificationProvider } from "./mock";
import type { IdentificationProvider, IdentificationResult } from "./types";

let provider: IdentificationProvider | null = null;

export function getIdentificationProvider(): IdentificationProvider {
  if (!provider) {
    const claude = new ClaudeVisionProvider();
    provider = claude.isAvailable() ? claude : new MockIdentificationProvider();
  }
  return provider;
}

/** Barcode → catalog lookup (integration boundary for a UPC/EAN API). */
export function identifyByBarcode(code: string): IdentificationResult | null {
  const p = findByBarcode(code);
  if (!p) return null;
  return finalizeIdentification(
    {
      recognized: true,
      imageQuality: "good",
      category: p.category,
      manufacturer: p.manufacturer,
      model: p.model,
      variant: null,
      specs: Object.entries(p.specs ?? {}).map(([key, value]) => ({ key, value })),
      color: null,
      confidence: 0.98,
      clarifications: p.variants?.length ? [{ key: "variant", question: variantQuestion(p.category), options: [...p.variants.map((v) => v.name), "Не уверен"] }] : [],
      alternatives: [],
      notes: "Найдено по штрих-коду.",
    },
    "barcode",
  );
}

export * from "./types";
