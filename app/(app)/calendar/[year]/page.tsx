import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { YearGrid } from "@/components/calendar/year-grid";
import { PageFrame } from "@/components/layout/page-frame";
import { civilNow, formatIso, todayIso } from "@/lib/date/civil";
import { listWrittenInRange } from "@/lib/data/entries";
import { ensureProfile } from "@/lib/data/profile";
import { WEAR_COOKIE } from "@/lib/themes/wear";

export default async function YearPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: raw } = await params;
  if (!/^\d{4}$/.test(raw)) notFound();
  const year = Number(raw);
  if (year < 1900 || year > 2200) notFound();

  const profile = await ensureProfile();
  if (!profile) redirect("/sign-in");

  const today = civilNow(profile.timezone);
  const marks = await listWrittenInRange(`${year}-01-01`, `${year}-12-31`);
  const wear = (await cookies()).get(WEAR_COOKIE)?.value;
  const tintMonths = profile.themeMode !== "locked" && !wear;

  return (
    <PageFrame width="wide">
      <div className="mb-5 flex items-center justify-between gap-2">
        <Link
          href={`/calendar/${year - 1}`}
          aria-label={String(year - 1)}
          className="flex size-11 items-center justify-center rounded-chip text-ink"
        >
          <ChevronLeft aria-hidden="true" />
        </Link>
        <div className="text-center">
          <h1 className="font-display text-3xl text-ink">{year}</h1>
          <Link
            href={`/calendar?month=${formatIso({ year: today.year, month: today.month, day: 1 }).slice(0, 7)}`}
            className="font-ui text-sm text-ink-muted underline-offset-4 hover:underline"
          >
            This month
          </Link>
        </div>
        <Link
          href={`/calendar/${year + 1}`}
          aria-label={String(year + 1)}
          className="flex size-11 items-center justify-center rounded-chip text-ink"
        >
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
      <YearGrid year={year} today={todayIso(profile.timezone)} written={new Set(marks.map((mark) => mark.entryDate))} tintMonths={tintMonths} />
    </PageFrame>
  );
}
