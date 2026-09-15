/**
 * Currency registry + FX abstraction.
 *
 * Rates below are a static reference table (base EUR). `FxProvider` is the
 * integration boundary: swap `StaticFxProvider` for a live provider (ECB,
 * OpenExchangeRates, …) without touching callers.
 */
export const CURRENCIES = {
  EUR: { code: "EUR", symbol: "€", name: "Euro", decimals: 2 },
  USD: { code: "USD", symbol: "$", name: "US Dollar", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", decimals: 2 },
  RUB: { code: "RUB", symbol: "₽", name: "Russian Ruble", decimals: 0 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", decimals: 2 },
  PLN: { code: "PLN", symbol: "zł", name: "Polish Złoty", decimals: 2 },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", decimals: 2 },
  KZT: { code: "KZT", symbol: "₸", name: "Kazakhstani Tenge", decimals: 0 },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira", decimals: 0 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

/** Units of currency per 1 EUR. */
const EUR_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.09,
  GBP: 0.85,
  RUB: 101.5,
  CHF: 0.94,
  PLN: 4.28,
  AED: 4.0,
  KZT: 525,
  TRY: 44.5,
};

export interface FxProvider {
  /** Returns how many `to` units one `from` unit buys. */
  rate(from: CurrencyCode, to: CurrencyCode): number;
}

export class StaticFxProvider implements FxProvider {
  rate(from: CurrencyCode, to: CurrencyCode): number {
    if (from === to) return 1;
    return EUR_RATES[to] / EUR_RATES[from];
  }
}

let fx: FxProvider = new StaticFxProvider();
export function getFx(): FxProvider {
  return fx;
}
export function setFxProvider(p: FxProvider) {
  fx = p;
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  return amount * getFx().rate(from, to);
}

/** Round to a "human" market price: nearest 5 under 500, nearest 10 above. */
export function roundMarketPrice(v: number, currency: CurrencyCode = "EUR"): number {
  const inEur = convert(v, currency, "EUR");
  let step: number;
  if (inEur < 50) step = 1;
  else if (inEur < 300) step = 5;
  else if (inEur < 2000) step = 10;
  else step = 25;
  const stepLocal = convert(step, "EUR", currency);
  const magnitude = Math.pow(10, Math.floor(Math.log10(stepLocal)));
  const niceStep = Math.max(1, Math.round(stepLocal / magnitude) * magnitude);
  return Math.round(v / niceStep) * niceStep;
}
