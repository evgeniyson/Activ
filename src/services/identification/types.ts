import { z } from "zod";
import { CATEGORY_IDS, type AssetCategory } from "@/types/categories";

export const ClarificationSchema = z.object({
  key: z.string().describe("Spec key this question resolves, e.g. 'storage', 'model', 'size'"),
  question: z.string().describe("Short question shown to the user, e.g. 'Storage capacity?'"),
  options: z.array(z.string()).min(2).max(6).describe("Mutually exclusive answer options; include 'Not sure' when reasonable"),
});

export const IdentificationSchema = z.object({
  recognized: z.boolean().describe("false when the image does not contain an identifiable product"),
  imageQuality: z.enum(["good", "poor"]).describe("'poor' when blurry, dark, cropped or the product is too small"),
  category: z.enum(CATEGORY_IDS as [string, ...string[]]),
  manufacturer: z.string().nullable(),
  model: z.string().nullable().describe("Product model name without the manufacturer, e.g. 'iPhone 17 Pro'"),
  variant: z.string().nullable().describe("Visible variant such as storage, size or kit — null when not visible"),
  specs: z.array(z.object({ key: z.string(), value: z.string() })).describe("Only specs you can actually see or are certain of"),
  color: z.string().nullable(),
  confidence: z.number().min(0).max(1).describe("Identification confidence for manufacturer+model"),
  clarifications: z.array(ClarificationSchema).describe("Questions for details you cannot see (storage, exact generation…). Never guess these."),
  alternatives: z.array(z.object({ manufacturer: z.string(), model: z.string() })).max(3).describe("Other plausible identifications if confidence < 0.85"),
  notes: z.string().nullable().describe("One short sentence of reasoning for the user"),
});

export type IdentificationOutput = z.infer<typeof IdentificationSchema>;

export interface IdentificationResult extends Omit<IdentificationOutput, "specs" | "category"> {
  category: AssetCategory;
  specs: Record<string, string>;
  /** Suggested display name: "Apple iPhone 17 Pro" */
  name: string;
  catalogId: string | null;
  provider: "claude" | "mock" | "barcode";
}

export interface IdentificationProvider {
  readonly id: IdentificationResult["provider"];
  isAvailable(): boolean;
  identify(input: { image: Buffer; mimeType: string; hint?: string }): Promise<IdentificationResult>;
}

export class IdentificationError extends Error {
  constructor(
    message: string,
    public readonly code: "unavailable" | "timeout" | "refused" | "invalid_output" | "provider_error",
  ) {
    super(message);
  }
}
