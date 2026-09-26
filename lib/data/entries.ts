import "server-only";

import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { refresh } from "next/cache";

import { parseIso, todayIso } from "@/lib/date/civil";
import { sanitizeDocument, type DiaryDoc } from "@/lib/editor/document";
import { isMood, type Mood } from "@/lib/editor/moods";
import type { SavedEntry, SaveResult } from "@/lib/editor/types";
import { db } from "@/lib/db";
import { entries } from "@/lib/db/schema";
import { plainSnippet } from "@/lib/search/snippet";

import { ensureProfile } from "./profile";
import { getSession } from "./session";

export type MonthMark = {
  entryDate: string;
  mood: Mood | null;
  wordCount: number;
};

export type NeighborDays = {
  previous: string | null;
  next: string | null;
};

export type SearchHit = {
  entryDate: string;
  mood: Mood | null;
  wordCount: number;
  snippet: string;
};

export type SearchQuery = {
  text: string;
  mood: Mood | null;
  from: string | null;
  to: string | null;
  sort: "newest" | "oldest";
};

type Owned = typeof entries.$inferSelect;

function view(row: Owned): SavedEntry {
  const clean = sanitizeDocument(row.bodyJson);
  return {
    entryDate: row.entryDate,
    bodyJson: clean.doc,
    bodyText: clean.text || row.bodyText,
    wordCount: row.wordCount,
    mood: isMood(row.mood) ? row.mood : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function ownerId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}

export async function getEntry(entryDate: string): Promise<SavedEntry | null> {
  const userId = await ownerId();
  if (!userId || !parseIso(entryDate)) return null;

  const row = await db.query.entries.findFirst({
    where: and(eq(entries.userId, userId), eq(entries.entryDate, entryDate)),
  });
  return row ? view(row) : null;
}

export async function listWrittenInRange(start: string, end: string): Promise<MonthMark[]> {
  const userId = await ownerId();
  if (!userId || !parseIso(start) || !parseIso(end)) return [];

  const rows = await db
    .select({
      entryDate: entries.entryDate,
      mood: entries.mood,
      wordCount: entries.wordCount,
    })
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        gte(entries.entryDate, start),
        lte(entries.entryDate, end),
        sql`${entries.wordCount} > 0`,
      ),
    );

  return rows.map((row) => ({
    entryDate: row.entryDate,
    mood: isMood(row.mood) ? row.mood : null,
    wordCount: row.wordCount,
  }));
}

export async function neighborWrittenDays(entryDate: string): Promise<NeighborDays> {
  const userId = await ownerId();
  if (!userId || !parseIso(entryDate)) return { previous: null, next: null };

  const previous = await db
    .select({ entryDate: entries.entryDate })
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        sql`${entries.entryDate} < ${entryDate}`,
        sql`${entries.wordCount} > 0`,
      ),
    )
    .orderBy(desc(entries.entryDate))
    .limit(1);

  const next = await db
    .select({ entryDate: entries.entryDate })
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        sql`${entries.entryDate} > ${entryDate}`,
        sql`${entries.wordCount} > 0`,
      ),
    )
    .orderBy(asc(entries.entryDate))
    .limit(1);

  return {
    previous: previous[0]?.entryDate ?? null,
    next: next[0]?.entryDate ?? null,
  };
}

export async function searchEntries(query: SearchQuery): Promise<SearchHit[]> {
  const userId = await ownerId();
  if (!userId) return [];

  const text = query.text.trim().slice(0, 200);
  const hasFilter = text.length > 0 || query.mood !== null || query.from !== null || query.to !== null;
  if (!hasFilter) return [];

  const filters = [eq(entries.userId, userId), sql`${entries.wordCount} > 0`];
  if (query.mood) filters.push(eq(entries.mood, query.mood));
  if (query.from) filters.push(gte(entries.entryDate, query.from));
  if (query.to) filters.push(lte(entries.entryDate, query.to));
  if (text) {
    filters.push(sql`${entries.searchVector} @@ plainto_tsquery('english', ${text})`);
  }

  const snippet = text
    ? sql<string>`ts_headline('english', ${entries.bodyText}, plainto_tsquery('english', ${text}), 'StartSel=«,StopSel=»,MaxFragments=2,MaxWords=18,MinWords=6')`
    : entries.bodyText;

  const rows = await db
    .select({
      entryDate: entries.entryDate,
      mood: entries.mood,
      wordCount: entries.wordCount,
      snippet,
    })
    .from(entries)
    .where(and(...filters))
    .orderBy(query.sort === "oldest" ? asc(entries.entryDate) : desc(entries.entryDate))
    .limit(40);

  return rows.map((row) => ({
    entryDate: row.entryDate,
    mood: isMood(row.mood) ? row.mood : null,
    wordCount: row.wordCount,
    snippet: text ? (row.snippet ?? "") : plainSnippet(row.snippet ?? ""),
  }));
}

