import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { focusFromPath, themeForFocus } from "./shell";
import type { ThemeProfile } from "./types";

function profile(overrides: Partial<ThemeProfile> = {}): ThemeProfile {
  return {
    birthdayMonth: 10,
    birthdayDay: 31,
    themeMode: "auto",
    lockedThemeId: null,
    holidayCalendars: ["international"],
    ...overrides,
  };
}

describe("themeForFocus", () => {
  it("dresses a calendar month as that month, not the birthday inside it", () => {
    const theme = themeForFocus(
      profile(),
      { kind: "month", date: { year: 2026, month: 10, day: 1 } },
      null,
    );
    assert.equal(theme.id, "october");
  });

  it("lets a worn theme cover the month, and a lock cover the worn theme", () => {
    const worn = themeForFocus(
      profile(),
      { kind: "month", date: { year: 2026, month: 10, day: 1 } },
      "june",
    );
    assert.equal(worn.id, "june");

    const locked = themeForFocus(
      profile({ themeMode: "locked", lockedThemeId: "january" }),
      { kind: "day", date: { year: 2026, month: 10, day: 31 } },
      "june",
    );
    assert.equal(locked.id, "january");
  });
});

describe("focusFromPath", () => {
  const today = { year: 2026, month: 9, day: 26 };

  it("reads the calendar month and a day page", () => {
    assert.deepEqual(focusFromPath("/calendar", "?month=2026-03", today), {
      kind: "month",
      date: { year: 2026, month: 3, day: 1 },
    });
    assert.deepEqual(focusFromPath("/day/2024-02-29", "", today), {
      kind: "day",
      date: { year: 2024, month: 2, day: 29 },
    });
    assert.equal(focusFromPath("/today", "", today).kind, "day");
  });

  it("uses a month focus for year calendars", () => {
    assert.deepEqual(focusFromPath("/calendar/2026", "", today), {
      kind: "month",
      date: { year: 2026, month: 9, day: 1 },
    });
    assert.deepEqual(focusFromPath("/calendar/2024", "", today), {
      kind: "month",
      date: { year: 2024, month: 1, day: 1 },
    });
  });
});
