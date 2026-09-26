import "server-only";

import { and, asc, eq } from "drizzle-orm";
import JSZip from "jszip";

import {
  DIARY_EXPORT_VERSION,
  DIARY_FORMAT,
  entryToMarkdown,
  parseDiaryExport,
  type ParsedImport,
} from "@/lib/backup/format";
import { todayIso } from "@/lib/date/civil";
import { sanitizeDocument } from "@/lib/editor/document";
import { isMood } from "@/lib/editor/moods";
import { db } from "@/lib/db";
import { entries, profiles } from "@/lib/db/schema";
import { rateLimit } from "@/lib/rate-limit";

import { ensureProfile } from "./profile";
import { getSession } from "./session";

export type BackupFile = {
  filename: string;
  mime: string;
  base64: string;
};

export type ImportPreview = {
  pages: number;
  collisions: number;
  future: number;
  invalid: number;
  displayName: string;
};

const MAX_BYTES = 12_000_000;

export async function exportDiaryJson(): Promise<BackupFile | { error: string }> {
  const packed = await loadExport();
  if ("error" in packed) return packed;

  const json = JSON.stringify(packed.document);
  return {
    filename: `diary-${packed.stamp}.json`,
    mime: "application/json",
    base64: Buffer.from(json, "utf8").toString("base64"),
  };
}

export async function exportDiaryMarkdown(): Promise<BackupFile | { error: string }> {
  const packed = await loadExport();
  if ("error" in packed) return packed;

  const zip = new JSZip();
  if (packed.rows.length === 0) {
    zip.file("diary/README.md", "No pages yet.\n");
  }
  for (const row of packed.rows) {
    const clean = sanitizeDocument(row.bodyJson);
    const year = row.entryDate.slice(0, 4);
    zip.file(
      `diary/${year}/${row.entryDate}.md`,
      entryToMarkdown({
        entryDate: row.entryDate,
        mood: isMood(row.mood) ? row.mood : null,
        bodyText: row.bodyText,
        bodyJson: clean.doc,
      }),
    );
  }

  const base64 = await zip.generateAsync({ type: "base64" });
  return {
    filename: `diary-${packed.stamp}.zip`,
    mime: "application/zip",
    base64,
  };
}

export async function previewImport(
  input: unknown,
): Promise<{ ok: true; preview: ImportPreview } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to import." };
  if (!(await allowImport())) {
    return { ok: false, message: "Too many imports. Wait a while and try again." };
  }

  const parsed = parseDiaryExport(input);
  if (!parsed.ok) return parsed;

  const profile = await ensureProfile();
  if (!profile) return { ok: false, message: "Your profile isn't ready yet." };

  const counts = await countImport(profile.timezone, parsed.data);
  return {
    ok: true,
    preview: {
      ...counts,
      invalid: parsed.data.invalid + counts.invalid,
      displayName: parsed.data.profile.displayName,
    },
  };
}

export async function importDiary(
  input: unknown,
  overwrite: boolean,
): Promise<{ ok: true; written: number; skipped: number } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to import." };
  if (!(await allowImport())) {
    return { ok: false, message: "Too many imports. Wait a while and try again." };
  }

  const parsed = parseDiaryExport(input);
  if (!parsed.ok) return { ok: false, message: parsed.message };

  const profile = await ensureProfile();
  if (!profile) return { ok: false, message: "Your profile isn't ready yet." };

  const today = todayIso(profile.timezone);
  const userId = session.user.id;
  const incoming = parsed.data.entries.filter((entry) => entry.entryDate <= today);

  const result = await db.transaction(async (tx) => {
    await tx
      .update(profiles)
      .set({
        displayName: parsed.data.profile.displayName,
        birthdayMonth: parsed.data.profile.birthdayMonth,
        birthdayDay: parsed.data.profile.birthdayDay,
        birthdayYear: parsed.data.profile.birthdayYear,
        timezone: parsed.data.profile.timezone,
        themeMode: parsed.data.profile.themeMode,
        lockedThemeId: parsed.data.profile.lockedThemeId,
        holidayCalendars: parsed.data.profile.holidayCalendars,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId));

    const existing = await tx
      .select({ entryDate: entries.entryDate })
      .from(entries)
      .where(eq(entries.userId, userId));
    const owned = new Set(existing.map((row) => row.entryDate));

    let written = 0;
    let skipped = 0;

    for (const entry of incoming) {
      const collision = owned.has(entry.entryDate);
      if (collision && !overwrite) {
        skipped += 1;
        continue;
      }

      if (collision) {
        await tx
          .update(entries)
          .set({
            bodyJson: entry.bodyJson,
            bodyText: entry.bodyText,
            wordCount: entry.wordCount,
            mood: entry.mood,
            updatedAt: new Date(),
          })
          .where(and(eq(entries.userId, userId), eq(entries.entryDate, entry.entryDate)));
      } else {
        await tx.insert(entries).values({
          userId,
          entryDate: entry.entryDate,
          bodyJson: entry.bodyJson,
          bodyText: entry.bodyText,
          wordCount: entry.wordCount,
          mood: entry.mood,
        });
        owned.add(entry.entryDate);
      }
      written += 1;
    }

    return { written, skipped };
  });

  return { ok: true, ...result };
}

async function loadExport(): Promise<
  | {
      stamp: string;
      document: unknown;
      rows: (typeof entries.$inferSelect)[];
    }
  | { error: string }
> {
  const session = await getSession();
  if (!session) return { error: "Sign in again to export." };

  const profile = await ensureProfile();
  if (!profile) return { error: "Your profile isn't ready yet." };

  const rows = await db
    .select()
    .from(entries)
    .where(eq(entries.userId, session.user.id))
    .orderBy(asc(entries.entryDate));

  const stamp = todayIso(profile.timezone);
  return {
    stamp,
    rows,
    document: {
      format: DIARY_FORMAT,
      version: DIARY_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      profile: {
        displayName: profile.displayName,
        birthdayMonth: profile.birthdayMonth,
        birthdayDay: profile.birthdayDay,
        birthdayYear: profile.birthdayYear,
        timezone: profile.timezone,
        themeMode: profile.themeMode === "locked" ? "locked" : "auto",
        lockedThemeId: profile.lockedThemeId,
        holidayCalendars: profile.holidayCalendars.filter(
          (calendar): calendar is "international" | "india" =>
            calendar === "international" || calendar === "india",
        ),
      },
      entries: rows.map((row) => ({
        entryDate: row.entryDate,
        bodyJson: sanitizeDocument(row.bodyJson).doc,
        mood: isMood(row.mood) ? row.mood : null,
      })),
    },
  };
}

async function countImport(
  timeZone: string,
  data: ParsedImport,
): Promise<{ pages: number; collisions: number; future: number; invalid: number }> {
  const session = await getSession();
  const today = todayIso(timeZone);
  const existing = session
    ? await db
        .select({ entryDate: entries.entryDate })
        .from(entries)
        .where(eq(entries.userId, session.user.id))
    : [];
  const owned = new Set(existing.map((row) => row.entryDate));

  let collisions = 0;
  let future = 0;
  let pages = 0;
  for (const entry of data.entries) {
    if (entry.entryDate > today) {
      future += 1;
      continue;
    }
    pages += 1;
    if (owned.has(entry.entryDate)) collisions += 1;
  }

  return { pages, collisions, future, invalid: 0 };
}

async function allowImport(): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  return rateLimit(`import:${session.user.id}`, 8, 60 * 60 * 1000);
}

export function backupTooLarge(bytes: number): boolean {
  return bytes > MAX_BYTES;
}
