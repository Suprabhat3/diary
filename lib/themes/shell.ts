import { parseIso, parseMonthParam } from "@/lib/date/civil";
import type { CivilDate } from "@/lib/themes/types";

import { themeById } from "./registry";
import { resolveMonthTheme, resolveTheme } from "./resolve";
import type { ThemeManifest, ThemeProfile } from "./types";

export type ShellFocus =
  | { kind: "day"; date: CivilDate }
  | { kind: "month"; date: CivilDate };

/**
 * Locked wins everywhere. A theme worn for this visit wins next, including
 * over birthday and the month, because the person just chose it. Otherwise
 * a month grid uses the month, and a day uses birthday, holiday, then month.
 */
export function themeForFocus(
  profile: ThemeProfile,
  focus: ShellFocus,
  wearId: string | null,
): ThemeManifest {
  if (profile.themeMode === "locked") {
    const locked = themeById(profile.lockedThemeId);
    if (locked && locked.id !== "paper") return locked;
  }

  const worn = themeById(wearId);
  if (worn && worn.id !== "paper") return worn;

  if (focus.kind === "month") return resolveMonthTheme(profile, focus.date);
  return resolveTheme(profile, focus.date);
}

/** Which date the chrome should dress for. Unknown paths dress as today. */
export function focusFromPath(pathname: string, search: string, today: CivilDate): ShellFocus {
  if (pathname === "/calendar") {
    const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
    const month = parseMonthParam(params.get("month"));
    if (month) return { kind: "month", date: { year: month.year, month: month.month, day: 1 } };
    return { kind: "month", date: { year: today.year, month: today.month, day: 1 } };
  }

  const day = /^\/day\/(\d{4}-\d{2}-\d{2})$/.exec(pathname);
  if (day) {
    const parsed = parseIso(day[1] ?? "");
    if (parsed) return { kind: "day", date: parsed };
  }

  return { kind: "day", date: { year: today.year, month: today.month, day: today.day } };
}
