import type { DiaryDoc } from "./document";
import type { Mood } from "./moods";

/** What the writing surface last loaded or saved. `updatedAt` is the conflict token. */
export type EditorInitial = {
  bodyJson: DiaryDoc;
  mood: Mood | null;
  updatedAt: string | null;
  wordCount: number;
};

export type SavedEntry = {
  entryDate: string;
  bodyJson: DiaryDoc;
  bodyText: string;
  wordCount: number;
  mood: Mood | null;
  updatedAt: string;
};

export type SaveResult =
  | { status: "saved"; updatedAt: string | null; wordCount: number }
  | { status: "conflict"; entry: SavedEntry | null }
  | { status: "future" }
  | { status: "invalid" }
  | { status: "unauthenticated" };
