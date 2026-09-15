"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AssetRow } from "@/components/assets/asset-row";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/field";
import { ButtonLink } from "@/components/ui/button";
import { Search } from "@/components/ui/icons";
import type { PortfolioItem } from "@/features/portfolio/service";
import type { CurrencyCode } from "@/lib/currency";
import { categoryLabel } from "@/types/categories";
import { cn } from "@/lib/cn";

type SortKey = "value_desc" | "value_asc" | "loss_desc" | "loss_pct_desc" | "newest" | "oldest" | "name";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "value_desc", label: "Стоимость · по убыванию" },
  { value: "value_asc", label: "Стоимость · по возрастанию" },
  { value: "loss_desc", label: "Самая большая потеря" },
  { value: "loss_pct_desc", label: "Быстрее всего дешевеет" },
  { value: "newest", label: "Недавно куплены" },
  { value: "oldest", label: "Дольше всего в собственности" },
  { value: "name", label: "По названию" },
];

export function AssetsList({ items, currency, compact, initialQuery = "" }: { items: PortfolioItem[]; currency: CurrencyCode; compact?: boolean; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("value_desc");
  const q = useDeferredValue(query.trim().toLowerCase());

  const categories = useMemo(() => {
    const set = new Map<string, number>();
    for (const i of items) set.set(i.asset.category, (set.get(i.asset.category) ?? 0) + 1);
    return [...set.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (category !== "all") list = list.filter((i) => i.asset.category === category);
    if (q) {
      list = list.filter(({ asset }) =>
        [asset.name, asset.manufacturer, asset.model, asset.variant, asset.notes, asset.serialNumber, asset.imei, categoryLabel(asset.category), ...Object.values(asset.specs)]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q)),
      );
    }
    const by: Record<SortKey, (a: PortfolioItem, b: PortfolioItem) => number> = {
      value_desc: (a, b) => (b.metrics.currentValue ?? 0) - (a.metrics.currentValue ?? 0),
      value_asc: (a, b) => (a.metrics.currentValue ?? 0) - (b.metrics.currentValue ?? 0),
      loss_desc: (a, b) => (a.metrics.depreciation ?? 0) - (b.metrics.depreciation ?? 0),
      loss_pct_desc: (a, b) => (a.metrics.depreciationPct ?? 0) - (b.metrics.depreciationPct ?? 0),
      newest: (a, b) => b.asset.purchaseDate.localeCompare(a.asset.purchaseDate),
      oldest: (a, b) => a.asset.purchaseDate.localeCompare(b.asset.purchaseDate),
      name: (a, b) => a.asset.name.localeCompare(b.asset.name),
    };
    return [...list].sort(by[sort]);
  }, [items, category, q, sort]);

  return (
    <div>
      {!compact ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray" aria-hidden="true" />
            <Input aria-label="Поиск по активам" placeholder="Поиск — iphone, sony, камера, серийный номер…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-3">
            <Select aria-label="Сортировка" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="sm:w-56">
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      ) : null}

      {!compact && categories.length > 1 ? (
        <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Фильтр по категории">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            Все · {items.length}
          </Chip>
          {categories.map(([c, n]) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {categoryLabel(c)} · {n}
            </Chip>
          ))}
        </div>
      ) : null}

      <div className="border border-hair bg-paper">
        <div className="hidden items-center gap-4 border-b border-hair px-5 py-2 md:flex">
          <span className="label-mono w-8 text-gray-2">#</span>
          <span className="label-mono flex-1 text-gray-2 pl-16">Актив</span>
          <span className="label-mono w-28 text-right text-gray-2">Куплено</span>
          <span className="label-mono hidden w-24 text-right text-gray-2 lg:block">За 30 дней</span>
          <span className="label-mono w-32 text-right text-gray-2">Текущая стоимость</span>
        </div>
        {filtered.length ? (
          filtered.map((item, i) => <AssetRow key={item.asset.id} asset={item.asset} metrics={item.metrics} currency={currency} index={i} change30d={item.change30d} />)
        ) : (
          <div className="px-5 py-10 text-center text-sm text-gray">По запросу «{query}» ничего не найдено.</div>
        )}
      </div>
      {compact && items.length > filtered.length ? null : null}
      {!items.length ? (
        <EmptyState
          className="mt-4"
          title="Ваш портфель пуст."
          description="Начните с того, что у вас уже есть — телефон, ноутбук, камера. Через несколько секунд вы увидите, сколько это стоит сегодня."
          action={<ButtonLink href="/app/assets/new?method=camera" variant="accent">Отсканировать первый актив</ButtonLink>}
        />
      ) : null}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn("label-mono-md h-9 shrink-0 border px-3 transition-colors duration-[140ms]", active ? "border-ink bg-ink text-paper" : "border-hair-strong text-gray hover:border-ink hover:text-ink")}
    >
      {children}
    </button>
  );
}
