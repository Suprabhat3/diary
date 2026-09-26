"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { clearEntryAction, deleteEntryAction, saveEntryAction } from "@/lib/actions/entries";
import { EMPTY_DOC, countWords, type DiaryDoc } from "@/lib/editor/document";
import { MOODS, MOOD_LABELS, type Mood } from "@/lib/editor/moods";
import type { EditorInitial, SavedEntry } from "@/lib/editor/types";

type Status = "idle" | "saving" | "saved" | "error" | "offline" | "conflict";

export function DiaryEditor({
  entryDate,
  prompt,
  initial,
  onDone,
  onRemoved,
}: {
  entryDate: string;
  prompt: string;
  initial: EditorInitial;
  onDone?: () => void;
  onRemoved?: () => void;
}) {
  const router = useRouter();
  const [mood, setMood] = useState<Mood | null>(initial.mood);
  const [status, setStatus] = useState<Status>("idle");
  const [wordCount, setWordCount] = useState(initial.wordCount);
  const [conflict, setConflict] = useState<SavedEntry | null | "missing">(null);
  const [toolbar, setToolbar] = useState(false);
  const [pending, setPending] = useState<"clear" | "delete" | null>(null);

  const updatedAt = useRef(initial.updatedAt);
  const latest = useRef<{ body: DiaryDoc; mood: Mood | null }>({
    body: initial.bodyJson,
    mood: initial.mood,
  });
  const dirty = useRef(false);
  const running = useRef(false);
  const again = useRef(false);
  const idleTimer = useRef<number | null>(null);
  const maxTimer = useRef<number | null>(null);
  const flushRef = useRef<() => Promise<void>>(async () => {});
  const scheduleRef = useRef<() => void>(() => {});
  const blocked = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false,
        underline: false,
        dropcursor: false,
      }),
      Placeholder.configure({
        placeholder: prompt,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: initial.bodyJson,
    editorProps: {
      attributes: {
        class: "tiptap diary-prose min-h-[46vh] text-lg leading-relaxed focus:outline-none",
        "aria-label": "Diary entry",
      },
    },
    onUpdate: ({ editor: current }) => {
      latest.current.body = current.getJSON() as DiaryDoc;
      setWordCount(countWords(current.getText()));
      scheduleRef.current();
    },
  });

  function clearTimers() {
    if (idleTimer.current != null) window.clearTimeout(idleTimer.current);
    if (maxTimer.current != null) window.clearTimeout(maxTimer.current);
    idleTimer.current = null;
    maxTimer.current = null;
  }

  function schedule() {
    dirty.current = true;
    if (blocked.current) return;
    setStatus((current) => (current === "saving" ? current : "idle"));
    if (maxTimer.current == null) {
      maxTimer.current = window.setTimeout(() => void flushRef.current(), 4000);
    }
    if (idleTimer.current != null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => void flushRef.current(), 800);
  }

  async function flush() {
    clearTimers();
    if (blocked.current) return;
    if (!dirty.current && !again.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      return;
    }
    if (running.current) {
      again.current = true;
      return;
    }

    running.current = true;
    try {
      do {
        again.current = false;
        if (!dirty.current) break;
        dirty.current = false;
        setStatus("saving");
        const body = latest.current.body;
        const moodNow = latest.current.mood;
        const seen = updatedAt.current;
        const result = await saveEntryAction({
          entryDate,
          bodyJson: body,
          mood: moodNow,
          updatedAt: seen,
        });

        if (result.status === "saved") {
          updatedAt.current = result.updatedAt;
          setWordCount(result.wordCount);
          setStatus(dirty.current ? "saving" : "saved");
          continue;
        }

        dirty.current = true;
        if (result.status === "conflict") {
          blocked.current = true;
          setConflict(result.entry ?? "missing");
          setStatus("conflict");
          break;
        }
        if (result.status === "future") {
          setStatus("error");
          break;
        }
        setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
        break;
      } while (dirty.current || again.current);
    } catch {
      dirty.current = true;
      setStatus(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    } finally {
      running.current = false;
    }
  }

  useEffect(() => {
    flushRef.current = flush;
    scheduleRef.current = schedule;
  });

  useEffect(() => {
    function onLeave(event: BeforeUnloadEvent) {
      if (!dirty.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function onHide() {
      if (document.visibilityState === "hidden") void flushRef.current();
    }
    function onOnline() {
      if (dirty.current) void flushRef.current();
    }
    window.addEventListener("beforeunload", onLeave);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  useEffect(() => {
    if (status !== "saved") return;
    const id = window.setTimeout(() => setStatus("idle"), 1600);
    return () => window.clearTimeout(id);
  }, [status]);

  function chooseMood(next: Mood) {
    const value = mood === next ? null : next;
    setMood(value);
    latest.current.mood = value;
    schedule();
  }

  function applyEntry(entry: SavedEntry | null) {
    const doc = entry?.bodyJson ?? EMPTY_DOC;
    const nextMood = entry?.mood ?? null;
    editor?.commands.setContent(doc);
    latest.current = { body: doc, mood: nextMood };
    updatedAt.current = entry?.updatedAt ?? null;
    setMood(nextMood);
    setWordCount(entry?.wordCount ?? 0);
    dirty.current = false;
    blocked.current = false;
    setConflict(null);
    setStatus("idle");
  }

  async function reloadConflict() {
    const entry = conflict === "missing" ? null : conflict;
    applyEntry(entry);
    router.refresh();
  }

  async function onClear() {
    setPending("clear");
    await flush();
    const result = await clearEntryAction({ entryDate, updatedAt: updatedAt.current });
    setPending(null);
    if (result.status === "saved") {
      applyEntry(
        result.updatedAt
          ? {
              entryDate,
              bodyJson: EMPTY_DOC,
              bodyText: "",
              wordCount: 0,
              mood: null,
              updatedAt: result.updatedAt,
            }
          : null,
      );
      router.refresh();
      return;
    }
    if (result.status === "conflict") {
      blocked.current = true;
      setConflict(result.entry ?? "missing");
      setStatus("conflict");
    }
  }

  async function onDelete() {
    setPending("delete");
    const result = await deleteEntryAction({ entryDate, updatedAt: updatedAt.current });
    setPending(null);
    if (result.status === "saved") {
      applyEntry(null);
      onRemoved?.();
      router.refresh();
      return;
    }
    if (result.status === "conflict") {
      blocked.current = true;
      setConflict(result.entry ?? "missing");
      setStatus("conflict");
    }
  }

  const statusText =
    status === "saving"
      ? "Saving"
      : status === "saved"
        ? "Saved"
        : status === "offline"
          ? "Not saved — you're offline"
          : status === "error"
            ? "Not saved"
            : status === "conflict"
              ? "This page changed on another device"
              : wordCount > 0
                ? `${wordCount} ${wordCount === 1 ? "word" : "words"}`
                : "";

  return (
    <div className="mt-6 flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-ui text-sm text-ink-muted" aria-live="polite">
          {statusText}
        </p>
        <div className="flex items-center gap-2">
          {status === "error" || status === "offline" ? (
            <Button type="button" variant="outline" size="sm" className="font-ui" onClick={() => void flush()}>
              Retry
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="font-ui"
            aria-expanded={toolbar}
            onClick={() => setToolbar((open) => !open)}
          >
            {toolbar ? "Hide format" : "Format"}
          </Button>
        </div>
      </div>

      {toolbar && editor ? (
        <div className="flex flex-wrap gap-1" role="toolbar" aria-label="Formatting">
          <ToolButton label="Heading" pressed={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <ToolButton label="Small heading" pressed={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
          <ToolButton label="Bold" pressed={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
          <ToolButton label="Italic" pressed={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
          <ToolButton label="Bullets" pressed={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <ToolButton label="Numbers" pressed={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <ToolButton label="Quote" pressed={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
        </div>
      ) : null}

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Mood, optional</legend>
        {MOODS.map((item) => {
          const selected = mood === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={selected}
              onClick={() => chooseMood(item)}
              className={`min-h-11 rounded-chip px-3 font-ui text-sm ${
                selected ? "bg-brand text-brand-ink" : "bg-surface-sunken text-ink-muted"
              }`}
            >
              {MOOD_LABELS[item]}
            </button>
          );
        })}
      </fieldset>

      {status === "conflict" ? (
        <div className="rounded-card border border-line bg-surface-raised p-4">
          <p className="text-ink">This page was saved somewhere else.</p>
          <p className="mt-1 text-sm text-ink-muted">
            Reloading replaces the writing on this screen with that version.
          </p>
          <Button type="button" className="mt-3 font-ui" onClick={() => void reloadConflict()}>
            Reload page
          </Button>
        </div>
      ) : null}

      <EditorContent editor={editor} />

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {onDone ? (
          <Button
            type="button"
            className="font-ui"
            onClick={() => {
              void flush().then(() => onDone());
            }}
          >
            Done
          </Button>
        ) : null}
        <ConfirmDialog
          title="Clear this page?"
          description="The words and mood are emptied. The day stays in your diary as a blank page."
          confirmLabel="Clear page"
          pending={pending === "clear"}
          pendingLabel="Clearing…"
          onConfirm={() => void onClear()}
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
          pending={pending === "delete"}
          pendingLabel="Deleting…"
          destructive
          onConfirm={() => void onDelete()}
          trigger={
            <Button type="button" variant="ghost" className="font-ui text-danger">
              Delete
            </Button>
          }
        />
      </div>
    </div>
  );
}

function ToolButton({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-11 rounded-chip px-3 font-ui text-sm ${
        pressed ? "bg-brand text-brand-ink" : "bg-surface-sunken text-ink"
      }`}
    >
      {label}
    </button>
  );
}
