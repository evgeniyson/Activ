"use client";

import { useMemo } from "react";
import { Area, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { AssetValueHistory } from "@/types/domain";
import { convert, type CurrencyCode } from "@/lib/currency";
import { formatDate, formatShortDate } from "@/lib/dates";
import { formatMoney } from "@/lib/format";

export function ValueHistoryChart({ history, currency, purchasePrice, height = 220 }: { history: AssetValueHistory[]; currency: CurrencyCode; purchasePrice: number; height?: number }) {
  const data = useMemo(() => {
    const byDate = new Map<string, AssetValueHistory>();
    for (const h of [...history].sort((a, b) => a.date.localeCompare(b.date))) byDate.set(h.date, h);
    return [...byDate.values()].map((h) => ({
      date: h.date,
      value: Math.round(convert(h.estimatedValue, h.currency, currency)),
      low: Math.round(convert(h.lowEstimate, h.currency, currency)),
      high: Math.round(convert(h.highEstimate, h.currency, currency)),
      manual: h.source === "manual",
    }));
  }, [history, currency]);

  const domain = useMemo(() => {
    const vals = data.flatMap((d) => [d.low, d.high]).concat(purchasePrice);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const pad = Math.max(20, (max - min) * 0.15);
    return [Math.max(0, Math.floor((min - pad) / 50) * 50), Math.ceil((max + pad) / 50) * 50];
  }, [data, purchasePrice]);

  if (data.length < 2) {
    return <div className="flex items-center justify-center px-6 py-10 text-center text-sm text-gray">Price history will appear after a few valuations.</div>;
  }

  return (
    <div>
      <div style={{ height }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="rangeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#000" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#000" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" hide />
            <YAxis domain={domain} hide />
            <Tooltip content={<Tip currency={currency} />} cursor={{ stroke: "#000", strokeDasharray: "2 3" }} isAnimationActive={false} />
            <ReferenceLine y={purchasePrice} stroke="#A7A7A7" strokeDasharray="3 3" label={{ value: "Paid", position: "insideTopRight", fill: "#646464", fontSize: 10, fontFamily: "var(--font-jetbrains)" }} />
            <Area type="monotone" dataKey="high" stroke="none" fill="url(#rangeFill)" isAnimationActive={false} />
            <Area type="monotone" dataKey="low" stroke="none" fill="#F9F9F9" isAnimationActive={false} />
            <Line type="monotone" dataKey="value" stroke="#E85002" strokeWidth={2} dot={false} isAnimationActive={false} activeDot={{ r: 4, fill: "#000", stroke: "#F9F9F9", strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between px-4 pb-3 sm:px-5">
        <span className="label-mono text-gray-2">{formatShortDate(data[0].date)}</span>
        <span className="label-mono text-gray-2">{formatShortDate(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}

function Tip({ active, payload, currency }: { active?: boolean; payload?: { payload: { date: string; value: number; low: number; high: number; manual: boolean } }[]; currency: CurrencyCode }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="bg-ink px-3 py-2 text-paper">
      <div className="label-mono text-paper/60">{formatDate(p.date)}</div>
      <div className="tnum text-base font-bold">{formatMoney(p.value, currency)}</div>
      <div className="label-mono text-paper/60">
        {formatMoney(p.low, currency)} – {formatMoney(p.high, currency)}
        {p.manual ? " · manual" : ""}
      </div>
    </div>
  );
}
