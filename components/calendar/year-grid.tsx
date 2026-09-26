import Link from "next/link";

import { daysInMonth, formatIso, monthName, weekdaySunday0 } from "@/lib/date/civil";
import { MONTH_IDS } from "@/lib/themes/types";

export function YearGrid({
  year,
  today,
  written,
  tintMonths,
}: {
  year: number;
  today: string;
  written: Set<string>;
  tintMonths: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {MONTH_IDS.map((id, index) => {
        const month = index + 1;
        const total = daysInMonth(year, month);
        const leading = (weekdaySunday0(year, month, 1) + 6) % 7;
        const cells = [
          ...Array.from({ length: leading }, () => null),
          ...Array.from({ length: total }, (_, day) => day + 1),
        ];
        return (
          <Link
            key={id}
            href={`/calendar?month=${year}-${String(month).padStart(2, "0")}`}
            data-theme={tintMonths ? id : undefined}
            className="rounded-card border border-line bg-surface-raised p-3 text-ink"
            aria-label={monthName(month)}
          >
            <span className="font-display text-lg">{monthName(month)}</span>
            <span className="mt-2 grid grid-cols-7 gap-0.5" aria-hidden="true">
              {cells.map((day, cell) => {
                if (!day) return <span key={`e-${cell}`} className="size-2" />;
                const iso = formatIso({ year, month, day });
                const isToday = iso === today;
                const hasWriting = written.has(iso);
                return (
                  <span
                    key={iso}
                    className={`size-2 rounded-full ${
                      hasWriting ? "bg-brand" : isToday ? "ring-1 ring-brand" : "bg-line"
                    }`}
                  />
                );
              })}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
