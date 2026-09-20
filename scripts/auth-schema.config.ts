/**
 * Schema-generation config for the Better Auth CLI.
 *
 * The CLI cannot resolve a config that imports `server-only`, which our real
 * auth module does -- so this is a deliberate, minimal mirror used ONLY to
 * regenerate `lib/db/auth-schema.ts`.
 *
 * It never runs at request time and never connects to the database. Keep the
 * PLUGIN LIST in sync with `lib/auth/server.ts`: plugins are the only option
 * that changes which tables Better Auth needs. Provider and email settings do
 * not affect the schema and are intentionally omitted.
 */
import { Pool } from "@neondatabase/serverless";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/neon-serverless";

const db = drizzle(new Pool({ connectionString: "postgresql://x:x@x/x" }));

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  plugins: [],
});
