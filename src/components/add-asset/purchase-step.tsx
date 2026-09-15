"use client";

import { useState } from "react";
import { OptionalFields, PurchaseFields, type AssetFormValues } from "@/components/assets/asset-form-fields";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

export function PurchaseStep({ form, setForm, onSubmit, saving, error }: { form: AssetFormValues; setForm: React.Dispatch<React.SetStateAction<AssetFormValues>>; onSubmit: () => void; saving: boolean; error: string | null }) {
  const [more, setMore] = useState(false);
  const set = <K extends keyof AssetFormValues>(k: K, val: AssetFormValues[K]) => setForm((s) => ({ ...s, [k]: val }));
  const priceOk = Number(form.purchasePrice.replace(",", ".")) > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (priceOk && !saving) onSubmit();
      }}
    >
      <span className="label-mono text-gray">{form.name}</span>
      <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">How much did you pay?</h1>
      <p className="mt-2 text-[15px] text-gray">This is what we compare today&apos;s market value against.</p>

      <div className="mt-6 flex flex-col gap-5">
        <PurchaseFields v={form} set={set} errors={error ? { purchasePrice: error } : undefined} />

        <button type="button" onClick={() => setMore((m) => !m)} className="label-mono-md inline-flex items-center gap-1.5 self-start text-gray hover:text-ink" aria-expanded={more}>
          Optional details <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", more && "rotate-180")} aria-hidden="true" />
        </button>
        {more ? (
          <div className="flex flex-col gap-4 border-t border-hair pt-4">
            <OptionalFields v={form} set={set} />
          </div>
        ) : null}
      </div>

      <Button type="submit" size="lg" variant="accent" className="mt-8 w-full" loading={saving} disabled={!priceOk}>
        {saving ? "Estimating market value…" : "Save & see what it's worth"}
      </Button>
    </form>
  );
}
