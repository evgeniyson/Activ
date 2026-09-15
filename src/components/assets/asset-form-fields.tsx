"use client";

import { Field, Input, InputWithPrefix, Select, Textarea } from "@/components/ui/field";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import { toISODate } from "@/lib/dates";
import { CATEGORIES, CATEGORY_GROUPS, CATEGORY_IDS, type AssetCategory } from "@/types/categories";
import { CONDITIONS, CONDITION_LABELS, type Condition } from "@/types/domain";

export interface AssetFormValues {
  name: string;
  category: AssetCategory;
  manufacturer: string;
  model: string;
  variant: string;
  purchasePrice: string;
  purchaseCurrency: CurrencyCode;
  purchaseDate: string;
  condition: Condition;
  retailer: string;
  serialNumber: string;
  imei: string;
  warrantyExpiration: string;
  notes: string;
}

export const emptyAssetForm = (currency: CurrencyCode): AssetFormValues => ({
  name: "",
  category: "smartphone",
  manufacturer: "",
  model: "",
  variant: "",
  purchasePrice: "",
  purchaseCurrency: currency,
  purchaseDate: toISODate(new Date()),
  condition: "excellent",
  retailer: "",
  serialNumber: "",
  imei: "",
  warrantyExpiration: "",
  notes: "",
});

export function ConditionPicker({ value, onChange }: { value: Condition; onChange: (c: Condition) => void }) {
  return (
    <div role="radiogroup" aria-label="Состояние" className="grid grid-cols-5 gap-px border border-ink bg-ink">
      {CONDITIONS.map((c) => {
        const active = c === value;
        return (
          <button key={c} type="button" role="radio" aria-checked={active} onClick={() => onChange(c)} className={`h-11 px-1 text-[11px] font-semibold transition-colors duration-[140ms] sm:text-[13px] ${active ? "bg-ink text-paper" : "bg-paper text-gray hover:text-ink"}`}>
            {CONDITION_LABELS[c]}
          </button>
        );
      })}
    </div>
  );
}

export function IdentityFields({ v, set, errors }: { v: AssetFormValues; set: <K extends keyof AssetFormValues>(k: K, val: AssetFormValues[K]) => void; errors?: Record<string, string> }) {
  return (
    <>
      <Field label="Название" htmlFor="af-name" error={errors?.name}>
        <Input id="af-name" required value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="iPhone 17 Pro" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Производитель" htmlFor="af-manufacturer">
          <Input id="af-manufacturer" value={v.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="Apple" />
        </Field>
        <Field label="Модель" htmlFor="af-model">
          <Input id="af-model" value={v.model} onChange={(e) => set("model", e.target.value)} placeholder="iPhone 17 Pro" />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Категория" htmlFor="af-category">
          <Select id="af-category" value={v.category} onChange={(e) => set("category", e.target.value as AssetCategory)}>
            {Object.entries(CATEGORY_GROUPS).map(([group, label]) => (
              <optgroup key={group} label={label}>
                {CATEGORY_IDS.filter((id) => CATEGORIES[id].group === group).map((id) => (
                  <option key={id} value={id}>
                    {CATEGORIES[id].label}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
        <Field label="Вариант" htmlFor="af-variant" hint="память, размер, комплект">
          <Input id="af-variant" value={v.variant} onChange={(e) => set("variant", e.target.value)} placeholder="256 GB" />
        </Field>
      </div>
    </>
  );
}

export function PurchaseFields({ v, set, errors }: { v: AssetFormValues; set: <K extends keyof AssetFormValues>(k: K, val: AssetFormValues[K]) => void; errors?: Record<string, string> }) {
  return (
    <>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Цена покупки" htmlFor="af-price" error={errors?.purchasePrice}>
          <InputWithPrefix id="af-price" prefix={CURRENCIES[v.purchaseCurrency].symbol} inputMode="decimal" required value={v.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="139 990" invalid={Boolean(errors?.purchasePrice)} />
        </Field>
        <Field label="Валюта">
          <Select aria-label="Валюта покупки" value={v.purchaseCurrency} onChange={(e) => set("purchaseCurrency", e.target.value as CurrencyCode)} className="w-24">
            {CURRENCY_CODES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Дата покупки" htmlFor="af-date" error={errors?.purchaseDate}>
        <Input id="af-date" type="date" required value={v.purchaseDate} max={toISODate(new Date())} onChange={(e) => set("purchaseDate", e.target.value)} />
      </Field>
      <Field label="Состояние">
        <ConditionPicker value={v.condition} onChange={(c) => set("condition", c)} />
      </Field>
    </>
  );
}

export function OptionalFields({ v, set }: { v: AssetFormValues; set: <K extends keyof AssetFormValues>(k: K, val: AssetFormValues[K]) => void }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Магазин" htmlFor="af-retailer">
          <Input id="af-retailer" value={v.retailer} onChange={(e) => set("retailer", e.target.value)} placeholder="re:Store" />
        </Field>
        <Field label="Гарантия до" htmlFor="af-warranty">
          <Input id="af-warranty" type="date" value={v.warrantyExpiration} onChange={(e) => set("warrantyExpiration", e.target.value)} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Серийный номер" htmlFor="af-serial">
          <Input id="af-serial" className="font-mono text-sm" value={v.serialNumber} onChange={(e) => set("serialNumber", e.target.value)} />
        </Field>
        <Field label="IMEI" htmlFor="af-imei">
          <Input id="af-imei" className="font-mono text-sm" inputMode="numeric" value={v.imei} onChange={(e) => set("imei", e.target.value)} />
        </Field>
      </div>
      <Field label="Заметки" htmlFor="af-notes">
        <Textarea id="af-notes" value={v.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Комплектация, известные проблемы…" />
      </Field>
    </>
  );
}

export function formToPayload(v: AssetFormValues) {
  return {
    name: v.name,
    category: v.category,
    manufacturer: v.manufacturer,
    model: v.model,
    variant: v.variant,
    purchasePrice: v.purchasePrice.replace(/[^\d.,]/g, "").replace(",", "."),
    purchaseCurrency: v.purchaseCurrency,
    purchaseDate: v.purchaseDate,
    condition: v.condition,
    retailer: v.retailer,
    serialNumber: v.serialNumber,
    imei: v.imei,
    warrantyExpiration: v.warrantyExpiration || null,
    notes: v.notes,
  };
}
