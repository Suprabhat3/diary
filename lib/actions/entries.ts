"use server";

import { z } from "zod";

import { clearEntry, deleteEntry, saveEntry } from "@/lib/data/entries";
import { getSession } from "@/lib/data/session";
import { isMood } from "@/lib/editor/moods";
import type { SaveResult } from "@/lib/editor/types";

const saveSchema = z.object({
  entryDate: z.string(),
  bodyJson: z.unknown(),
  mood: z.string().nullable(),
  updatedAt: z.string().min(1).nullable(),
});

const dateSchema = z.object({
  entryDate: z.string(),
  updatedAt: z.string().min(1).nullable(),
});

export async function saveEntryAction(input: unknown): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { status: "unauthenticated" };

  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };
  if (parsed.data.mood !== null && !isMood(parsed.data.mood)) return { status: "invalid" };

  return saveEntry({
    entryDate: parsed.data.entryDate,
    bodyJson: parsed.data.bodyJson,
    mood: parsed.data.mood === null ? null : parsed.data.mood,
    updatedAt: parsed.data.updatedAt,
  });
}

export async function clearEntryAction(input: unknown): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { status: "unauthenticated" };

  const parsed = dateSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };
  return clearEntry(parsed.data);
}

export async function deleteEntryAction(input: unknown): Promise<SaveResult> {
  const session = await getSession();
  if (!session) return { status: "unauthenticated" };

  const parsed = dateSchema.safeParse(input);
  if (!parsed.success) return { status: "invalid" };
  return deleteEntry(parsed.data);
}
