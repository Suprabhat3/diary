import "server-only";

import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";

import { auth } from "@/lib/auth/server";
import { SESSION_COOKIE_CANDIDATES } from "@/lib/auth/session-cookie";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

import { DELETE_PHRASE } from "@/lib/account/phrase";

import { getSession } from "./session";

export { DELETE_PHRASE };

export async function listLinkedProviders(): Promise<string[]> {
  const session = await getSession();
  if (!session) return [];

  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  return accounts.map((account) => account.providerId);
}

/**
 * Deletes the user row. Profiles, pages, sessions, and OAuth links go with it
 * through ON DELETE CASCADE. The session cookie is cleared in the same request
 * so the proxy does not bounce a dead cookie back into the app.
 */
export async function deleteAccount(
  phrase: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to do that." };
  if (phrase !== DELETE_PHRASE) {
    return { ok: false, message: `Type “${DELETE_PHRASE}” to confirm.` };
  }

  const userId = session.user.id;

  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    const jar = await cookies();
    for (const name of SESSION_COOKIE_CANDIDATES) {
      jar.set(name, "", { path: "/", maxAge: 0 });
    }
  }

  await db.delete(user).where(eq(user.id, userId));
  return { ok: true };
}
