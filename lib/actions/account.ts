"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { deleteAccount } from "@/lib/data/account";
import { getSession } from "@/lib/data/session";

const phraseSchema = z.object({
  phrase: z.string(),
});

export async function deleteAccountAction(
  input: unknown,
): Promise<{ ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to do that." };

  const parsed = phraseSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Type the confirmation to continue." };

  const result = await deleteAccount(parsed.data.phrase);
  if (!result.ok) return result;
  redirect("/sign-in");
}
