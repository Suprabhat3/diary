"use client";

import dynamic from "next/dynamic";

import type { EditorInitial } from "@/lib/editor/types";

const DiaryEditor = dynamic(
  () => import("@/components/editor/diary-editor").then((mod) => mod.DiaryEditor),
  {
    ssr: false,
    loading: () => <p className="mt-6 text-ink-muted">Opening the page…</p>,
  },
);

export function EditorSlot({
  entryDate,
  prompt,
  initial,
}: {
  entryDate: string;
  prompt: string;
  initial: EditorInitial;
}) {
  return <DiaryEditor entryDate={entryDate} prompt={prompt} initial={initial} />;
}
