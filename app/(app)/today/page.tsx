import { ClearSignupCookie } from "@/components/auth/clear-signup-cookie";
import { EditorSlot } from "@/components/editor/editor-slot";
import { PageFrame } from "@/components/layout/page-frame";
import { formatIso, formatLongDate, civilNow } from "@/lib/date/civil";
import { ensureProfile } from "@/lib/data/profile";
import { getEntry } from "@/lib/data/entries";
import { EMPTY_DOC } from "@/lib/editor/document";
import { getActiveTheme } from "@/lib/themes/active";
import { redirect } from "next/navigation";

export default async function TodayPage() {
  const profile = await ensureProfile();
  if (!profile) redirect("/sign-in");

  const active = await getActiveTheme();
  const today = civilNow(profile.timezone);
  const iso = formatIso(today);
  const entry = await getEntry(iso);

  return (
    <PageFrame>
      <ClearSignupCookie />
      <header>
        <p className="font-ui text-xs uppercase tracking-[0.18em] text-ink-faint">{active.theme.label}</p>
        <h1 className="mt-2 font-display text-4xl text-balance text-ink">{formatLongDate(today)}</h1>
        <p className="mt-2 text-lg text-ink-muted">{active.greeting}</p>
      </header>
      <EditorSlot
        entryDate={iso}
        prompt={active.theme.emptyPrompt}
        initial={{
          bodyJson: entry?.bodyJson ?? EMPTY_DOC,
          mood: entry?.mood ?? null,
          updatedAt: entry?.updatedAt ?? null,
          wordCount: entry?.wordCount ?? 0,
        }}
      />
    </PageFrame>
  );
}
