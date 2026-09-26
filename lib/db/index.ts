import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Neon connection pool.
 *
 * We use the WebSocket driver (`neon-serverless`) rather than the HTTP one
 * because two flows in this product need real interactive transactions:
 * importing a backup, and deleting an account. Node 22 provides a global
 * WebSocket, so no polyfill is required.
 *
 * The pool is cached on `globalThis` so Next's dev-server hot reloads do not
 * open a new pool on every edit.
 */
const globalForDb = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool =
  globalForDb.pool ?? new Pool({ connectionString: env.DATABASE_URL });

if (env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export const db = drizzle(pool, { schema });

export type Db = typeof db;
