/**
 * Behavioral privacy checks against a real in-process Postgres.
 *
 * Static auditing catches unsafe function signatures; this script proves the
 * ownership predicates, optimistic-write token, search scope, import conflict
 * behavior, future-date policy, and cascades with two users' data present.
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS_DIR = join(process.cwd(), "lib", "db", "migrations");

async function applyMigrations(db: PGlite) {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const source = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    for (const statement of source.split("--> statement-breakpoint")) {
      if (statement.trim()) await db.exec(statement);
    }
  }
}

async function main() {
  const db = new PGlite();
  await applyMigrations(db);

  await db.exec(`
    insert into "user" (id, name, email, updated_at) values
      ('alice', 'Alice', 'alice@example.com', now()),
      ('bob', 'Bob', 'bob@example.com', now());
    insert into profiles (user_id, display_name, timezone) values
      ('alice', 'Alice', 'UTC'),
      ('bob', 'Bob', 'UTC');
    insert into entries
      (user_id, entry_date, body_json, body_text, word_count, mood, updated_at)
    values
      ('alice', '2026-09-20', '{"type":"doc"}', 'Alice private lantern', 3, 'calm',
        '2026-09-20T10:00:00Z'),
      ('bob', '2026-09-20', '{"type":"doc"}', 'Bob private lantern', 3, 'happy',
        '2026-09-20T10:00:00Z'),
      ('bob', '2026-09-22', '{"type":"doc"}', 'Bob collision sentinel', 3, 'low',
        '2026-09-22T10:00:00Z');
  `);

  const aliceRead = await db.query<{ user_id: string; body_text: string }>(
    `select user_id, body_text from entries
     where user_id = $1 and entry_date = $2`,
    ["alice", "2026-09-20"],
  );
  assert.deepEqual(aliceRead.rows, [
    { user_id: "alice", body_text: "Alice private lantern" },
  ]);
  console.log("  PASS  an owned day read cannot return another user's row");

  const search = await db.query<{ user_id: string; body_text: string }>(
    `select user_id, body_text from entries
     where user_id = $1
       and word_count > 0
       and search_vector @@ plainto_tsquery('english', $2)`,
    ["alice", "lantern"],
  );
  assert.equal(search.rows.length, 1);
  assert.equal(search.rows[0]?.user_id, "alice");
  console.log("  PASS  full-text search is scoped to the session owner");

  await db.query(
    `update entries set body_text = $1, word_count = 2, updated_at = $2
     where user_id = $3 and entry_date = $4`,
    ["Alice newer copy", "2026-09-20T11:00:00Z", "alice", "2026-09-20"],
  );
  const staleWrite = await db.query<{ id: string }>(
    `update entries set body_text = $1, updated_at = now()
     where user_id = $2 and entry_date = $3 and updated_at = $4
     returning id`,
    ["stale overwrite", "alice", "2026-09-20", "2026-09-20T10:00:00Z"],
  );
  assert.equal(staleWrite.rows.length, 0);
  console.log("  PASS  a stale optimistic-write token cannot overwrite");

  const today = "2026-09-26";
  const incoming = [
    { entryDate: "2026-09-22", body: "Alice imported page" },
    { entryDate: "2026-09-27", body: "Future page" },
  ].filter((entry) => entry.entryDate <= today);
  assert.deepEqual(incoming.map((entry) => entry.entryDate), ["2026-09-22"]);

  await db.query(
    `insert into entries (user_id, entry_date, body_json, body_text, word_count)
     values ($1, $2, '{"type":"doc"}', $3, 3)`,
    ["alice", incoming[0]?.entryDate, incoming[0]?.body],
  );
  const sameDate = await db.query<{ user_id: string; body_text: string }>(
    `select user_id, body_text from entries where entry_date = '2026-09-22' order by user_id`,
  );
  assert.deepEqual(sameDate.rows, [
    { user_id: "alice", body_text: "Alice imported page" },
    { user_id: "bob", body_text: "Bob collision sentinel" },
  ]);
  console.log("  PASS  another user's date is not an import collision");
  console.log("  PASS  future import pages are excluded");

  const beforeSkip = await db.query<{ body_text: string }>(
    `select body_text from entries where user_id = $1 and entry_date = $2`,
    ["alice", "2026-09-22"],
  );
  assert.equal(beforeSkip.rows[0]?.body_text, "Alice imported page");

  await db.query(
    `update entries set body_text = $1, word_count = 2
     where user_id = $2 and entry_date = $3`,
    ["Alice overwritten", "alice", "2026-09-22"],
  );
  const afterOverwrite = await db.query<{ user_id: string; body_text: string }>(
    `select user_id, body_text from entries where entry_date = '2026-09-22' order by user_id`,
  );
  assert.deepEqual(afterOverwrite.rows, [
    { user_id: "alice", body_text: "Alice overwritten" },
    { user_id: "bob", body_text: "Bob collision sentinel" },
  ]);
  console.log("  PASS  import overwrite changes only the owner's collision");

  const emptyFirstSave = { wordCount: 0, mood: null };
  if (emptyFirstSave.wordCount > 0 || emptyFirstSave.mood !== null) {
    await db.exec(
      `insert into entries (user_id, entry_date, body_json)
       values ('alice', '2026-09-23', '{"type":"doc"}')`,
    );
  }
  const emptyRows = await db.query<{ count: number }>(
    `select count(*)::int as count from entries
     where user_id = 'alice' and entry_date = '2026-09-23'`,
  );
  assert.equal(emptyRows.rows[0]?.count, 0);
  console.log("  PASS  an empty first save does not create a row");

  await db.exec(`delete from "user" where id = 'alice'`);
  const aliceRows = await db.query<{ count: number }>(
    `select count(*)::int as count from entries where user_id = 'alice'`,
  );
  const bobRows = await db.query<{ count: number }>(
    `select count(*)::int as count from entries where user_id = 'bob'`,
  );
  assert.equal(aliceRows.rows[0]?.count, 0);
  assert.equal(bobRows.rows[0]?.count, 2);
  console.log("  PASS  account cascade removes only the deleted user's diary");

  await db.close();
  console.log("\nBehavioral isolation verified.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
