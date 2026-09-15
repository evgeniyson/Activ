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
const num = (s: string) => s.replace(/\s/g, "").replace(",", ".");

export function AssetActions({ asset, currency }: { asset: Asset; currency: CurrencyCode }) {
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const close = () => setSheet(null);

  const refresh = () =>
    start(async () => {
      const res = await refreshValuationAction(asset.id);
      toast.push(res.ok ? "Оценка обновлена." : res.error, res.ok ? "success" : "error");
    });

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {asset.status === "active" ? (
        <>
          <Button size="sm" variant="ghost" onClick={refresh} loading={pending} aria-label="Обновить оценку">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Обновить</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSheet("value")}>
            <Tag className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Задать стоимость</span>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSheet("sold")}>
            Продано
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
              toast.push(res.ok ? "Актив возвращён в портфель." : res.error, res.ok ? "success" : "error");
            })
          }
        >
          Вернуть
        </Button>
      )}
      <Button size="sm" variant="outline" onClick={() => setSheet("edit")}>
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" /> Изменить
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setSheet("delete")} aria-label="Удалить актив" className="text-gray hover:text-orange-3">
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>

      <EditSheet open={sheet === "edit"} onClose={close} asset={asset} />
      <ManualValueSheet open={sheet === "value"} onClose={close} asset={asset} currency={currency} />
      <SoldSheet open={sheet === "sold"} onClose={close} asset={asset} />
      <Sheet open={sheet === "delete"} onClose={close} title="Удалить актив?" description="Будут удалены предмет, его фото, расходы и история цены. Отменить нельзя.">
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={close}>
            Оставить
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
            Удалить
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
    <Sheet open={open} onClose={onClose} title="Изменить актив" description="Изменение модели или состояния запускает переоценку." className="sm:max-w-2xl">
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
            toast.push("Сохранено.", "success");
            onClose();
          });
        }}
      >
        <IdentityFields v={v} set={set} />
        <PurchaseFields v={v} set={set} />
        <OptionalFields v={v} set={set} />
        {error ? <p className="text-sm font-medium text-orange-3">{error}</p> : null}
        <Button type="submit" size="lg" loading={pending}>
          Сохранить
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
    <Sheet open={open} onClose={onClose} title="Задать стоимость вручную" description="Есть предложение покупателя или оценка сервиса? Используйте её вместо расчёта. Запишется в историю цены.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await setManualValueAction({ assetId: asset.id, value: num(value), currency: cur });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            toast.push("Стоимость обновлена.", "success");
            onClose();
          });
        }}
      >
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <Field label="Текущая стоимость" htmlFor="mv-value">
            <InputWithPrefix id="mv-value" prefix={CURRENCIES[cur].symbol} inputMode="decimal" required autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="96 000" />
          </Field>
          <Field label="Валюта">
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
          Сохранить стоимость
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
    <Sheet open={open} onClose={onClose} title="Отметить как проданный" description="Предмет уйдёт из портфеля; итоговое обесценивание сохранится в истории.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await markSoldAction({ assetId: asset.id, soldPrice: num(price), soldDate: date });
            if (!res.ok) {
              setError(res.error);
              return;
            }
            toast.push("Отмечено как проданное.", "success");
            onClose();
          });
        }}
      >
        <Field label={`Цена продажи (${asset.purchaseCurrency})`} htmlFor="sold-price">
          <InputWithPrefix id="sold-price" prefix={CURRENCIES[asset.purchaseCurrency].symbol} inputMode="decimal" required value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Дата продажи" htmlFor="sold-date">
          <Input id="sold-date" type="date" required value={date} max={toISODate(new Date())} onChange={(e) => setDate(e.target.value)} />
        </Field>
        {error ? <p className="text-sm font-medium text-orange-3">{error}</p> : null}
        <Button type="submit" size="lg" loading={pending}>
          Подтвердить продажу
        </Button>
      </form>
    </Sheet>
  );
}
