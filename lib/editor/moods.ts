/** The six moods. The database check constraint lists the same values. */
export const MOODS = ["calm", "happy", "low", "anxious", "tired", "grateful"] as const;

export type Mood = (typeof MOODS)[number];

export const MOOD_LABELS: Record<Mood, string> = {
  calm: "Calm",
  happy: "Happy",
  low: "Low",
  anxious: "Anxious",
  tired: "Tired",
  grateful: "Grateful",
};

export function isMood(value: unknown): value is Mood {
  return typeof value === "string" && (MOODS as readonly string[]).includes(value);
}
