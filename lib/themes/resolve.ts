import { isBirthday, matchingHoliday } from "./holidays";
import { monthTheme, themeById, themes } from "./registry";
import type { CivilDate, ThemeManifest, ThemeProfile } from "./types";

/**
 * Locked theme, then birthday, then an enabled holiday, then the month.
 * Pure: the caller has already turned "now" into a civil date.
 */
export function resolveTheme(profile: ThemeProfile, date: CivilDate): ThemeManifest {
  if (profile.themeMode === "locked") {
    const locked = themeById(profile.lockedThemeId);
    if (locked) return locked;
  }

  if (isBirthday(profile, date)) return themes.birthday;

  const holiday = matchingHoliday(profile, date);
  if (holiday) return themes[holiday];

  return monthTheme(date.month);
}

/**
 * The month being looked at, unless a theme is locked.
 * Birthday and holidays belong to a single day, not the whole grid.
 */
export function resolveMonthTheme(profile: ThemeProfile, date: CivilDate): ThemeManifest {
  if (profile.themeMode === "locked") {
    const locked = themeById(profile.lockedThemeId);
    if (locked) return locked;
  }
  return monthTheme(date.month);
}
