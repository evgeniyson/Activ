export const DAY_MS = 86_400_000;

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISODate(s: string): Date {
  // Accept YYYY-MM-DD or full ISO strings
  return s.length === 10 ? new Date(`${s}T00:00:00.000Z`) : new Date(s);
}

export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS);
}

export function addMonths(d: Date, months: number): Date {
  const r = new Date(d.getTime());
  r.setUTCMonth(r.getUTCMonth() + months);
  return r;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((startOfDayUTC(b).getTime() - startOfDayUTC(a).getTime()) / DAY_MS);
}

export function monthsBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (DAY_MS * 30.4375);
}

export function formatDate(d: Date | string, opts: Intl.DateTimeFormatOptions = {}): string {
  const date = typeof d === "string" ? parseISODate(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(date);
}

export function formatMonth(d: Date | string): string {
  return formatDate(d, { day: undefined, month: "long", year: "numeric" });
}

export function formatShortDate(d: Date | string): string {
  return formatDate(d, { day: "numeric", month: "short", year: undefined });
}

export function relativeTime(d: Date | string, now = new Date()): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diff = now.getTime() - date.getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function firstOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}
