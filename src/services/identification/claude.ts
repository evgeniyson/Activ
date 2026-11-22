import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { CATALOG, matchCatalog, pickVariant } from "@/valuation/catalog";
import { CATEGORIES, CATEGORY_IDS, isAssetCategory } from "@/types/categories";
import { IdentificationError, IdentificationSchema, type IdentificationProvider, type IdentificationResult } from "./types";

const MODEL = process.env.ANTHROPIC_VISION_MODEL ?? "claude-opus-5-5";

const SYSTEM = `You identify consumer products from a single photo for a personal asset tracker.

Rules:
- Identify the manufacturer and exact model when you can see enough evidence (shape, ports, buttons, camera layout, logos, labels).
- NEVER invent details you cannot see. Storage capacity, exact chip generation, RAM, cellular vs Wi-Fi are usually not visible: put them in "clarifications" as questions with concrete options instead of guessing.
- If several models look identical from the photo (e.g. iPhone 16 Pro vs 17 Pro, MacBook Air M3 vs M4), pick the most likely one, lower the confidence, list the others in "alternatives", and add a "model" clarification with those options plus "Not sure".
- Use canonical model names. Known products in our catalog (prefer these exact spellings when they match):
${CATALOG.map((p) => `  - ${p.manufacturer} ${p.model}${p.variants ? ` [${p.variants.map((v) => v.name).join(" | ")}]` : ""}`).join("\n")}
- Category must be one of: ${CATEGORY_IDS.join(", ")}. Typical spec keys per category: ${Object.values(CATEGORIES)
  .filter((c) => c.mvp)
  .map((c) => `${c.id}: ${c.specKeys.join(", ")}`)
  .join("; ")}.
- If the image has no identifiable product, set recognized=false and explain in notes.
- The user speaks Russian: write "notes" and every clarification "question" in Russian; keep option values as canonical product spellings (e.g. "256 GB", "Not sure" → "Не уверен").
- Keep notes to one short sentence.`;

export class ClaudeVisionProvider implements IdentificationProvider {
  readonly id = "claude" as const;
  private client: Anthropic | null = null;

  isAvailable() {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  private getClient() {
    if (!this.client) this.client = new Anthropic({ timeout: 45_000, maxRetries: 1 });
    return this.client;
  }

  async identify(input: { image: Buffer; mimeType: string; hint?: string }): Promise<IdentificationResult> {
    if (!this.isAvailable()) throw new IdentificationError("AI-распознавание не настроено.", "unavailable");
    const mediaType = normalizeMime(input.mimeType);
    let response;
    try {
      response = await this.getClient().messages.parse({
        model: MODEL,
        max_tokens: 4000,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        output_config: { format: zodOutputFormat(IdentificationSchema), effort: "medium" },
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: input.image.toString("base64") } },
              { type: "text", text: input.hint ? `Identify this item. User hint: ${input.hint}` : "Identify this item. Answer notes/questions in Russian." },
            ],
          },
        ],
      });
    } catch (err) {
      if (err instanceof Anthropic.APIConnectionTimeoutError) throw new IdentificationError("AI отвечает слишком долго. Попробуйте ещё раз или добавьте вручную.", "timeout");
      if (err instanceof Anthropic.RateLimitError) throw new IdentificationError("AI-распознавание сейчас перегружено. Попробуйте через минуту.", "provider_error");
      if (err instanceof Anthropic.APIError) throw new IdentificationError(`Ошибка AI-распознавания (${err.status ?? "error"}).`, "provider_error");
      throw new IdentificationError("Ошибка AI-распознавания.", "provider_error");
    }
    if (response.stop_reason === "refusal") throw new IdentificationError("AI отказался анализировать это изображение.", "refused");
    const parsed = response.parsed_output;
    if (!parsed) throw new IdentificationError("AI вернул нечитаемый ответ.", "invalid_output");
    return finalizeIdentification(parsed, "claude");
  }
}

export function finalizeIdentification(parsed: import("./types").IdentificationOutput, provider: IdentificationResult["provider"]): IdentificationResult {
  const specs: Record<string, string> = {};
  for (const s of parsed.specs) if (s.key && s.value) specs[s.key.toLowerCase().replace(/\s+/g, "_")] = s.value;
  if (parsed.color && !specs.color) specs.color = parsed.color;
  const category = isAssetCategory(parsed.category) ? parsed.category : "other";
  const match = parsed.model ? matchCatalog({ manufacturer: parsed.manufacturer, model: parsed.model, variant: parsed.variant, category, specs }) : null;
  let clarifications = parsed.clarifications;
  // If the catalog knows variants and the model didn't ask, ask for the variant.
  if (match?.product.variants?.length && !match.variant && !clarifications.some((c) => c.key === "variant" || c.key === "storage")) {
    clarifications = [
      { key: "variant", question: variantQuestion(match.product.category), options: [...match.product.variants.map((v) => v.name), "Не уверен"] },
      ...clarifications,
    ];
  }
  const manufacturer = match?.product.manufacturer ?? parsed.manufacturer;
  const model = match && match.score >= 0.85 ? match.product.model : parsed.model;
  const name = [manufacturer, model].filter(Boolean).join(" ") || "Неизвестный предмет";
  return {
    ...parsed,
    category,
    manufacturer,
    model,
    variant: match?.variant?.name ?? parsed.variant,
    specs: { ...(match?.product.specs ?? {}), ...(match?.variant?.specs ?? {}), ...specs },
    clarifications,
    name,
    catalogId: match?.product.id ?? null,
    provider,
  };
}

export function variantQuestion(category: string): string {
  switch (category) {
    case "smartphone":
    case "tablet":
      return "Объём памяти?";
    case "laptop":
      return "Конфигурация ОЗУ / накопителя?";
    case "smartwatch":
      return "Размер корпуса и связь?";
    case "camera":
    case "drone":
      return "Какой комплект?";
    case "gaming_console":
      return "Какое издание?";
    default:
      return "Какой вариант?";
  }
}

function normalizeMime(m: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  if (m === "image/png" || m === "image/webp" || m === "image/gif") return m;
  return "image/jpeg";
}

export { pickVariant };
