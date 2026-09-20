/**
 * Applies every migration to a throwaway in-process Postgres (PGlite) and
 * asserts the schema our code depends on actually exists.
 *
 * This runs with no credentials and no network, so a broken migration is
 * caught here rather than on someone's first connect to Neon. PGlite is a real
 * Postgres build, so generated columns, GIN indexes and CHECK constraints are
 * validated for real -- not merely parsed.
 *
 *   pnpm db:verify
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS_DIR = join(process.cwd(), "lib", "db", "migrations");

type Check = { label: string; sql: string; expect: (rows: unknown[]) => boolean };

const checks: Check[] = [
  {
    label: "one page per user per day is enforced by a unique index",
    sql: `select indexdef from pg_indexes
          where tablename = 'entries' and indexname = 'entries_user_date_unq'`,
    expect: (rows) =>
      rows.length === 1 &&
      /UNIQUE/i.test((rows[0] as { indexdef: string }).indexdef),
  },
  {
    label: "entry_date is a bare date, not a timestamp",
    sql: `select data_type from information_schema.columns
          where table_name = 'entries' and column_name = 'entry_date'`,
    expect: (rows) =>
      rows.length === 1 && (rows[0] as { data_type: string }).data_type === "date",
  },
  {
    label: "search_vector is generated and GIN-indexed",
    sql: `select i.indexdef, c.is_generated
          from pg_indexes i
          join information_schema.columns c
            on c.table_name = 'entries' and c.column_name = 'search_vector'
          where i.tablename = 'entries' and i.indexname = 'entries_search_idx'`,
    expect: (rows) =>
      rows.length === 1 &&
      /USING gin/i.test((rows[0] as { indexdef: string }).indexdef) &&
      (rows[0] as { is_generated: string }).is_generated === "ALWAYS",
  },
  {
    label: "deleting a user cascades to entries and profiles",
    sql: `select tc.table_name, rc.delete_rule
          from information_schema.table_constraints tc
          join information_schema.referential_constraints rc
            on rc.constraint_name = tc.constraint_name
          where tc.constraint_type = 'FOREIGN KEY'
            and tc.table_name in ('entries', 'profiles', 'session', 'account')`,
    expect: (rows) =>
      rows.length === 4 &&
      rows.every((r) => (r as { delete_rule: string }).delete_rule === "CASCADE"),
  },
];

async function main() {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    throw new Error(`No migrations found in ${MIGRATIONS_DIR}`);
  }

  const db = new PGlite();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    // drizzle-kit separates statements with this marker.
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) await db.exec(statement);
    }
    console.log(`  applied ${file}`);
  }

  let failed = 0;

  for (const check of checks) {
    const { rows } = await db.query(check.sql);
    const ok = check.expect(rows);
    console.log(`  ${ok ? "PASS" : "FAIL"}  ${check.label}`);
    if (!ok) failed++;
  }

  // Behavioural checks: the constraints must actually reject bad data.
  await db.exec(`insert into "user" (id, name, email, updated_at)
                 values ('u1', 'Test', 't@example.com', now())`);
  await db.exec(`insert into entries (user_id, entry_date, body_json)
                 values ('u1', '2026-09-17', '{}'::jsonb)`);

  const rejects = async (label: string, sql: string) => {
    try {
      await db.exec(sql);
      console.log(`  FAIL  ${label}`);
      failed++;
    } catch {
      console.log(`  PASS  ${label}`);
    }
  };

  await rejects(
    "a second page for the same user and date is rejected",
    `insert into entries (user_id, entry_date, body_json)
     values ('u1', '2026-09-17', '{}'::jsonb)`,
  );
  await rejects(
    "an unknown mood is rejected",
    `insert into entries (user_id, entry_date, body_json, mood)
     values ('u1', '2026-09-18', '{}'::jsonb, 'elated')`,
  );

  // And the cascade must actually cascade.
  await db.exec(`delete from "user" where id = 'u1'`);
  const { rows: left } = await db.query(`select count(*)::int as n from entries`);
  const cascaded = (left[0] as { n: number }).n === 0;
  console.log(`  ${cascaded ? "PASS" : "FAIL"}  deleting the user removed their entries`);
  if (!cascaded) failed++;

  await db.close();

  if (failed > 0) {
    console.error(`\n${failed} check(s) failed.`);
    process.exit(1);
  }
  console.log("\nSchema verified.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
