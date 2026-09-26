import { TZDate } from "@date-fns/tz";

import type { CivilDate } from "@/lib/themes/types";

export type CivilNow = CivilDate & { hour: number };

function isIanaTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * The civil date and hour in an IANA timezone.
 * An unknown zone falls back to UTC rather than the server's local zone.
 */
export function civilNow(timeZone: string, now = new Date()): CivilNow {
  const zone = isIanaTimezone(timeZone) ? timeZone : "UTC";
  const zoned = new TZDate(now, zone);
  return {
    year: zoned.getFullYear(),
    month: zoned.getMonth() + 1,
    day: zoned.getDate(),
    hour: zoned.getHours(),
  };
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  if (month === 4 || month === 6 || month === 9 || month === 11) return 30;
  if (month >= 1 && month <= 12) return 31;
  return 0;
}

export function formatIso(date: Pick<CivilDate, "year" | "month" | "day">): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

export function todayIso(timeZone: string, now = new Date()): string {
  return formatIso(civilNow(timeZone, now));
}

/** A real civil date, or null. February 31 and `2026-02-29` in a non-leap year fail. */
export function parseIso(value: string): CivilDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1900 || year > 2200) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function parseMonthParam(
  value: string | null | undefined,
): { year: number; month: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 1900 || year > 2200 || month < 1 || month > 12) return null;
  return { year, month };
}

/** Sunday is 0, matching `Date#getUTCDay`, and independent of the server's zone. */
export function weekdaySunday0(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const monthIndex = index - nextYear * 12;
  return { year: nextYear, month: monthIndex + 1 };
}

export function monthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? "";
}

export function formatLongDate(date: CivilDate): string {
  const weekday = WEEKDAY_NAMES[weekdaySunday0(date.year, date.month, date.day)];
  return `${weekday}, ${monthName(date.month)} ${date.day}, ${date.year}`;
}

export function formatMonthYear(year: number, month: number): string {
  return `${monthName(month)} ${year}`;
}
