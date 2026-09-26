import { sql } from "drizzle-orm";
import {
  check,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

/** Postgres `tsvector`, used for full-text search over entry bodies. */
const tsvector = customType<{ data: string }>({
  dataType: () => "tsvector",
});

/** The six moods. Fixed by product decision; see docs/implementation-plan.md. */
export const MOODS = [
  "calm",
  "happy",
  "low",
  "anxious",
  "tired",
  "grateful",
] as const;

export type Mood = (typeof MOODS)[number];

/** The holiday calendars a user can opt into. */
export const HOLIDAY_CALENDARS = ["international", "india"] as const;

export type HolidayCalendar = (typeof HOLIDAY_CALENDARS)[number];

/**
 * Per-user settings that drive personalisation.
 *
 * Split from Better Auth's `user` table so that regenerating the auth schema
 * never touches product data.
 */
export const profiles = pgTable(
  "profiles",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),

    displayName: text("display_name").notNull(),

    // Month + day are all the birthday theme needs. Year is optional and is
    // never used to compute age.
    birthdayMonth: smallint("birthday_month"),
    birthdayDay: smallint("birthday_day"),
    birthdayYear: smallint("birthday_year"),

    // IANA zone. "Today" is derived from this on the server, never from the
    // client clock -- see D5 in the implementation plan.
    timezone: text("timezone").notNull().default("UTC"),

    themeMode: text("theme_mode").notNull().default("auto"),
    lockedThemeId: text("locked_theme_id"),

    holidayCalendars: text("holiday_calendars")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("profiles_theme_mode_chk", sql`${table.themeMode} IN ('auto', 'locked')`),
    check(
      "profiles_locked_theme_chk",
      sql`(${table.themeMode} = 'locked' AND ${table.lockedThemeId} IS NOT NULL)
          OR (${table.themeMode} = 'auto' AND ${table.lockedThemeId} IS NULL)`,
    ),
  ],
);

/**
 * One diary page per user per calendar date.
 *
 * `entryDate` is a bare SQL `date` -- a civil date in the user's timezone, with
 * no time and no zone -- so the unique constraint below is exact and cannot
 * drift across DST or travel.
 *
 * A row is created on first save, never on page open. "Written" days are those
 * with `wordCount > 0`; clearing a page empties it in place, deleting removes
 * the row, and both look identical on the calendar.
 */
export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    entryDate: date("entry_date").notNull(),

    /** Tiptap document. */
    bodyJson: jsonb("body_json").notNull(),
    /** Plain-text mirror of `bodyJson`, for search and word count. */
    bodyText: text("body_text").notNull().default(""),
    wordCount: integer("word_count").notNull().default(0),

    mood: text("mood"),

    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`to_tsvector('english', body_text)`,
    ),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // The product's core invariant: exactly one page per day.
    uniqueIndex("entries_user_date_unq").on(table.userId, table.entryDate),
    // Calendar months, and previous/next written page.
    index("entries_user_date_idx").on(table.userId, table.entryDate.desc()),
    // Full-text search (Phase 8).
    index("entries_search_idx").using("gin", table.searchVector),
    check("entries_mood_chk", sql`mood IS NULL OR mood = ANY (ARRAY['calm','happy','low','anxious','tired','grateful'])`),
    check("entries_word_count_chk", sql`word_count >= 0`),
  ],
);

export type Entry = typeof entries.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
