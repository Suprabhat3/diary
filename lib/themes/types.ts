export const MONTH_IDS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
] as const;

export const HOLIDAY_IDS = [
  "new-year",
  "valentines",
  "halloween",
  "christmas",
  "new-years-eve",
  "holi",
  "raksha-bandhan",
  "independence-day",
  "diwali",
  "ugadi",
] as const;

export type MonthId = (typeof MONTH_IDS)[number];
export type HolidayId = (typeof HOLIDAY_IDS)[number];
export type ThemeId = MonthId | HolidayId | "birthday" | "paper";

export type ThemeMotion = "settle" | "drift" | "fade";

export type CivilDate = {
  year: number;
  month: number;
  day: number;
};

/** The slice of a profile `resolveTheme` is allowed to see. No user id. */
export type ThemeProfile = {
  birthdayMonth: number | null;
  birthdayDay: number | null;
  themeMode: "auto" | "locked";
  lockedThemeId: string | null;
  holidayCalendars: readonly string[];
};

export type ThemeGreetings = {
  morning: string;
  afternoon: string;
  evening: string;
  night: string;
};

/**
 * What a theme is, besides the CSS block in `tokens.css`.
 * `{name}` in copy is replaced with the display name.
 */
export type ThemeManifest = {
  id: ThemeId;
  label: string;
  /** A `--font-display-*` variable from `font-names.ts`. Paper uses the body face. */
  displayFont: string | null;
  motion: ThemeMotion;
  /** Replaces the time-of-day greeting on birthday and holidays. */
  occasion: string | null;
  greetings: ThemeGreetings;
  emptyPrompt: string;
};
