import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";

import { createProfileForUser } from "@/lib/auth/create-profile";
import { SIGNUP_COOKIE } from "@/lib/auth/signup-cookie";
import { parseSignupDetails, readCookie } from "@/lib/auth/signup-details";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

import { getSession } from "./session";

/**
 * The signed-in user's profile, creating it if signup's hook did not.
 *
 * The user id is taken from the session inside this function.
 */
export const ensureProfile = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
  if (existing) return existing;

  const headerStore = await headers();
  const details = parseSignupDetails(
    readCookie(headerStore.get("cookie"), SIGNUP_COOKIE),
  );

  await createProfileForUser(session.user.id, session.user.name, details);

  return db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  });
});
