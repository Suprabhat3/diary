import "server-only";

import { cache } from "react";

import { civilNow } from "@/lib/date/civil";
import { ensureProfile } from "@/lib/data/profile";
import { getSession } from "@/lib/data/session";

import { themeGreeting } from "./greeting";
import { themes } from "./registry";
import { resolveTheme } from "./resolve";
import type { ThemeProfile } from "./types";

export type ActiveTheme = {
  theme: (typeof themes)[keyof typeof themes];
  greeting: string;
  name: string;
};

/**
 * The theme for this request, from the signed-in profile and today's civil date.
 * Signed-out requests stay on the neutral paper theme.
 */
export const getActiveTheme = cache(async (): Promise<ActiveTheme> => {
  const session = await getSession();
  if (!session) {
    return { theme: themes.paper, greeting: "Diary", name: "" };
  }

  const profile = await ensureProfile();
  const name = profile?.displayName || session.user.name || "there";
  if (!profile) {
    return {
      theme: themes.paper,
      greeting: themeGreeting(themes.paper, name, 12),
      name,
    };
  }

  const now = civilNow(profile.timezone);
  const input: ThemeProfile = {
    birthdayMonth: profile.birthdayMonth,
    birthdayDay: profile.birthdayDay,
    themeMode: profile.themeMode === "locked" ? "locked" : "auto",
    lockedThemeId: profile.lockedThemeId,
    holidayCalendars: profile.holidayCalendars,
  };
  const theme = resolveTheme(input, now);

  return {
    theme,
    greeting: themeGreeting(theme, name, now.hour),
    name,
  };
});
