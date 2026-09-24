import "server-only";

import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/lib/auth/server";

/**
 * The session for this request, resolved once and shared across the tree.
 *
 * `userId` for every later read and write comes from here. Callers never
 * accept it from a form, a query string, or an action argument.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});
