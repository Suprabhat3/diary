import Link from "next/link";

import { PageFrame } from "@/components/layout/page-frame";
import { Button } from "@/components/ui/button";
import { formatLongDate, parseIso } from "@/lib/date/civil";
import { searchEntries } from "@/lib/data/entries";
import { MOODS, MOOD_LABELS, isMood } from "@/lib/editor/moods";
import { splitHighlights } from "@/lib/search/snippet";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; mood?: string; from?: string; to?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const text = (params.q ?? "").trim();
  const mood = isMood(params.mood) ? params.mood : null;
  const from = params.from && parseIso(params.from) ? params.from : null;
  const to = params.to && parseIso(params.to) ? params.to : null;
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const searching = text.length > 0 || mood !== null || from !== null || to !== null;
  const hits = searching ? await searchEntries({ text, mood, from, to, sort }) : [];

  return (
    <PageFrame>
      <h1 className="font-display text-4xl text-ink">Search</h1>
      <p className="mt-2 text-ink-muted">A word, a mood, or a stretch of days.</p>

      <form method="get" action="/search" className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 font-ui text-sm text-ink" htmlFor="q">
          Words
          <input
            id="q"
            name="q"
            defaultValue={text}
            className="h-11 rounded-card border border-line bg-surface-raised px-3 text-base text-ink"
          />
        </label>
        <label className="flex flex-col gap-1.5 font-ui text-sm text-ink" htmlFor="mood">
          Mood
          <select
            id="mood"
            name="mood"
            defaultValue={mood ?? ""}
            className="h-11 rounded-card border border-line bg-surface-raised px-3 text-ink"
          >
            <option value="">Any mood</option>
            {MOODS.map((item) => (
              <option key={item} value={item}>
                {MOOD_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 font-ui text-sm text-ink" htmlFor="from">
            From
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from ?? ""}
              className="h-11 rounded-card border border-line bg-surface-raised px-3 text-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5 font-ui text-sm text-ink" htmlFor="to">
            To
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to ?? ""}
              className="h-11 rounded-card border border-line bg-surface-raised px-3 text-ink"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 font-ui text-sm text-ink" htmlFor="sort">
          Sort
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="h-11 rounded-card border border-line bg-surface-raised px-3 text-ink"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>
        <Button type="submit" className="font-ui">
          Search
        </Button>
      </form>

      {searching ? (
        hits.length > 0 ? (
          <ol className="mt-8 flex flex-col gap-3">
            {hits.map((hit) => {
              const civil = parseIso(hit.entryDate);
              const parts = splitHighlights(hit.snippet);
              return (
                <li key={hit.entryDate}>
                  <Link
                    href={`/day/${hit.entryDate}`}
                    className="block rounded-card border border-line bg-surface-raised p-4"
                  >
                    <span className="font-display text-xl text-ink">
                      {civil ? formatLongDate(civil) : hit.entryDate}
                    </span>
                    {hit.mood ? (
                      <span className="mt-1 block font-ui text-xs uppercase tracking-wide text-ink-faint">
                        {MOOD_LABELS[hit.mood]}
                      </span>
                    ) : null}
                    <p className="mt-2 text-ink-muted">
                      {parts.map((part, index) =>
                        part.hit ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
                      )}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-8 text-ink-muted">Nothing matched.</p>
        )
      ) : (
        <p className="mt-8 text-ink-muted">Search stays quiet until you ask it something.</p>
      )}
    </PageFrame>
  );
}
