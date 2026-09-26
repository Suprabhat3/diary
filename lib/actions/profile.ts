"use server";

import { cookies, headers } from "next/headers";
import { refresh } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth/server";
import { lockTheme, unlockTheme, updateProfile } from "@/lib/data/profile";
import { getSession } from "@/lib/data/session";
import { env } from "@/lib/env";
import { HOLIDAY_CALENDARS, type HolidayCalendar } from "@/lib/db/schema";
import { themeById } from "@/lib/themes/registry";
import { WEAR_COOKIE } from "@/lib/themes/wear";

const profileSchema = z.object({
  displayName: z.string(),
  timezone: z.string(),
  birthdayMonth: z.number().int().nullable(),
  birthdayDay: z.number().int().nullable(),
  birthdayYear: z.number().int().nullable(),
  holidayCalendars: z.array(z.enum(HOLIDAY_CALENDARS)),
});

const themeIdSchema = z.string().trim().min(1);

export async function updateProfileAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to save that." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Check the form and try again." };

  const result = await updateProfile({
    ...parsed.data,
    holidayCalendars: parsed.data.holidayCalendars as HolidayCalendar[],
  });
  if (!result.ok) return result;

  try {
    await auth.api.updateUser({
      headers: await headers(),
      body: { name: parsed.data.displayName.trim() },
    });
  } catch {
    // The profile name is what greetings use. Auth name can catch up next time.
  }

  refresh();
  return { ok: true };
}

export async function wearThemeAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to save that." };

  const parsed = themeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That theme isn't available." };

  const themeId = parsed.data;
  const theme = themeById(themeId);
  if (!theme || theme.id === "paper") {
    return { ok: false, message: "That theme isn't available." };
  }

  const jar = await cookies();
  jar.set(WEAR_COOKIE, theme.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: env.NODE_ENV === "production",
  });
  refresh();
  return { ok: true };
}

export async function lockThemeAction(
  input: unknown,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to save that." };

  const parsed = themeIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "That theme isn't available." };

  const result = await lockTheme(parsed.data);
  if (!result.ok) return result;

  const jar = await cookies();
  jar.delete(WEAR_COOKIE);
  refresh();
  return { ok: true };
}

export async function unlockThemeAction(): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to save that." };

  const result = await unlockTheme();
  if (!result.ok) return result;

  const jar = await cookies();
  jar.delete(WEAR_COOKIE);
  refresh();
  return { ok: true };
}
