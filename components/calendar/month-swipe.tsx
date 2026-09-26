"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, type ReactNode } from "react";

export function MonthSwipe({
  label,
  prevHref,
  nextHref,
  prevLabel,
  nextLabel,
  yearHref,
  children,
}: {
  label: string;
  prevHref: string;
  nextHref: string;
  prevLabel: string;
  nextLabel: string;
  yearHref: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      onTouchStart={(event) => {
        const touch = event.changedTouches[0];
        if (!touch) return;
        start.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(event) => {
        const origin = start.current;
        start.current = null;
        const touch = event.changedTouches[0];
        if (!origin || !touch) return;
        const dx = touch.clientX - origin.x;
        const dy = touch.clientY - origin.y;
        if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy)) return;
        router.push(dx < 0 ? nextHref : prevHref);
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <Link
          href={prevHref}
          aria-label={prevLabel}
          className="flex size-11 items-center justify-center rounded-chip text-ink"
        >
          <ChevronLeft aria-hidden="true" />
        </Link>
        <div className="text-center">
          <h1 className="font-display text-3xl text-ink">{label}</h1>
          <Link href={yearHref} className="font-ui text-sm text-ink-muted underline-offset-4 hover:underline">
            Year
          </Link>
        </div>
        <Link
          href={nextHref}
          aria-label={nextLabel}
          className="flex size-11 items-center justify-center rounded-chip text-ink"
        >
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>
      {children}
    </div>
  );
}
