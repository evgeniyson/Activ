"use client";

import { useMemo, useState } from "react";
import { IdentityFields, type AssetFormValues } from "@/components/assets/asset-form-fields";
import { Badge, ConfidenceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Check, PenLine } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { IdentificationResult } from "@/services/identification/types";
import { categoryLabel, specLabel } from "@/types/categories";
import { CATALOG, matchCatalog, searchCatalog, type CatalogProduct } from "@/valuation/catalog";

type Setter = React.Dispatch<React.SetStateAction<AssetFormValues>>;

export function ConfirmStep({
  preview,
  identification,
  form,
  setForm,
  specs,
  setSpecs,
  catalogId,
  setCatalogId,
  onNext,
  onRetake,
  manual,
}: {
  preview: string | null;
  identification: IdentificationResult | null;
  form: AssetFormValues;
  setForm: Setter;
  specs: Record<string, string>;
  setSpecs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  catalogId: string | null;
  setCatalogId: (id: string | null) => void;
  onNext: () => void;
  onRetake: () => void;
  manual: boolean;
}) {
  const [editing, setEditing] = useState(manual || !identification);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const set = <K extends keyof AssetFormValues>(k: K, val: AssetFormValues[K]) => setForm((s) => ({ ...s, [k]: val }));

  const clarifications = identification?.clarifications ?? [];
  const unanswered = clarifications.filter((c) => !answers[c.key]);
  const canContinue = form.name.trim().length > 0 && (editing || unanswered.length === 0);

  const answer = (key: string, option: string) => {
    setAnswers((a) => ({ ...a, [key]: option }));
    if (option === "Не уверен" || option === "Not sure") return;
    if (key === "variant" || key === "storage") {
      set("variant", option);
      // Re-match the catalog with the chosen variant so the valuation uses the right launch price.
      const m = matchCatalog({ manufacturer: form.manufacturer, model: form.model, variant: option, category: form.category });
      if (m?.variant?.specs) setSpecs((s) => ({ ...s, ...m.variant!.specs }));
    } else if (key === "model") {
      const m = matchCatalog({ model: option, category: form.category });
      if (m) {
        setCatalogId(m.product.id);
        set("manufacturer", m.product.manufacturer);
        set("model", m.product.model);
        set("name", `${m.product.manufacturer} ${m.product.model}`);
      } else {
        set("model", option);
        set("name", [form.manufacturer, option].filter(Boolean).join(" "));
      }
    } else {
      setSpecs((s) => ({ ...s, [key]: option }));
    }
  };

  const pickAlternative = (alt: { manufacturer: string; model: string }) => {
    const m = matchCatalog({ manufacturer: alt.manufacturer, model: alt.model });
    setCatalogId(m?.product.id ?? null);
    set("manufacturer", m?.product.manufacturer ?? alt.manufacturer);
    set("model", m?.product.model ?? alt.model);
    set("name", `${m?.product.manufacturer ?? alt.manufacturer} ${m?.product.model ?? alt.model}`);
    if (m) set("category", m.product.category);
    setAnswers({});
  };

  const applyProduct = (p: CatalogProduct) => {
    setCatalogId(p.id);
    setForm((s) => ({ ...s, name: `${p.manufacturer} ${p.model}`, manufacturer: p.manufacturer, model: p.model, category: p.category, variant: "" }));
    setSpecs({ ...(p.specs ?? {}) });
  };

  return (
    <div>
      <span className="label-mono text-gray">{identification ? "Результат AI" : "Данные"}</span>
      <h1 className="mt-2 text-3xl font-extrabold display-tight sm:text-4xl">{identification ? "Всё верно?" : "Расскажите, что это."}</h1>

      {identification ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-[112px_1fr]">
          <div className="relative aspect-square w-28 overflow-hidden border border-hair bg-paper-2 sm:w-full">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gray">{categoryLabel(form.category)}</Badge>
              <ConfidenceBadge score={identification.confidence} kind="identification" />
              {identification.provider === "mock" ? <Badge tone="outline">Демо</Badge> : null}
            </div>
            <p className="mt-2 text-[13px] text-gray">{form.manufacturer}</p>
            <p className="text-2xl font-extrabold display-tight">{form.model || form.name}</p>
            <p className="mt-1 text-[13px] text-gray">
              {[form.variant, ...Object.entries(specs).filter(([k]) => k !== "storage" || !form.variant).map(([k, v]) => `${specLabel(k)}: ${v}`)].filter(Boolean).join(" · ") || "Характеристики не видны"}
            </p>
            {identification.notes ? <p className="mt-2 text-[12px] text-gray-2">{identification.notes}</p> : null}
            {identification.imageQuality === "poor" ? <p className="mt-2 text-[12px] font-medium text-orange-3">Фото не очень чёткое — перепроверьте результат.</p> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => setEditing((e) => !e)} className="label-mono-md inline-flex items-center gap-1 border-b border-ink pb-0.5 hover:text-orange">
                <PenLine className="h-3 w-3" aria-hidden="true" /> {editing ? "Скрыть ручное редактирование" : "Изменить вручную"}
              </button>
              <button type="button" onClick={onRetake} className="label-mono-md border-b border-hair-strong pb-0.5 text-gray hover:text-ink">
                Переснять
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {identification?.alternatives.length && identification.confidence < 0.9 ? (
        <div className="mt-5">
          <span className="label-mono text-gray">Не то? Возможно, это</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {identification.alternatives.map((alt) => (
              <Chip key={`${alt.manufacturer}-${alt.model}`} onClick={() => pickAlternative(alt)}>
                {alt.manufacturer} {alt.model}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      {clarifications.length ? (
        <div className="mt-6 flex flex-col gap-5 border-t border-hair pt-5">
          {clarifications.map((c) => (
            <div key={c.key}>
              <span className="label-mono text-gray">{c.question}</span>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={c.question}>
                {c.options.map((o) => (
                  <Chip key={o} active={answers[c.key] === o} onClick={() => answer(c.key, o)} role="radio" ariaChecked={answers[c.key] === o}>
                    {answers[c.key] === o ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" /> : null}
                    {o}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {editing ? (
        <div className="mt-6 flex flex-col gap-4 border-t border-hair pt-5">
          {!identification ? <CatalogSearch onPick={applyProduct} /> : null}
          <IdentityFields v={form} set={set} />
          {catalogId ? (
            <p className="label-mono text-gray-2">
              Найдено в каталоге · {CATALOG.find((p) => p.id === catalogId)?.model}{" "}
              <button type="button" className="text-orange" onClick={() => setCatalogId(null)}>
                отвязать
              </button>
            </p>
          ) : (
            <UnmatchedHint model={form.model} manufacturer={form.manufacturer} onPick={applyProduct} />
          )}
        </div>
      ) : null}

      <Button size="lg" className="mt-8 w-full" variant="accent" disabled={!canContinue} onClick={onNext}>
        {unanswered.length && !editing ? `Ответьте на ${unanswered.length === 1 ? "вопрос" : "вопросы"}, чтобы продолжить` : "Всё верно →"}
      </Button>
    </div>
  );
}

function Chip({ children, onClick, active, role, ariaChecked }: { children: React.ReactNode; onClick: () => void; active?: boolean; role?: string; ariaChecked?: boolean }) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={ariaChecked}
      onClick={onClick}
      className={cn("inline-flex h-10 items-center gap-1.5 border px-3.5 text-sm font-semibold transition-colors duration-[140ms]", active ? "border-ink bg-ink text-paper" : "border-hair-strong bg-paper hover:border-ink")}
    >
      {children}
    </button>
  );
}

function CatalogSearch({ onPick }: { onPick: (p: CatalogProduct) => void }) {
  const [q, setQ] = useState("");
  const results = useMemo(() => (q.trim().length >= 2 ? searchCatalog(q, 6) : []), [q]);
  return (
    <Field label="Найти в каталоге" htmlFor="catalog-search" hint="точнее оценка">
      <Input id="catalog-search" placeholder="iphone 16 pro, a7 iv, rtx 4080…" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" />
      {results.length ? (
        <ul className="border border-hair bg-paper">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 border-b border-hair px-3.5 py-2.5 text-left text-sm last:border-b-0 hover:bg-black/[0.03]"
                onClick={() => {
                  onPick(p);
                  setQ("");
                }}
              >
                <span>
                  <span className="font-semibold">
                    {p.manufacturer} {p.model}
                  </span>
                  <span className="label-mono ml-2 text-gray-2">{categoryLabel(p.category)}</span>
                </span>
                <span className="label-mono text-gray-2">{p.releaseDate.slice(0, 4)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Field>
  );
}

function UnmatchedHint({ model, manufacturer, onPick }: { model: string; manufacturer: string; onPick: (p: CatalogProduct) => void }) {
  const m = useMemo(() => (model.trim().length >= 3 ? matchCatalog({ manufacturer, model }) : null), [model, manufacturer]);
  if (!m) return model.trim().length >= 3 ? <p className="label-mono text-gray-2">Пока нет в каталоге — оценим по цене покупки.</p> : null;
  return (
    <p className="label-mono text-gray-2">
      Вы имели в виду{" "}
      <button type="button" className="text-orange" onClick={() => onPick(m.product)}>
        {m.product.manufacturer} {m.product.model}
      </button>
      ?
    </p>
  );
}
