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
      toast.push(res.ok ? `Настройки сохранены. Стоимость показывается в ${currency}.` : res.error, res.ok ? "success" : "error");
    });
  };

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <Panel>
        <PanelHeader index="P" title="Профиль" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Имя" htmlFor="s-name">
            <Input id="s-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ваше имя" />
          </Field>
          <Field label="Страна" htmlFor="s-country">
            <Input id="s-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Россия" />
          </Field>
        </div>
      </Panel>
      <Panel>
        <PanelHeader index="R" title="Регион и валюта" subtitle="Цены б/у отличаются по рынкам. Оценка делается для вашего региона и показывается в вашей валюте." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Основная валюта" htmlFor="s-currency">
            <Select id="s-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
              {CURRENCY_CODES.map((c) => (
                <option key={c} value={c}>
                  {c} — {CURRENCIES[c].name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Рынок" htmlFor="s-region">
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
        <PanelHeader index="N" title="Уведомления" />
        <div className="divide-y divide-hair px-5">
          <Switch label="Изменения цены" description="Когда актив меняется больше чем на 5% за 30 дней." checked={prefs.priceChanges} onChange={(v) => setPrefs({ ...prefs, priceChanges: v })} />
          <Switch label="Моменты для продажи" description="Когда сигналы указывают на удачное время продать." checked={prefs.sellOpportunities} onChange={(v) => setPrefs({ ...prefs, sellOpportunities: v })} />
          <Switch label="Гарантия" description="За 30 дней до окончания гарантии." checked={prefs.warrantyAlerts} onChange={(v) => setPrefs({ ...prefs, warrantyAlerts: v })} />
          <Switch label="Ежемесячный отчёт" description="Сводка по портфелю в начале каждого месяца." checked={prefs.monthlyReport} onChange={(v) => setPrefs({ ...prefs, monthlyReport: v })} />
        </div>
      </Panel>
      <div>
        <Button type="submit" size="lg" loading={pending}>
          Сохранить настройки
        </Button>
      </div>
    </form>
  );
}
