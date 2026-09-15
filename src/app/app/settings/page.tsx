import type { Metadata } from "next";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { DangerZone } from "@/components/settings/danger-zone";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { ensureProfile } from "@/features/profile/service";
import { getDataMode, hasAnthropicKey } from "@/lib/env";
import { getStore } from "@/services/data";
import { requireUser } from "@/services/auth/session";
import { getValuationEngine } from "@/valuation";
import { signOut } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export const metadata: Metadata = { title: "Настройки" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const store = await getStore();
  const profile = await ensureProfile(store, user);
  const sources = getValuationEngine().describeSources();
  const assetCount = (await store.listAssets(user.id, { status: "all" })).length;

  return (
    <>
      <PageHeader index="007" title="Настройки" description={user.email ?? undefined} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <SettingsForm profile={profile} />
        </div>
        <div className="flex flex-col gap-4">
          <Panel>
            <PanelHeader index="V" title="Источники оценки" />
            <ul>
              {sources.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 border-b border-hair px-5 py-3 last:border-b-0">
                  <div>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-[12px] text-gray">{s.description}</p>
                  </div>
                  <Badge tone={s.enabled ? "ink" : "gray"}>{s.enabled ? "Вкл" : "Выкл"}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel>
            <PanelHeader index="Σ" title="Система" />
            <dl className="divide-y divide-hair px-5 text-sm">
              <Row k="Данные" v={getDataMode() === "supabase" ? "Supabase" : "Локальный файл (dev)"} />
              <Row k="AI-распознавание" v={hasAnthropicKey() ? "Claude vision" : "Демо-провайдер"} />
              <Row k="Активов" v={String(assetCount)} />
            </dl>
            <div className="px-5 pb-4 pt-2">
              <InstallPrompt className="label-mono flex w-full items-center justify-between border border-ink px-2 py-2 text-ink hover:bg-ink hover:text-paper" />
              <form action={signOut}>
                <Button type="submit" variant="outline" className="w-full">
                  Выйти
                </Button>
              </form>
            </div>
          </Panel>
          <DangerZone />
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className="label-mono text-gray-2">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
