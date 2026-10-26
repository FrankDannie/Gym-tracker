export type ISODate = string; // YYYY-MM-DD in local time

const pad = (n: number) => String(n).padStart(2, "0");

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromISO(s: ISODate): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const todayISO = (): ISODate => toISO(new Date());

export function addDays(s: ISODate, n: number): ISODate {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((fromISO(a).getTime() - fromISO(b).getTime()) / 86_400_000);
}

/** Monday = 0 … Sunday = 6 */
export function weekdayIndex(s: ISODate): number {
  return (fromISO(s).getDay() + 6) % 7;
}

export function startOfWeek(s: ISODate): ISODate {
  return addDays(s, -weekdayIndex(s));
}

export function weekDates(s: ISODate): ISODate[] {
  const start = startOfWeek(s);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatLong(s: ISODate): string {
  return fromISO(s).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
}

export function formatShort(s: ISODate): string {
  return fromISO(s).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function formatWithYear(s: ISODate): string {
  return fromISO(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
