import "server-only";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

import type { SignupDetails } from "./signup-details";

/**
 * Creates the profile row for a user Better Auth just created.
 *
 * The id comes from that insert, not from the browser. A duplicate (the
 * signed-in fallback running as well) is ignored.
 */
export async function createProfileForUser(
  userId: string,
  displayName: string,
  details: SignupDetails,
) {
  const name = details.displayName || displayName.trim() || "Friend";

  await db
    .insert(profiles)
    .values({
      userId,
      displayName: name,
      timezone: details.timezone,
      birthdayMonth: details.birthdayMonth,
      birthdayDay: details.birthdayDay,
      birthdayYear: details.birthdayYear,
    })
    .onConflictDoNothing();
}
