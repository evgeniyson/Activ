/**
 * Реестр валют + абстракция курсов.
 *
 * Курсы ниже — статическая справочная таблица (база EUR). `FxProvider` —
 * граница интеграции: подмените `StaticFxProvider` на живой источник (ЦБ РФ,
 * ECB, OpenExchangeRates) без изменения вызывающего кода.
 */
export const CURRENCIES = {
  RUB: { code: "RUB", symbol: "₽", name: "Российский рубль", decimals: 0 },
  USD: { code: "USD", symbol: "$", name: "Доллар США", decimals: 2 },
  EUR: { code: "EUR", symbol: "€", name: "Евро", decimals: 2 },
  KZT: { code: "KZT", symbol: "₸", name: "Казахстанский тенге", decimals: 0 },
  BYN: { code: "BYN", symbol: "Br", name: "Белорусский рубль", decimals: 2 },
  GBP: { code: "GBP", symbol: "£", name: "Фунт стерлингов", decimals: 2 },
  AED: { code: "AED", symbol: "AED", name: "Дирхам ОАЭ", decimals: 2 },
  TRY: { code: "TRY", symbol: "₺", name: "Турецкая лира", decimals: 0 },
  CNY: { code: "CNY", symbol: "¥", name: "Китайский юань", decimals: 2 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
export const CURRENCY_CODES = Object.keys(CURRENCIES) as CurrencyCode[];
export const DEFAULT_CURRENCY: CurrencyCode = "RUB";

export function isCurrencyCode(v: unknown): v is CurrencyCode {
  return typeof v === "string" && v in CURRENCIES;
}

/** Единиц валюты за 1 EUR. */
const EUR_RATES: Record<CurrencyCode, number> = {
  EUR: 1,
  USD: 1.09,
  RUB: 101.5,
  KZT: 525,
  BYN: 3.55,
  GBP: 0.85,
  AED: 4.0,
  TRY: 44.5,
  CNY: 7.85,
};

export interface FxProvider {
  /** Сколько единиц `to` даёт одна единица `from`. */
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

/** Округление до «человеческой» рыночной цены: шаг растёт с суммой. */
export function roundMarketPrice(v: number, currency: CurrencyCode = "RUB"): number {
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
