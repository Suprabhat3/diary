import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DayScreen } from "@/components/editor/day-screen";
import { EntryBody } from "@/components/editor/entry-body";
import { PageFrame } from "@/components/layout/page-frame";
import { formatLongDate, parseIso, todayIso } from "@/lib/date/civil";
import { getEntry, neighborWrittenDays } from "@/lib/data/entries";
import { ensureProfile } from "@/lib/data/profile";
import { EMPTY_DOC } from "@/lib/editor/document";
import { getActiveTheme, getDayTheme, getRequestTheme } from "@/lib/themes/active";

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const civil = parseIso(date);
  if (!civil) notFound();

  const profile = await ensureProfile();
  if (!profile) redirect("/sign-in");

  const today = todayIso(profile.timezone);
  if (date > today) {
    return (
      <PageFrame>
        <p className="font-ui text-xs uppercase tracking-[0.18em] text-ink-faint">Later</p>
        <h1 className="mt-2 font-display text-4xl text-ink">{formatLongDate(civil)}</h1>
        <p className="mt-3 text-lg text-ink-muted">This page is not open yet.</p>
        <Link href="/calendar" className="mt-6 font-ui text-sm text-brand">
          Back to the calendar
        </Link>
      </PageFrame>
    );
  }

  const entry = await getEntry(date);
  const neighbors = await neighborWrittenDays(date);
  const active = await getActiveTheme();
  const chrome = await getRequestTheme();
  const dayTheme = date === today ? active : await getDayTheme(civil);
  const occasion = date === today ? active.greeting : dayTheme.theme.occasion ? dayTheme.greeting : null;

  return (
    <PageFrame>
      <header>
        <p className="font-ui text-xs uppercase tracking-[0.18em] text-ink-faint">{chrome.theme.label}</p>
        <h1 className="mt-2 font-display text-4xl text-balance text-ink">{formatLongDate(civil)}</h1>
        {occasion ? <p className="mt-2 text-lg text-ink-muted">{occasion}</p> : null}
      </header>

      <nav aria-label="Written days" className="mt-4 flex items-center justify-between gap-3 font-ui text-sm">
        {neighbors.previous ? (
          <Link href={`/day/${neighbors.previous}`} className="text-ink">
            Previous
          </Link>
        ) : (
          <span className="text-ink-faint">Previous</span>
        )}
        <Link href={`/calendar?month=${date.slice(0, 7)}`} className="text-ink-muted">
          Calendar
        </Link>
        {neighbors.next ? (
          <Link href={`/day/${neighbors.next}`} className="text-ink">
            Next
          </Link>
        ) : (
          <span className="text-ink-faint">Next</span>
        )}
      </nav>

      <DayScreen
        key={`${date}:${entry?.updatedAt ?? "missing"}`}
        entryDate={date}
        prompt={date === today ? active.theme.emptyPrompt : "Nothing written this day."}
        hasEntry={entry !== null}
        initial={{
          bodyJson: entry?.bodyJson ?? EMPTY_DOC,
          mood: entry?.mood ?? null,
          updatedAt: entry?.updatedAt ?? null,
          wordCount: entry?.wordCount ?? 0,
        }}
      >
        {entry && entry.wordCount > 0 ? (
          <EntryBody doc={entry.bodyJson} />
        ) : (
          <p className="text-lg text-ink-muted">
            {date === today ? active.theme.emptyPrompt : "Nothing written this day."}
          </p>
        )}
      </DayScreen>
    </PageFrame>
  );
}
