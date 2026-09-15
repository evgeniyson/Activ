import { fnv1a } from "@/lib/hash";
import { CATALOG } from "@/valuation/catalog";
import { finalizeIdentification, variantQuestion } from "./claude";
import type { IdentificationProvider, IdentificationResult } from "./types";

/**
 * Deterministic stand-in used when no vision model is configured. It picks
 * a plausible product from the catalog based on the image bytes, so the
 * same photo always yields the same answer, and always asks for the
 * variant — mirroring the real provider's behaviour of never guessing
 * invisible specs.
 */
export class MockIdentificationProvider implements IdentificationProvider {
  readonly id = "mock" as const;

  isAvailable() {
    return true;
  }

  async identify(input: { image: Buffer; mimeType: string; hint?: string }): Promise<IdentificationResult> {
    await new Promise((r) => setTimeout(r, 900));
    const pool = CATALOG.filter((p) => ["smartphone", "laptop", "headphones", "camera", "gaming_console", "smartwatch", "tablet"].includes(p.category));
    const hinted = input.hint ? pool.find((p) => `${p.manufacturer} ${p.model}`.toLowerCase().includes(input.hint!.toLowerCase())) : null;
    const product = hinted ?? pool[fnv1a(input.image.subarray(0, 4096).toString("base64")) % pool.length];
    const specs = Object.entries(product.specs ?? {}).map(([key, value]) => ({ key, value }));
    const clarifications = product.variants?.length
      ? [{ key: "variant", question: variantQuestion(product.category), options: [...product.variants.map((v) => v.name), "Не уверен"] }]
      : [];
    const alt = pool.filter((p) => p.category === product.category && p.manufacturer === product.manufacturer && p.id !== product.id).slice(0, 2);
    return finalizeIdentification(
      {
        recognized: true,
        imageQuality: "good",
        category: product.category,
        manufacturer: product.manufacturer,
        model: product.model,
        variant: null,
        specs,
        color: null,
        confidence: 0.86,
        clarifications,
        alternatives: alt.map((p) => ({ manufacturer: p.manufacturer, model: p.model })),
        notes: "Демо-распознавание — подключите AI-ключ для реального распознавания.",
      },
      "mock",
    );
  }
}
