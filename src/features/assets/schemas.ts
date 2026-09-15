import { z } from "zod";
import { CURRENCY_CODES } from "@/lib/currency";
import { CATEGORY_IDS } from "@/types/categories";
import { CONDITIONS, EXPENSE_TYPES } from "@/types/domain";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите корректную дату.")
  .refine((s) => !Number.isNaN(Date.parse(s)), "Укажите корректную дату.");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s.length ? s : null))
    .nullable()
    .optional();

export const createAssetSchema = z.object({
  name: z.string().trim().min(1, "Дайте предмету название.").max(120),
  category: z.enum(CATEGORY_IDS as [string, ...string[]]),
  manufacturer: optionalText(80),
  model: optionalText(120),
  variant: optionalText(80),
  description: optionalText(500),
  specs: z.record(z.string(), z.string().max(120)).default({}),
  catalogId: optionalText(80),
  purchasePrice: z.coerce.number().min(0, "Укажите, сколько вы заплатили.").max(100_000_000),
  purchaseCurrency: z.enum(CURRENCY_CODES as [string, ...string[]]),
  purchaseDate: isoDate.refine((s) => new Date(s) <= new Date(), "Дата покупки не может быть в будущем."),
  retailer: optionalText(80),
  condition: z.enum(CONDITIONS),
  serialNumber: optionalText(80),
  imei: optionalText(40),
  warrantyExpiration: isoDate.nullable().optional(),
  notes: optionalText(1000),
  identificationConfidence: z.number().min(0).max(1).nullable().optional(),
  scanImage: z.object({ storagePath: z.string(), url: z.string(), width: z.number().nullable(), height: z.number().nullable() }).nullable().optional(),
});
export type CreateAssetInputRaw = z.input<typeof createAssetSchema>;

export const updateAssetSchema = createAssetSchema
  .omit({ scanImage: true, identificationConfidence: true })
  .partial()
  .extend({ status: z.enum(["active", "sold", "lost", "archived"]).optional() });

export const expenseSchema = z.object({
  assetId: z.string().min(1),
  type: z.enum(EXPENSE_TYPES),
  amount: z.coerce.number().positive("Укажите сумму."),
  currency: z.enum(CURRENCY_CODES as [string, ...string[]]),
  date: isoDate,
  title: z.string().trim().min(1, "Опишите расход.").max(120),
  notes: optionalText(500),
});

export const manualValueSchema = z.object({
  assetId: z.string().min(1),
  value: z.coerce.number().positive("Укажите стоимость."),
  currency: z.enum(CURRENCY_CODES as [string, ...string[]]),
});

export const markSoldSchema = z.object({
  assetId: z.string().min(1),
  soldPrice: z.coerce.number().min(0),
  soldDate: isoDate,
});
