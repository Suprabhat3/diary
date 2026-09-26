"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { clearEntryAction, deleteEntryAction } from "@/lib/actions/entries";
import type { EditorInitial } from "@/lib/editor/types";
import { useRouter } from "next/navigation";

const DiaryEditor = dynamic(
  () => import("@/components/editor/diary-editor").then((mod) => mod.DiaryEditor),
  { ssr: false, loading: () => <p className="text-ink-muted">Opening the page…</p> },
);

export function DayScreen({
  entryDate,
  prompt,
  initial,
  hasEntry,
  children,
}: {
  entryDate: string;
  prompt: string;
  initial: EditorInitial;
  hasEntry: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState<"clear" | "delete" | null>(null);
  const [gone, setGone] = useState(false);

  if (editing) {
    return (
      <DiaryEditor
        entryDate={entryDate}
        prompt={prompt}
        initial={initial}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
        onRemoved={() => {
          setGone(true);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="mt-6 flex flex-1 flex-col gap-6">
      {gone ? <p className="text-lg text-ink-muted">{prompt}</p> : children}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button type="button" className="font-ui" onClick={() => setEditing(true)}>
          Edit
        </Button>
        {hasEntry && !gone ? (
          <>
            <ConfirmDialog
              title="Clear this page?"
              description="The words and mood are emptied. The day stays in your diary as a blank page."
              confirmLabel="Clear page"
              pending={pending === "clear"}
              onConfirm={() => {
                setPending("clear");
                void clearEntryAction({ entryDate, updatedAt: initial.updatedAt }).then(() => {
                  setPending(null);
                  setGone(true);
                  router.refresh();
                });
              }}
              trigger={
                <Button type="button" variant="outline" className="font-ui">
                  Clear
                </Button>
              }
            />
            <ConfirmDialog
              title="Delete this page?"
              description="The page is removed. This can't be undone."
              confirmLabel="Delete page"
              destructive
              pending={pending === "delete"}
              onConfirm={() => {
                setPending("delete");
                void deleteEntryAction({ entryDate, updatedAt: initial.updatedAt }).then((result) => {
                  setPending(null);
                  if (result.status === "saved") {
                    setGone(true);
                    router.refresh();
                  }
                });
              }}
              trigger={
                <Button type="button" variant="ghost" className="font-ui text-danger">
                  Delete
                </Button>
              }
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
