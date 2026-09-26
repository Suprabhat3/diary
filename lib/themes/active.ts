import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";

import { civilNow } from "@/lib/date/civil";
import { ensureProfile } from "@/lib/data/profile";
import { getSession } from "@/lib/data/session";

import { themeGreeting } from "./greeting";
import { themes } from "./registry";
import { focusFromPath, themeForFocus } from "./shell";
import type { ThemeProfile } from "./types";
import { WEAR_COOKIE } from "./wear";

export type ActiveTheme = {
  theme: (typeof themes)[keyof typeof themes];
  greeting: string;
  name: string;
};

type ThemeContext = {
  profile: ThemeProfile | null;
  name: string;
  hour: number;
  today: { year: number; month: number; day: number };
  wearId: string | null;
};

const loadThemeContext = cache(async (): Promise<ThemeContext> => {
  const session = await getSession();
  const wearId = (await cookies()).get(WEAR_COOKIE)?.value ?? null;
  if (!session) {
    const today = civilNow("UTC");
    return { profile: null, name: "", hour: today.hour, today, wearId: null };
  }

  const profile = await ensureProfile();
  const name = profile?.displayName || session.user.name || "there";
  const today = civilNow(profile?.timezone ?? "UTC");
  if (!profile) {
    return { profile: null, name, hour: today.hour, today, wearId: null };
  }

  return {
    profile: {
      birthdayMonth: profile.birthdayMonth,
      birthdayDay: profile.birthdayDay,
      themeMode: profile.themeMode === "locked" ? "locked" : "auto",
      lockedThemeId: profile.lockedThemeId,
      holidayCalendars: profile.holidayCalendars,
    },
    name,
    hour: today.hour,
    today,
    wearId,
  };
});

function themeFrom(context: ThemeContext, focus: ReturnType<typeof focusFromPath>): ActiveTheme {
  if (!context.profile) {
    return {
      theme: themes.paper,
      greeting: context.name ? themeGreeting(themes.paper, context.name, context.hour) : "Diary",
      name: context.name,
    };
  }

  const theme = themeForFocus(context.profile, focus, context.wearId);
  return {
    theme,
    greeting: themeGreeting(theme, context.name, context.hour),
    name: context.name,
  };
}

/** Today's theme, including a locked theme or one worn for this visit. */
export const getActiveTheme = cache(async (): Promise<ActiveTheme> => {
  const context = await loadThemeContext();
  return themeFrom(context, { kind: "day", date: context.today });
});

/** Theme and greeting for a specific diary day, honoring lock and wear. */
export async function getDayTheme(date: ThemeContext["today"]): Promise<ActiveTheme> {
  const context = await loadThemeContext();
  return themeFrom(context, { kind: "day", date });
}

/**
 * The theme stamped on `<html>` for this request.
 * Calendar months dress as the month being viewed. A locked or worn theme
 * still covers the whole app.
 */
export const getRequestTheme = cache(async (): Promise<ActiveTheme> => {
  const context = await loadThemeContext();
  const headerStore = await headers();
  const pathname = headerStore.get("x-diary-path") ?? "";
  const search = headerStore.get("x-diary-search") ?? "";
  return themeFrom(context, focusFromPath(pathname, search, context.today));
});
