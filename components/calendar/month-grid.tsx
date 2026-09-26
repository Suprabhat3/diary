import Link from "next/link";

import { daysInMonth, formatIso, monthName, weekdaySunday0 } from "@/lib/date/civil";
import { MOOD_LABELS, type Mood } from "@/lib/editor/moods";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type DayMark = {
  mood: Mood | null;
};

export function MonthGrid({
  year,
  month,
  today,
  written,
  birthdayDay,
  holidays,
}: {
  year: number;
  month: number;
  today: string;
  written: Record<string, DayMark>;
  birthdayDay: number | null;
  holidays: { day: number; label: string }[];
}) {
  const total = daysInMonth(year, month);
  const leading = (weekdaySunday0(year, month, 1) + 6) % 7;
  const holidayByDay = new Map(holidays.map((holiday) => [holiday.day, holiday.label]));
  const cells: ({ day: number } | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => ({ day: index + 1 })),
  ];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-2" aria-hidden="true">
        {WEEKDAYS.map((label) => (
          <div key={label} className="text-center font-ui text-[0.7rem] uppercase tracking-wide text-ink-faint">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`${monthName(month)} ${year}`}>
        {cells.map((cell, index) => {
          if (!cell) return <div key={`empty-${index}`} />;
          const iso = formatIso({ year, month, day: cell.day });
          const mark = written[iso];
          const holiday = holidayByDay.get(cell.day);
          const birthday = birthdayDay === cell.day;
          const isToday = iso === today;
          const future = iso > today;
          const label = [
            `${monthName(month)} ${cell.day}, ${year}`,
            mark ? "written" : future ? "not yet" : "empty",
            mark?.mood ? MOOD_LABELS[mark.mood] : null,
            birthday ? "birthday" : null,
            holiday ?? null,
          ]
            .filter(Boolean)
            .join(", ");

          const className = [
            "relative flex min-h-11 items-center justify-center rounded-chip text-sm",
            future ? "text-ink-faint" : "text-ink",
            mark ? "bg-brand-soft" : "",
            isToday ? "ring-2 ring-brand" : "",
          ]
            .filter(Boolean)
            .join(" ");

          const inner = (
            <>
              <span>{cell.day}</span>
              {mark ? (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 size-1.5 rounded-full bg-brand"
                />
              ) : null}
              {birthday ? (
                <span aria-hidden="true" className="absolute top-1 text-[0.6rem] text-brand">
                  ✦
                </span>
              ) : null}
              {holiday && !birthday ? (
                <span aria-hidden="true" className="absolute top-1 size-1 rounded-full bg-ink-faint" />
              ) : null}
            </>
          );

          if (future) {
            return (
              <div key={iso} role="gridcell" aria-disabled="true" aria-label={label} className={className}>
                {inner}
              </div>
            );
          }

          return (
            <Link
              key={iso}
              href={isToday ? "/today" : `/day/${iso}`}
              role="gridcell"
              aria-current={isToday ? "date" : undefined}
              aria-label={label}
              className={className}
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
