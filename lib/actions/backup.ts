"use server";

import { z } from "zod";
import { refresh } from "next/cache";

import {
  backupTooLarge,
  exportDiaryJson,
  exportDiaryMarkdown,
  importDiary,
  previewImport,
  type BackupFile,
  type ImportPreview,
} from "@/lib/data/backup";
import { getSession } from "@/lib/data/session";

export async function exportJsonAction(): Promise<BackupFile | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Sign in again to export." };
  return exportDiaryJson();
}

export async function exportMarkdownAction(): Promise<BackupFile | { error: string }> {
  const session = await getSession();
  if (!session) return { error: "Sign in again to export." };
  return exportDiaryMarkdown();
}

export async function previewImportAction(
  input: unknown,
): Promise<{ ok: true; preview: ImportPreview } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to import." };
  if (tooLarge(input)) {
    return { ok: false, message: "That file is too large to import." };
  }
  return previewImport(input);
}

export async function importDiaryAction(
  input: unknown,
  overwrite: boolean,
): Promise<{ ok: true; written: number; skipped: number } | { ok: false; message: string }> {
  const session = await getSession();
  if (!session) return { ok: false, message: "Sign in again to import." };

  const flag = z.boolean().safeParse(overwrite);
  if (!flag.success) return { ok: false, message: "Check the form and try again." };
  if (tooLarge(input)) return { ok: false, message: "That file is too large to import." };

  const result = await importDiary(input, flag.data);
  if (result.ok) refresh();
  return result;
}

function tooLarge(input: unknown): boolean {
  try {
    return backupTooLarge(Buffer.byteLength(JSON.stringify(input), "utf8"));
  } catch {
    return true;
  }
}
