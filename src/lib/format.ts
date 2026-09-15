import { CURRENCIES, type CurrencyCode } from "./currency";

export const LOCALE = "ru-RU";

const fmtCache = new Map<string, Intl.NumberFormat>();

function numberFormat(currency: CurrencyCode, fractionDigits: number): Intl.NumberFormat {
  const key = `${currency}:${fractionDigits}`;
  let f = fmtCache.get(key);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE, {
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
  /** Принудительное число знаков после запятой */
  decimals?: number;
  /** Показывать «+» для положительных */
  signed?: boolean;
  /** Сокращать большие суммы (1,2 млн) */
  compact?: boolean;
}

export function formatMoney(amount: number, currency: CurrencyCode = "RUB", opts: MoneyOptions = {}): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const decimals =
    opts.decimals ?? (Number.isInteger(Math.round(safe * 100) / 100) || Math.abs(safe) >= 100 ? 0 : CURRENCIES[currency].decimals);
  const sym = CURRENCIES[currency].symbol;
  if (opts.compact && Math.abs(safe) >= 1_000_000) {
    const v = Math.abs(safe) / 1_000_000;
    return `${safe < 0 ? "−" : opts.signed ? "+" : ""}${v.toFixed(1).replace(".", ",")} млн ${sym}`;
  }
  const str = numberFormat(currency, decimals).format(Math.abs(safe));
  if (safe < 0) return `−${str}`;
  if (opts.signed && safe > 0) return `+${str}`;
  return str;
}

export function formatPercent(ratio: number, opts: { signed?: boolean; decimals?: number } = {}): string {
  const safe = Number.isFinite(ratio) ? ratio : 0;
  const decimals = opts.decimals ?? 1;
  const v = Math.abs(safe * 100).toFixed(decimals).replace(".", ",");
  if (safe < 0) return `−${v}%`;
  if (opts.signed && safe > 0) return `+${v}%`;
  return `${v}%`;
}

export function formatPerDay(amount: number, currency: CurrencyCode = "RUB"): string {
  return `${formatMoney(amount, currency, { decimals: 2 })} / день`;
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }).format(n);
}

export type ConfidenceLabel = "Высокая" | "Средняя" | "Низкая";
export function confidenceLabel(score: number): ConfidenceLabel {
  if (score >= 0.8) return "Высокая";
  if (score >= 0.6) return "Средняя";
  return "Низкая";
}

/** Русская плюрализация: plural(5, ["день", "дня", "дней"]) → "5 дней" */
export function plural(n: number, forms: [string, string, string], withNumber = true): string {
  const abs = Math.abs(Math.round(n)) % 100;
  const last = abs % 10;
  let form: string;
  if (abs > 10 && abs < 20) form = forms[2];
  else if (last === 1) form = forms[0];
  else if (last >= 2 && last <= 4) form = forms[1];
  else form = forms[2];
  return withNumber ? `${formatNumber(n)} ${form}` : form;
}

export const pluralize = plural;

export function padIndex(n: number, width = 3): string {
  return String(n).padStart(width, "0");
}
