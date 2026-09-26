import { MonthGrid } from "@/components/calendar/month-grid";
import { MonthSwipe } from "@/components/calendar/month-swipe";
import { PageFrame } from "@/components/layout/page-frame";
import {
  civilNow,
  daysInMonth,
  formatIso,
  formatMonthYear,
  monthName,
  parseMonthParam,
  shiftMonth,
  todayIso,
} from "@/lib/date/civil";
import { listWrittenInRange } from "@/lib/data/entries";
import { ensureProfile } from "@/lib/data/profile";
import { birthdayDayInMonth, holidayMarksInMonth } from "@/lib/themes/holidays";
import { themes } from "@/lib/themes/registry";
import type { ThemeProfile } from "@/lib/themes/types";
import { redirect } from "next/navigation";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const profile = await ensureProfile();
  if (!profile) redirect("/sign-in");

  const today = civilNow(profile.timezone);
  const requested = parseMonthParam((await searchParams).month);
  const viewed = requested ?? { year: today.year, month: today.month };
  const previous = shiftMonth(viewed.year, viewed.month, -1);
  const next = shiftMonth(viewed.year, viewed.month, 1);
  const start = formatIso({ year: viewed.year, month: viewed.month, day: 1 });
  const end = formatIso({
    year: viewed.year,
    month: viewed.month,
    day: daysInMonth(viewed.year, viewed.month),
  });
  const marks = await listWrittenInRange(start, end);
  const written = Object.fromEntries(marks.map((mark) => [mark.entryDate, { mood: mark.mood }]));

  const themeProfile: ThemeProfile = {
    birthdayMonth: profile.birthdayMonth,
    birthdayDay: profile.birthdayDay,
    themeMode: profile.themeMode === "locked" ? "locked" : "auto",
    lockedThemeId: profile.lockedThemeId,
    holidayCalendars: profile.holidayCalendars,
  };
  const holidays = holidayMarksInMonth(themeProfile, viewed.year, viewed.month).map((mark) => ({
    day: mark.day,
    label: themes[mark.id].label,
  }));

  const monthParam = (year: number, month: number) =>
    `/calendar?month=${year}-${String(month).padStart(2, "0")}`;

  return (
    <PageFrame>
      <MonthSwipe
        label={formatMonthYear(viewed.year, viewed.month)}
        prevHref={monthParam(previous.year, previous.month)}
        nextHref={monthParam(next.year, next.month)}
        prevLabel={monthName(previous.month)}
        nextLabel={monthName(next.month)}
        yearHref={`/calendar/${viewed.year}`}
      >
        <MonthGrid
          year={viewed.year}
          month={viewed.month}
          today={todayIso(profile.timezone)}
          written={written}
          birthdayDay={birthdayDayInMonth(themeProfile, viewed.year, viewed.month)}
          holidays={holidays}
        />
      </MonthSwipe>
    </PageFrame>
  );
}
