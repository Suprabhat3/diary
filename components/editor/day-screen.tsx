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
  const [gone, setGone] = useState(initial.wordCount === 0 && initial.mood === null);
  const [updatedAt, setUpdatedAt] = useState(initial.updatedAt);
  const [mutationState, setMutationState] = useState<"idle" | "conflict" | "error">("idle");

  function handleMutationFailure(status: string) {
    setMutationState(status === "conflict" ? "conflict" : "error");
  }

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
      {mutationState !== "idle" ? (
        <div className="rounded-card border border-line bg-surface-raised p-4" role="alert">
          <p className="text-ink">
            {mutationState === "conflict"
              ? "This page changed on another device."
              : "The page could not be changed."}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Reload the latest version before trying again.
          </p>
          <Button
            type="button"
            className="mt-3 font-ui"
            onClick={() => {
              setMutationState("idle");
              router.refresh();
            }}
          >
            Reload page
          </Button>
        </div>
      ) : null}
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
                setMutationState("idle");
                void clearEntryAction({ entryDate, updatedAt }).then((result) => {
                  setPending(null);
                  if (result.status === "saved") {
                    setUpdatedAt(result.updatedAt);
                    setGone(true);
                    router.refresh();
                    return;
                  }
                  handleMutationFailure(result.status);
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
                setMutationState("idle");
                void deleteEntryAction({ entryDate, updatedAt }).then((result) => {
                  setPending(null);
                  if (result.status === "saved") {
                    setUpdatedAt(result.updatedAt);
                    setGone(true);
                    router.refresh();
                    return;
                  }
                  handleMutationFailure(result.status);
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
