"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Switch } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { useToast } from "@/components/ui/toast";
import { updateProfileAction } from "@/features/profile/actions";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/currency";
import { MARKET_REGIONS, REGION_LABELS, type MarketRegion, type NotificationPrefs, type Profile } from "@/types/domain";

export function SettingsForm({ profile }: { profile: Profile }) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>(profile.preferredCurrency);
  const [region, setRegion] = useState<MarketRegion>(profile.marketRegion);
  const [prefs, setPrefs] = useState<NotificationPrefs>(profile.notificationPrefs);
  const [pending, start] = useTransition();
  const toast = useToast();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await updateProfileAction({ displayName, country, preferredCurrency: currency, marketRegion: region, notificationPrefs: prefs });
      toast.push(res.ok ? "Settings saved. Values are shown in " + currency + "." : res.error, res.ok ? "success" : "error");
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Panel>
        <PanelHeader index="P" title="Profile" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Display name" htmlFor="s-name">
            <Input id="s-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          </Field>
          <Field label="Country" htmlFor="s-country">
            <Input id="s-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Germany" />
          </Field>
        </div>
      </Panel>
      <Panel>
        <PanelHeader index="R" title="Region & currency" subtitle="Used prices differ by market. Valuations are made for your region and shown in your currency." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Preferred currency" htmlFor="s-currency">
            <Select id="s-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c} — {CURRENCIES[c].name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marketplace region" htmlFor="s-region">
            <Select id="s-region" value={region} onChange={(e) => setRegion(e.target.value as MarketRegion)}>
              {MARKET_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {REGION_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Panel>
      <Panel>
        <PanelHeader index="N" title="Notifications" />
        <div className="divide-y divide-hair px-5">
          <Switch label="Price changes" description="When an asset moves more than 5% in 30 days." checked={prefs.priceChanges} onChange={(v) => setPrefs({ ...prefs, priceChanges: v })} />
          <Switch label="Sell opportunities" description="When signals suggest a good time to sell." checked={prefs.sellOpportunities} onChange={(v) => setPrefs({ ...prefs, sellOpportunities: v })} />
          <Switch label="Warranty alerts" description="30 days before a warranty ends." checked={prefs.warrantyAlerts} onChange={(v) => setPrefs({ ...prefs, warrantyAlerts: v })} />
          <Switch label="Monthly report" description="Portfolio summary at the start of each month." checked={prefs.monthlyReport} onChange={(v) => setPrefs({ ...prefs, monthlyReport: v })} />
        </div>
      </Panel>
      <div>
        <Button type="submit" size="lg" loading={pending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
