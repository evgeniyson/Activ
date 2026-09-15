"use client";

import { motion, useReducedMotion } from "motion/react";
import { ButtonLink, Button } from "@/components/ui/button";
import { ConfidenceBadge } from "@/components/ui/badge";
import { Money } from "@/components/ui/stat";
import type { CreatedAssetSummary } from "@/features/assets/actions";
import { formatMoney, formatPercent, plural } from "@/lib/format";

/** The WOW moment. Four numbers, staggered in. */
export function ResultStep({ result, onAddAnother, preview }: { result: CreatedAssetSummary; onAddAnother: () => void; preview: string | null }) {
  const reduce = useReducedMotion();
  const cur = result.currency;
  const item = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.42, delay: 0.12 + i * 0.14, ease: [0.2, 0.8, 0.2, 1] as const },
  });
  const loss = result.depreciation != null ? -result.depreciation : null;
  const lossPct = loss != null && result.purchasePrice > 0 ? loss / result.purchasePrice : null;

  return (
    <div>
      <motion.div {...item(0)} className="flex items-center gap-4">
        {preview ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden border border-hair">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div>
          <span className="label-mono text-gray">Добавлено в портфель</span>
          <h1 className="text-2xl font-extrabold display-tight sm:text-3xl">{result.name}</h1>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-px border border-ink bg-ink sm:grid-cols-2">
        <motion.div {...item(1)} className="bg-paper p-5 sm:p-6">
          <span className="label-mono text-gray">Вы заплатили</span>
          <p className="tnum mt-2 text-4xl font-extrabold display-tight">{formatMoney(result.purchasePrice, cur)}</p>
          <p className="label-mono mt-2 text-gray-2">{plural(result.daysOwned, ["день", "дня", "дней"])} назад</p>
        </motion.div>
        <motion.div {...item(2)} className="bg-ink p-5 text-paper sm:p-6">
          <span className="label-mono text-paper/60">Сегодня стоит примерно</span>
          <p className="tnum mt-2 text-4xl font-extrabold display-tight">{result.currentValue != null ? <Money amount={result.currentValue} currency={cur} animate /> : "—"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {result.lowEstimate != null && result.highEstimate != null ? (
              <span className="label-mono text-paper/60">
                {formatMoney(result.lowEstimate, cur)} — {formatMoney(result.highEstimate, cur)}
              </span>
            ) : null}
            <ConfidenceBadge score={result.confidence} className="bg-paper text-ink" />
          </div>
        </motion.div>
        <motion.div {...item(3)} className="bg-orange p-5 sm:p-6">
          <span className="label-mono text-ink/70">{loss != null && loss < 0 ? "Подорожал на" : "Вы потеряли"}</span>
          <p className="tnum mt-2 text-4xl font-extrabold display-tight">{loss != null ? formatMoney(Math.abs(loss), cur) : "—"}</p>
          <p className="label-mono mt-2 text-ink/70">{lossPct != null ? `${formatPercent(Math.abs(lossPct))} от цены покупки` : ""}</p>
        </motion.div>
        <motion.div {...item(4)} className="bg-paper p-5 sm:p-6">
          <span className="label-mono text-gray">Средняя стоимость владения</span>
          <p className="tnum mt-2 text-4xl font-extrabold display-tight">
            {result.dailyCost != null ? formatMoney(result.dailyCost, cur, { decimals: 0 }) : "—"}
            <span className="text-base font-semibold text-gray"> / день</span>
          </p>
          <p className="label-mono mt-2 text-gray-2">Покупка − стоимость, за день владения</p>
        </motion.div>
      </div>

      <motion.div {...item(5)} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/app/assets/${result.id}`} size="lg" variant="primary" className="flex-1">
          Открыть актив →
        </ButtonLink>
        <Button size="lg" variant="outline" onClick={onAddAnother} className="flex-1">
          Добавить ещё
        </Button>
      </motion.div>
      <p className="mt-4 text-[12px] text-gray-2">Оценочная рыночная стоимость. Оценки основаны на доступных рыночных данных и могут отличаться от фактической цены продажи.</p>
    </div>
  );
}
