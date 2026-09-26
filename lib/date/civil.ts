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