export async function saveEntry(input: {
  entryDate: string;
  bodyJson: unknown;
  mood: Mood | null;
  updatedAt: string | null;
}): Promise<SaveResult> {
  const userId = await ownerId();
  if (!userId) return { status: "unauthenticated" };
  if (!parseIso(input.entryDate)) return { status: "invalid" };

  const profile = await ensureProfile();
  if (!profile) return { status: "invalid" };
  if (input.entryDate > todayIso(profile.timezone)) return { status: "future" };

  const clean = sanitizeDocument(input.bodyJson);
  const empty = clean.wordCount === 0 && input.mood === null;

  try {
    const result = await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(entries)
        .where(and(eq(entries.userId, userId), eq(entries.entryDate, input.entryDate)))
        .limit(1);
      const row = existing[0];

      if (input.updatedAt) {
        if (!row || row.updatedAt.toISOString() !== input.updatedAt) {
          return { status: "conflict" as const, entry: row ? view(row) : null };
        }
      } else if (row) {
        return { status: "conflict" as const, entry: view(row) };
      }

      if (!row && empty) {
        return { status: "saved" as const, updatedAt: null, wordCount: 0, crossed: false };
      }

      if (!row) {
        const inserted = await tx
          .insert(entries)
          .values({
            userId,
            entryDate: input.entryDate,
            bodyJson: clean.doc,
            bodyText: clean.text,
            wordCount: clean.wordCount,
            mood: input.mood,
          })
          .returning();
        const saved = inserted[0];
        if (!saved) return { status: "invalid" as const };
        return {
          status: "saved" as const,
          updatedAt: saved.updatedAt.toISOString(),
          wordCount: saved.wordCount,
          crossed: saved.wordCount > 0,
        };
      }

      const updated = await tx
        .update(entries)
        .set({
          bodyJson: clean.doc,
          bodyText: clean.text,
          wordCount: clean.wordCount,
          mood: input.mood,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(entries.userId, userId),
            eq(entries.id, row.id),
            eq(entries.updatedAt, row.updatedAt),
          ),
        )
        .returning();

      const saved = updated[0];
      if (!saved) {
        const latest = await tx
          .select()
          .from(entries)
          .where(and(eq(entries.userId, userId), eq(entries.entryDate, input.entryDate)))
          .limit(1);
        return { status: "conflict" as const, entry: latest[0] ? view(latest[0]) : null };
      }

      return {
        status: "saved" as const,
        updatedAt: saved.updatedAt.toISOString(),
        wordCount: saved.wordCount,
        crossed: (row.wordCount > 0) !== (saved.wordCount > 0),
      };
    });

    if (result.status === "saved" && result.crossed) refresh();
    if (result.status === "saved") {
      return { status: "saved", updatedAt: result.updatedAt, wordCount: result.wordCount };
    }
    if (result.status === "conflict") return result;
    return { status: "invalid" };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    const latest = await getEntry(input.entryDate);
    return { status: "conflict", entry: latest };
  }
}

export async function clearEntry(input: {
  entryDate: string;
  updatedAt: string | null;
}): Promise<SaveResult> {
  return saveEntry({
    entryDate: input.entryDate,
    bodyJson: { type: "doc", content: [{ type: "paragraph" }] },
    mood: null,
    updatedAt: input.updatedAt,
  });
}

export async function deleteEntry(input: {
  entryDate: string;
  updatedAt: string | null;
}): Promise<SaveResult> {
  const userId = await ownerId();
  if (!userId) return { status: "unauthenticated" };
  if (!parseIso(input.entryDate)) return { status: "invalid" };

  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select()
      .from(entries)
      .where(and(eq(entries.userId, userId), eq(entries.entryDate, input.entryDate)))
      .limit(1);
    const row = existing[0];
    if (!row) return { status: "saved" as const, updatedAt: null, wordCount: 0, crossed: false };

    if (!input.updatedAt || row.updatedAt.toISOString() !== input.updatedAt) {
      return { status: "conflict" as const, entry: view(row) };
    }

    const removed = await tx
      .delete(entries)
      .where(
        and(
          eq(entries.userId, userId),
          eq(entries.id, row.id),
          eq(entries.updatedAt, row.updatedAt),
        ),
      )
      .returning({ id: entries.id });

    if (removed.length === 0) {
      return { status: "conflict" as const, entry: view(row) };
    }

    return {
      status: "saved" as const,
      updatedAt: null,
      wordCount: 0,
      crossed: row.wordCount > 0,
    };
  });

  if (result.status === "saved" && result.crossed) refresh();
  if (result.status === "saved") {
    return { status: "saved", updatedAt: null, wordCount: 0 };
  }
  return result;
}

function isUniqueViolation(error: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    if ("code" in current && (current as { code?: string }).code === "23505") return true;
    current = "cause" in current ? (current as { cause?: unknown }).cause : null;
  }
  return false;
}

export type { DiaryDoc };
