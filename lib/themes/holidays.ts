import { isLeapYear } from "@/lib/date/civil";

import type { CivilDate, HolidayId, ThemeProfile } from "./types";

export type HolidayCalendarId = "international" | "india";

type Holiday = {
  id: HolidayId;
  calendar: HolidayCalendarId;
  matches: (date: CivilDate) => boolean;
};

/**
 * When two enabled holidays share a civil day (Diwali has landed on
 * Halloween), the earlier entry wins.
 */
const PRIORITY: readonly HolidayId[] = [
  "diwali",
  "holi",
  "raksha-bandhan",
  "ugadi",
  "independence-day",
  "christmas",
  "halloween",
  "valentines",
  "new-years-eve",
  "new-year",
];

function fixed(
  id: HolidayId,
  calendar: HolidayCalendarId,
  month: number,
  day: number,
): Holiday {
  return {
    id,
    calendar,
    matches: (date) => date.month === month && date.day === day,
  };
}

/** Years missing from the table do not fire — the month theme shows instead. */
function lunar(
  id: HolidayId,
  calendar: HolidayCalendarId,
  byYear: Record<number, readonly [number, number]>,
): Holiday {
  return {
    id,
    calendar,
    matches: (date) => {
      const pair = byYear[date.year];
      return pair !== undefined && pair[0] === date.month && pair[1] === date.day;
    },
  };
}

/**
 * Lunar dates are the observed civil day in India.
 * Holi, Diwali, and Ugadi: 2021–2031 (timeanddate.com).
 * Raksha Bandhan: 2024–2031 (timeanddate, Wikipedia, Drik Panchang).
 * Ugadi is the India calendar's New Year (also kept as Gudi Padwa).
 */
const HOLIDAYS: readonly Holiday[] = [
  fixed("new-year", "international", 1, 1),
  fixed("valentines", "international", 2, 14),
  fixed("halloween", "international", 10, 31),
  fixed("christmas", "international", 12, 25),
  fixed("new-years-eve", "international", 12, 31),
  fixed("independence-day", "india", 8, 15),
  lunar("holi", "india", {
    2021: [3, 29],
    2022: [3, 18],
    2023: [3, 8],
    2024: [3, 25],
    2025: [3, 14],
    2026: [3, 4],
    2027: [3, 22],
    2028: [3, 11],
    2029: [3, 1],
    2030: [3, 20],
    2031: [3, 9],
  }),
  lunar("raksha-bandhan", "india", {
    2024: [8, 19],
    2025: [8, 9],
    2026: [8, 28],
    2027: [8, 17],
    2028: [8, 4],
    2029: [8, 23],
    2030: [8, 12],
    2031: [8, 2],
  }),
  lunar("diwali", "india", {
    2021: [11, 4],
    2022: [10, 24],
    2023: [11, 12],
    2024: [10, 31],
    2025: [10, 20],
    2026: [11, 8],
    2027: [10, 29],
    2028: [10, 17],
    2029: [11, 5],
    2030: [10, 26],
    2031: [11, 14],
  }),
  lunar("ugadi", "india", {
    2021: [4, 13],
    2022: [4, 2],
    2023: [3, 22],
    2024: [4, 9],
    2025: [3, 30],
    2026: [3, 19],
    2027: [4, 7],
    2028: [3, 27],
    2029: [4, 14],
    2030: [4, 3],
    2031: [3, 24],
  }),
];

export function isBirthday(profile: ThemeProfile, date: CivilDate): boolean {
  const month = profile.birthdayMonth;
  const day = profile.birthdayDay;
  if (month == null || day == null) return false;
  if (date.month === month && date.day === day) return true;

  // A 29 February birthday still arrives in non-leap years, on the 28th.
  return (
    month === 2 &&
    day === 29 &&
    date.month === 2 &&
    date.day === 28 &&
    !isLeapYear(date.year)
  );
}

export function matchingHoliday(profile: ThemeProfile, date: CivilDate): HolidayId | null {
  const enabled = new Set(profile.holidayCalendars);
  const hits = HOLIDAYS.filter(
    (holiday) => enabled.has(holiday.calendar) && holiday.matches(date),
  );
  if (hits.length === 0) return null;
  hits.sort((a, b) => PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id));
  return hits[0]?.id ?? null;
}
