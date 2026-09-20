import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import * as authSchema from "@/lib/db/auth-schema";

/**
 * Better Auth instance.
 *
 * Phase 0 wires the adapter only, so the schema can be generated and migrated.
 * Phase 1 adds Google, password reset email, and account linking.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
});
