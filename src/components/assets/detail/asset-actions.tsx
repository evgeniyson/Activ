"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, InputWithPrefix, Select } from "@/components/ui/field";
import { PenLine, RefreshCw, Tag, Trash2 } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { deleteAssetAction, markSoldAction, refreshValuationAction, restoreAssetAction, setManualValueAction, updateAssetAction } from "@/features/assets/actions";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import { toISODate } from "@/lib/dates";
import type { Asset } from "@/types/domain";
import { IdentityFields, OptionalFields, PurchaseFields, formToPayload, type AssetFormValues } from "../asset-form-fields";

type SheetKind = null | "edit" | "value" | "sold" | "delete";

export function AssetActions({ asset, currency }: { asset: Asset; currency: CurrencyCode }) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const close = () => setSheet(null);

  const refresh = () =>
    start(async () => {
      const res = await refreshValuationAction(asset.id);
      toast.push(res.ok ? "Valuation refreshed." : res.error, res.ok ? "success" : "error");
    });

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {asset.status === "active" ? (
        <>
          <Button size="sm" variant="ghost" onClick={refresh} loading={pending} aria-label="Refresh valuation">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSheet("value")}>
            <Tag className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Set value</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSheet("sold")}>
            Mark sold
          </Button>
        </>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          loading={pending}
          onClick={() =>
            start(async () => {
              const res = await restoreAssetAction(asset.id);
              toast.push(res.ok ? "Asset restored to your portfolio." : res.error, res.ok ? "success" : "error");
            })
          }
        >
          Restore
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setSheet("edit")}>
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" /> Edit
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setSheet("delete")} aria-label="Delete asset" className="text-gray hover:text-orange-3">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>

      <EditSheet open={sheet === "edit"} onClose={close} asset={asset} />
      <ManualValueSheet open={sheet === "value"} onClose={close} asset={asset} currency={currency} />
      <SoldSheet open={sheet === "sold"} onClose={close} asset={asset} />
      <Sheet open={sheet === "delete"} onClose={close} title="Delete this asset?" description="This removes the item, its photos, expenses and price history. It can't be undone.">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={close}>
            Keep it
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await deleteAssetAction(asset.id);
                if (res && !res.ok) toast.push(res.error, "error");
              })
            }
          >
            Delete
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function EditSheet({ open, onClose, asset }: { open: boolean; onClose: () => void; asset: Asset }) {
  const [v, setV] = useState<AssetFormValues>(() => ({
    name: asset.name,
    category: asset.category,
    manufacturer: asset.manufacturer ?? "",
    model: asset.model ?? "",
    variant: asset.variant ?? "",
    purchasePrice: String(asset.purchasePrice),
    purchaseCurrency: asset.purchaseCurrency,
    purchaseDate: asset.purchaseDate,
    condition: asset.condition,
    retailer: asset.retailer ?? "",
    serialNumber: asset.serialNumber ?? "",
    imei: asset.imei ?? "",
    warrantyExpiration: asset.warrantyExpiration ?? "",
    notes: asset.notes ?? "",
  }));
  const set = <K extends keyof AssetFormValues>(k: K, val: AssetFormValues[K]) => setV((s) => ({ ...s, [k]: val }));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  return (
    <Sheet open={open} onClose={onClose} title="Edit asset" description="Changing the model or condition re-runs the valuation." className="sm:max-w-2xl">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          start(async () => {
            const res = await updateAssetAction(asset.id, formToPayload(v));
            if (!res.ok) {
              setError(res.error);
              return;
            }
            toast.push("Saved.", "success");
            onClose();
          });
        }}
      >
        <IdentityFields v={v} set={set} />
        <PurchaseFields v={v} set={set} />
        <OptionalFields v={v} set={set} />
        {error ? <p className="text-sm font-medium text-orange-3">{error}</p> : null}
        <Button type="submit" size="lg" loading={pending}>
          Save changes
        </Button>
      </form>
    </Sheet>
  );
}

function ManualValueSheet({ open, onClose, asset, currency }: { open: boolean; onClose: () => void; asset: Asset; currency: CurrencyCode }) {
  const [value, setValue] = useState("");
  const [cur, setCur] = useState<CurrencyCode>(currency);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  return (
    <Sheet open={open} onClose={onClose} title="Set value manually" description="Got an offer or an appraisal? Use it instead of the estimate. Recorded in the price history.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await setManualValueAction({ assetId: asset.id, value, currency: cur });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            toast.push("Value updated.", "success");
            onClose();
          });
        }}
      >
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="Current value" htmlFor="mv-value">
            <InputWithPrefix id="mv-value" prefix={CURRENCIES[cur].symbol} inputMode="decimal" required autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="930" />
          </Field>
          <Field label="Currency">
            <Select value={cur} onChange={(e) => setCur(e.target.value as CurrencyCode)} className="w-24">
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        {error ? <p className="text-sm font-medium text-orange-3">{error}</p> : null}
        <Button type="submit" size="lg" loading={pending}>
          Save value
        </Button>
      </form>
    </Sheet>
  );
}

function SoldSheet({ open, onClose, asset }: { open: boolean; onClose: () => void; asset: Asset }) {
  const [price, setPrice] = useState(asset.currentEstimatedValue ? String(Math.round(asset.currentEstimatedValue)) : "");
  const [date, setDate] = useState(toISODate(new Date()));
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  return (
    <Sheet open={open} onClose={onClose} title="Mark as sold" description="The item moves out of your portfolio; its final depreciation is recorded.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await markSoldAction({ assetId: asset.id, soldPrice: price, soldDate: date });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            toast.push("Marked as sold.", "success");
            onClose();
          });
        }}
      >
        <Field label={`Sale price (${asset.purchaseCurrency})`} htmlFor="sold-price">
          <InputWithPrefix id="sold-price" prefix={CURRENCIES[asset.purchaseCurrency].symbol} inputMode="decimal" required value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Sale date" htmlFor="sold-date">
          <Input id="sold-date" type="date" required value={date} max={toISODate(new Date())} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {error ? <p className="text-sm font-medium text-orange-3">{error}</p> : null}
        <Button type="submit" size="lg" loading={pending}>
          Confirm sale
        </Button>
      </form>
    </Sheet>
  );
}
