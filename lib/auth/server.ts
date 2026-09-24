import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";
import { env } from "@/lib/env";

import { createProfileForUser } from "./create-profile";
import { sendPasswordResetEmail } from "./email";
import { SIGNUP_COOKIE } from "./signup-cookie";
import { parseSignupDetails, readCookie } from "./signup-details";

/**
 * Better Auth: email + password, Google, and password reset.
 *
 * Account linking matches a verified Google email onto an existing account.
 * Signup details (name, birthday, timezone) travel in a short-lived cookie
 * because they belong on `profiles`, not on Better Auth's user table.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.BETTER_AUTH_URL],
  session: {
    // A persistent cookie, so closing the browser does not sign them out.
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user, context) => {
          const details = parseSignupDetails(
            readCookie(context?.request?.headers.get("cookie"), SIGNUP_COOKIE),
          );
          await createProfileForUser(user.id, user.name, details);
        },
      },
    },
  },
  plugins: [nextCookies()],
});
