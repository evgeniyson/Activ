import { CURRENCIES, type CurrencyCode } from "./currency";

const fmtCache = new Map<string, Intl.NumberFormat>();

function numberFormat(currency: CurrencyCode, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    fmtCache.set(key, f);
  }
  return f;
}

export interface MoneyOptions {
  /** Force decimals; default: 0 for whole numbers, currency default otherwise */
  decimals?: number;
  /** Show explicit + sign for positives */
  signed?: boolean;
  /** Compact large values (12.4K) */
  compact?: boolean;
}

export function formatMoney(amount: number, currency: CurrencyCode = "EUR", opts: MoneyOptions = {}): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const decimals =
    opts.decimals ?? (Number.isInteger(Math.round(safe * 100) / 100) || Math.abs(safe) >= 100 ? 0 : CURRENCIES[currency].decimals);
  if (opts.compact && Math.abs(safe) >= 100_000) {
    const sym = CURRENCIES[currency].symbol;
    const v = safe / 1000;
    return `${safe < 0 ? "−" : opts.signed ? "+" : ""}${sym}${Math.abs(v).toFixed(1)}K`;
  }
  const str = numberFormat(currency, decimals).format(Math.abs(safe));
  if (safe < 0) return `−${str}`;
  if (opts.signed && safe > 0) return `+${str}`;
  return str;
}

export function formatPercent(ratio: number, opts: { signed?: boolean; decimals?: number } = {}): string {
  const safe = Number.isFinite(ratio) ? ratio : 0;
  const decimals = opts.decimals ?? 1;
  const v = Math.abs(safe * 100).toFixed(decimals);
  if (safe < 0) return `−${v}%`;
  if (opts.signed && safe > 0) return `+${v}%`;
  return `${v}%`;
}

export function formatPerDay(amount: number, currency: CurrencyCode = "EUR"): string {
  return `${formatMoney(amount, currency, { decimals: 2 })} / day`;
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("en-IE", { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);
}

export function confidenceLabel(score: number): "High" | "Medium" | "Low" {
  if (score >= 0.8) return "High";
  if (score >= 0.6) return "Medium";
  return "Low";
}

export function pluralize(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function padIndex(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}
