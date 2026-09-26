import { z } from "zod";

import { parseIso, formatLongDate } from "@/lib/date/civil";
import { sanitizeDocument, documentToMarkdown, type DiaryDoc } from "@/lib/editor/document";
import { MOOD_LABELS, isMood, type Mood } from "@/lib/editor/moods";
import { isIanaTimezone, normalizeBirthday, normalizeDisplayName } from "@/lib/auth/signup-details";
import { themeById } from "@/lib/themes/registry";

export const DIARY_FORMAT = "diary";
export const DIARY_EXPORT_VERSION = 1;
export const MAX_IMPORT_ENTRIES = 20_000;

const holidaySchema = z.enum(["international", "india"]);

const exportSchema = z.object({
  format: z.literal(DIARY_FORMAT),
  version: z.literal(DIARY_EXPORT_VERSION),
  exportedAt: z.string().optional(),
  profile: z.object({
    displayName: z.string(),
    birthdayMonth: z.number().int().nullable(),
    birthdayDay: z.number().int().nullable(),
    birthdayYear: z.number().int().nullable(),
    timezone: z.string(),
    themeMode: z.enum(["auto", "locked"]),
    lockedThemeId: z.string().nullable(),
    holidayCalendars: z.array(holidaySchema),
  }),
  entries: z.array(
    z.object({
      entryDate: z.string(),
      bodyJson: z.unknown(),
      mood: z.string().nullable().optional(),
    }),
  ),
});

export type DiaryProfileExport = {
  displayName: string;
  birthdayMonth: number | null;
  birthdayDay: number | null;
  birthdayYear: number | null;
  timezone: string;
  themeMode: "auto" | "locked";
  lockedThemeId: string | null;
  holidayCalendars: ("international" | "india")[];
};

export type ParsedImportEntry = {
  entryDate: string;
  bodyJson: DiaryDoc;
  bodyText: string;
  wordCount: number;
  mood: Mood | null;
};

export type ParsedImport = {
  profile: DiaryProfileExport;
  entries: ParsedImportEntry[];
  invalid: number;
};

export function parseDiaryExport(
  input: unknown,
): { ok: true; data: ParsedImport } | { ok: false; message: string } {
  const parsed = exportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "That file isn't a Diary backup." };
  }
  if (parsed.data.entries.length > MAX_IMPORT_ENTRIES) {
    return { ok: false, message: "That backup has more pages than this diary can take." };
  }

  const name = normalizeDisplayName(parsed.data.profile.displayName);
  if (!name) return { ok: false, message: "The backup is missing a display name." };

  if (!isIanaTimezone(parsed.data.profile.timezone)) {
    return { ok: false, message: "The backup's timezone isn't one this diary understands." };
  }

  const birthday = normalizeBirthday(
    parsed.data.profile.birthdayMonth,
    parsed.data.profile.birthdayDay,
    parsed.data.profile.birthdayYear,
  );
  if (!birthday.ok) return { ok: false, message: birthday.message };

  let themeMode = parsed.data.profile.themeMode;
  let lockedThemeId = parsed.data.profile.lockedThemeId;
  if (themeMode === "locked") {
    const theme = themeById(lockedThemeId);
    if (!theme || theme.id === "paper") {
      themeMode = "auto";
      lockedThemeId = null;
    }
  } else {
    lockedThemeId = null;
  }

  const byDate = new Map<string, ParsedImportEntry>();
  let invalid = 0;

  for (const entry of parsed.data.entries) {
    const date = parseIso(entry.entryDate);
    if (!date) {
      invalid += 1;
      continue;
    }
    if (entry.mood != null && entry.mood !== "" && !isMood(entry.mood)) {
      invalid += 1;
      continue;
    }
    const clean = sanitizeDocument(entry.bodyJson);
    byDate.set(entry.entryDate, {
      entryDate: entry.entryDate,
      bodyJson: clean.doc,
      bodyText: clean.text,
      wordCount: clean.wordCount,
      mood: isMood(entry.mood) ? entry.mood : null,
    });
  }

  return {
    ok: true,
    data: {
      profile: {
        displayName: name,
        birthdayMonth: birthday.birthdayMonth,
        birthdayDay: birthday.birthdayDay,
        birthdayYear: birthday.birthdayYear,
        timezone: parsed.data.profile.timezone,
        themeMode,
        lockedThemeId,
        holidayCalendars: [...new Set(parsed.data.profile.holidayCalendars)],
      },
      entries: [...byDate.values()].sort((a, b) => a.entryDate.localeCompare(b.entryDate)),
      invalid,
    },
  };
}

export function entryToMarkdown(entry: {
  entryDate: string;
  mood: Mood | null;
  bodyText: string;
  bodyJson: DiaryDoc;
}): string {
  const date = parseIso(entry.entryDate);
  const title = date ? formatLongDate(date) : entry.entryDate;
  const mood = entry.mood ? `Mood: ${MOOD_LABELS[entry.mood]}\n\n` : "";
  const body = documentToMarkdown(entry.bodyJson) || entry.bodyText;
  return `# ${title}\n\n${mood}${body}\n`;
}
