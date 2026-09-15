"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartPoint } from "@/features/portfolio/service";
import type { CurrencyCode } from "@/lib/currency";
import { formatDate, formatShortDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import { Segmented } from "@/components/ui/field";
import { Delta } from "@/components/ui/stat";

type Period = "1M" | "3M" | "6M" | "1Y" | "ALL";
const DAYS: Record<Period, number> = { "1M": 30, "3M": 90, "6M": 182, "1Y": 365, ALL: 10_000 };

export function PortfolioChart({ series, currency, height = 240 }: { series: ChartPoint[]; currency: CurrencyCode; height?: number }) {
  const [period, setPeriod] = useState<Period>("6M");
  const data = useMemo(() => {
    const n = DAYS[period];
    const slice = series.slice(-n);
    // Thin dense series so the SVG stays light
    const step = Math.max(1, Math.floor(slice.length / 180));
    return slice.filter((_, i) => i % step === 0 || i === slice.length - 1);
  }, [series, period]);

  const first = data[0]?.value ?? 0;
  const last = data[data.length - 1]?.value ?? 0;
  const change = last - first;
  const domain = useMemo(() => {
    const vals = data.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(50, (max - min) * 0.25);
    return [Math.max(0, Math.floor((min - pad) / 100) * 100), Math.ceil((max + pad) / 100) * 100];
  }, [data]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="flex items-baseline gap-3">
          <span className="label-mono text-gray">Portfolio value</span>
          {data.length > 1 ? <Delta amount={change} ratio={first ? change / first : null} currency={currency} /> : null}
        </div>
        <Segmented ariaLabel="Chart period" value={period} onChange={setPeriod} options={(["1M", "3M", "6M", "1Y", "ALL"] as Period[]).map((p) => ({ value: p, label: p }))} />
      </div>
      <div style={{ height }} className="mt-2 w-full">
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray">Value history builds up as your assets get re-valued. Check back tomorrow.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E85002" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#E85002" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis domain={domain} hide />
              <Tooltip content={<ChartTip currency={currency} />} cursor={{ stroke: "#000", strokeDasharray: "2 3" }} isAnimationActive={false} />
              <Area type="monotone" dataKey="value" stroke="#E85002" strokeWidth={2} fill="url(#pv)" isAnimationActive={false} activeDot={{ r: 4, fill: "#000", stroke: "#F9F9F9", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {data.length > 1 ? (
        <div className="flex justify-between px-4 pb-3 sm:px-5">
          <span className="label-mono text-gray-2">{formatShortDate(data[0].date)}</span>
          <span className="label-mono text-gray-2">{formatShortDate(data[data.length - 1].date)}</span>
        </div>
      ) : null}
    </div>
  );
}

function ChartTip({ active, payload, currency }: { active?: boolean; payload?: { payload: ChartPoint }[]; currency: CurrencyCode }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-ink px-3 py-2 text-paper">
      <div className="label-mono text-paper/60">{formatDate(p.date)}</div>
      <div className="tnum text-base font-bold">{formatMoney(p.value, currency)}</div>
      <div className="label-mono text-paper/60">Paid {formatMoney(p.purchase, currency)}</div>
    </div>
  );
}
