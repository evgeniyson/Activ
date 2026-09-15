"use client";

import { useRouter } from "next/navigation";
import { formatMonth } from "@/lib/dates";

export function MonthPicker({ months, value }: { months: string[]; value: string }) {
  const router = useRouter();
  return (
    <div className="relative">
      <select
        aria-label="Месяц отчёта"
        value={value}
        onChange={(e) => router.push(`/app/insights?month=${e.target.value}`)}
        className="label-mono-md h-9 appearance-none border border-paper/40 bg-transparent pl-3 pr-8 text-paper outline-none hover:border-paper focus:border-orange rounded-none"
      >
        {months.map((m) => (
          <option key={m} value={m} className="text-ink">
            {formatMonth(`${m}-01`)}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-paper" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
