import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";

import { createProfileForUser } from "@/lib/auth/create-profile";
import { SIGNUP_COOKIE } from "@/lib/auth/signup-cookie";
import {
  isIanaTimezone,
  normalizeBirthday,
  normalizeDisplayName,
  parseSignupDetails,
  readCookie,
} from "@/lib/auth/signup-details";
import { db } from "@/lib/db";
import { profiles, type HolidayCalendar } from "@/lib/db/schema";
import { themeById } from "@/lib/themes/registry";

import { getSession } from "./session";

/**
 * The signed-in user's profile, creating it if signup's hook did not.
 *
 * The user id is taken from the session inside this function.
 */
export const ensureProfile = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (existing) return existing;

  const headerStore = await headers();
  const details = parseSignupDetails(
    readCookie(headerStore.get("cookie"), SIGNUP_COOKIE),
  );

  await createProfileForUser(session.user.id, session.user.name, details);

  return db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
});

export async function updateProfile(input: {
  displayName: string;
  timezone: string;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  birthdayYear: number | null;
  holidayCalendars: HolidayCalendar[];
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to save that." };

  const displayName = normalizeDisplayName(input.displayName);
  if (!displayName) {
    return { ok: false, message: "Add the name you'd like to be greeted by." };
  }
  if (!isIanaTimezone(input.timezone)) {
    return { ok: false, message: "Enter a timezone like Asia/Kolkata." };
  }

  const birthday = normalizeBirthday(
    input.birthdayMonth,
    input.birthdayDay,
    input.birthdayYear,
  );
  if (!birthday.ok) return { ok: false, message: birthday.message };

  const calendars = [...new Set(input.holidayCalendars)];

  await ensureProfile();
  await db
    .update(profiles)
    .set({
      displayName,
      timezone: input.timezone,
      birthdayMonth: birthday.birthdayMonth,
      birthdayDay: birthday.birthdayDay,
      birthdayYear: birthday.birthdayYear,
      holidayCalendars: calendars,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.user.id));

  return { ok: true };
}

export async function lockTheme(
  themeId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to save that." };

  const theme = themeById(themeId);
  if (!theme || theme.id === "paper") {
    return { ok: false, message: "That theme isn't available." };
  }

  await ensureProfile();
  await db
    .update(profiles)
    .set({
      themeMode: "locked",
      lockedThemeId: theme.id,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.user.id));

  return { ok: true };
}

export async function unlockTheme(): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to save that." };

  await db
    .update(profiles)
    .set({
      themeMode: "auto",
      lockedThemeId: null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, session.user.id));

  return { ok: true };
}
