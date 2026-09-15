"use client";

import { useMemo, useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Input, InputWithPrefix, Select } from "@/components/ui/field";
import type { UpgradeOption } from "@/features/insights/upgrade";
import { CURRENCIES, type CurrencyCode, convert } from "@/lib/currency";
import { formatMoney } from "@/lib/format";
import type { Asset } from "@/types/domain";
import { track } from "@/lib/analytics";

export function UpgradeCalculator({ asset, options, currency }: { asset: Asset; options: UpgradeOption[]; currency: CurrencyCode }) {
  const [selected, setSelected] = useState<string>(options[0]?.product.id ?? "custom");
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState("");

  const value = asset.currentEstimatedValue == null ? null : convert(asset.currentEstimatedValue, asset.valuationCurrency, currency);
  const quick = asset.quickSaleValue == null ? null : convert(asset.quickSaleValue, asset.valuationCurrency, currency);

  const target = useMemo(() => {
    if (selected === "custom") {
      const p = Number(customPrice);
      return customName && Number.isFinite(p) && p > 0 ? { name: customName, price: p } : null;
    }
    const o = options.find((x) => x.product.id === selected);
    return o ? { name: `${o.product.manufacturer} ${o.product.model}${o.variantName ? ` · ${o.variantName}` : ""}`, price: o.price } : null;
  }, [selected, options, customName, customPrice]);

  const cost = target && value != null ? target.price - value : null;
  const costQuick = target && quick != null ? target.price - quick : null;
  if (cost != null) track("upgrade_calculated", { assetId: asset.id });

  return (
    <Panel>
      <PanelHeader index="U" title="Upgrade calculator" subtitle="What it would cost to move to a newer device after selling this one." />
      <div className="grid gap-px bg-hair md:grid-cols-2">
        <div className="bg-paper p-5">
          <span className="label-mono text-gray">Current device</span>
          <p className="mt-1 text-lg font-bold leading-tight">{asset.name}</p>
          <p className="tnum mt-3 text-3xl font-extrabold display-tight">{value != null ? formatMoney(value, currency) : "—"}</p>
          <p className="label-mono mt-1 text-gray-2">Current value</p>

          <div className="mt-5 space-y-3">
            <Select aria-label="Target device" value={selected} onChange={(e) => setSelected(e.target.value)}>
              {options.map((o) => (
                <option key={o.product.id} value={o.product.id}>
                  {o.product.manufacturer} {o.product.model}
                  {o.isSuccessor ? " · successor" : ""} — {formatMoney(o.price, currency)}
                </option>
              ))}
              <option value="custom">Other device…</option>
            </Select>
            {selected === "custom" ? (
              <div className="grid grid-cols-2 gap-3">
                <Input aria-label="Target device name" placeholder="Device name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                <InputWithPrefix aria-label="Target device price" prefix={CURRENCIES[currency].symbol} inputMode="decimal" placeholder="Price" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} />
              </div>
            ) : null}
          </div>
        </div>
        <div className="bg-ink p-5 text-paper">
          <span className="label-mono text-paper/60">Target device</span>
          <p className="mt-1 text-lg font-bold leading-tight">{target?.name ?? "Pick a device"}</p>
          <p className="tnum mt-3 text-3xl font-extrabold display-tight">{target ? formatMoney(target.price, currency) : "—"}</p>
          <p className="label-mono mt-1 text-paper/50">Price</p>
          <div className="mt-5 border-t border-paper/20 pt-4">
            <span className="label-mono text-orange">Estimated upgrade cost</span>
            <p className="tnum mt-1 text-4xl font-extrabold display-tight">{cost != null ? formatMoney(Math.max(0, cost), currency) : "—"}</p>
            {costQuick != null ? <p className="mt-2 text-[13px] text-paper/60">{formatMoney(Math.max(0, costQuick), currency)} if you sell quickly instead of waiting for the best offer.</p> : null}
          </div>
        </div>
      </div>
    </Panel>
  );
}
