import { z } from "zod";

export type SignupDetails = {
  displayName: string | null;
  timezone: string;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  birthdayYear: number | null;
};

const EMPTY: SignupDetails = {
  displayName: null,
  timezone: "UTC",
  birthdayMonth: null,
  birthdayDay: null,
  birthdayYear: null,
};

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const cookieSchema = z.object({
  displayName: z.string().optional(),
  timezone: z.string().optional(),
  birthdayMonth: z.number().int().nullable().optional(),
  birthdayDay: z.number().int().nullable().optional(),
  birthdayYear: z.number().int().nullable().optional(),
});

export function isIanaTimezone(value: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function normalizeDisplayName(value: string): string | null {
  const name = value.replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > 80) return null;
  return name;
}

/**
 * Month and day together, or neither. Year is optional and is never used to
 * compute age. 29 February is allowed without a year.
 */
export function normalizeBirthday(
  month: number | null | undefined,
  day: number | null | undefined,
  year: number | null | undefined,
):
  | {
      ok: true;
      birthdayMonth: number | null;
      birthdayDay: number | null;
      birthdayYear: number | null;
    }
  | { ok: false; message: string } {
  const hasMonth = month != null;
  const hasDay = day != null;
  const hasYear = year != null;

  if (!hasMonth && !hasDay && !hasYear) {
    return {
      ok: true,
      birthdayMonth: null,
      birthdayDay: null,
      birthdayYear: null,
    };
  }

  if (!hasMonth || !hasDay) {
    return { ok: false, message: "Add both a month and a day, or leave birthday blank." };
  }

  if (month < 1 || month > 12 || day < 1 || day > (DAYS_IN_MONTH[month - 1] ?? 0)) {
    return { ok: false, message: "That birthday isn't a real date." };
  }

  if (hasYear && (year < 1900 || year > new Date().getFullYear())) {
    return { ok: false, message: "Birthday year looks off. Leave it blank if you'd rather." };
  }

  return {
    ok: true,
    birthdayMonth: month,
    birthdayDay: day,
    birthdayYear: hasYear ? year : null,
  };
}

/** Accepts a tampered cookie by dropping the bad parts instead of refusing signup. */
export function parseSignupDetails(raw: string | null | undefined): SignupDetails {
  if (!raw) return EMPTY;

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return EMPTY;
  }

  const parsed = cookieSchema.safeParse(json);
  if (!parsed.success) return EMPTY;

  const birthday = normalizeBirthday(
    parsed.data.birthdayMonth,
    parsed.data.birthdayDay,
    parsed.data.birthdayYear,
  );

  const timezone = parsed.data.timezone?.trim() ?? "";

  return {
    displayName: parsed.data.displayName
      ? normalizeDisplayName(parsed.data.displayName)
      : null,
    timezone: isIanaTimezone(timezone) ? timezone : "UTC",
    birthdayMonth: birthday.ok ? birthday.birthdayMonth : null,
    birthdayDay: birthday.ok ? birthday.birthdayDay : null,
    birthdayYear: birthday.ok ? birthday.birthdayYear : null,
  };
}

export function serializeSignupDetails(details: SignupDetails): string {
  return JSON.stringify(details);
}

export function readCookie(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    const key = part.slice(0, separator).trim();
    if (key !== name) continue;
    const value = part.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return null;
}
