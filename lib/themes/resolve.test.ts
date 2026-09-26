import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { themeGreeting } from "./greeting";
import { themes } from "./registry";
import { resolveMonthTheme, resolveTheme } from "./resolve";
import type { ThemeProfile } from "./types";

const css = readFileSync(new URL("./tokens.css", import.meta.url), "utf8");

function profile(overrides: Partial<ThemeProfile> = {}): ThemeProfile {
  return {
    birthdayMonth: null,
    birthdayDay: null,
    themeMode: "auto",
    lockedThemeId: null,
    holidayCalendars: [],
    ...overrides,
  };
}

describe("resolveTheme", () => {
  it("maps each month, including the boundaries", () => {
    const open = profile();
    assert.equal(resolveTheme(open, { year: 2026, month: 1, day: 1 }).id, "january");
    assert.equal(resolveTheme(open, { year: 2026, month: 1, day: 31 }).id, "january");
    assert.equal(resolveTheme(open, { year: 2026, month: 6, day: 15 }).id, "june");
    assert.equal(resolveTheme(open, { year: 2026, month: 12, day: 31 }).id, "december");
  });

  it("lets a birthday beat a holiday on the same day", () => {
    const result = resolveTheme(
      profile({
        birthdayMonth: 10,
        birthdayDay: 31,
        holidayCalendars: ["international", "india"],
      }),
      { year: 2024, month: 10, day: 31 },
    );
    assert.equal(result.id, "birthday");
  });

  it("lets a locked theme beat a birthday", () => {
    const result = resolveTheme(
      profile({
        birthdayMonth: 3,
        birthdayDay: 4,
        themeMode: "locked",
        lockedThemeId: "october",
        holidayCalendars: ["india"],
      }),
      { year: 2026, month: 3, day: 4 },
    );
    assert.equal(result.id, "october");
  });

  it("falls through when the locked id is unknown", () => {
    const result = resolveTheme(
      profile({ themeMode: "locked", lockedThemeId: "not-a-theme" }),
      { year: 2026, month: 8, day: 2 },
    );
    assert.equal(result.id, "august");
  });

  it("celebrates a 29 February birthday on the 29th in leap years only", () => {
    const leap = profile({ birthdayMonth: 2, birthdayDay: 29 });
    assert.equal(resolveTheme(leap, { year: 2028, month: 2, day: 29 }).id, "birthday");
    assert.equal(resolveTheme(leap, { year: 2028, month: 2, day: 28 }).id, "february");
    assert.equal(resolveTheme(leap, { year: 2027, month: 2, day: 28 }).id, "birthday");
    assert.equal(resolveTheme(leap, { year: 2027, month: 2, day: 27 }).id, "february");
  });

  it("ignores holidays until that calendar is enabled", () => {
    const date = { year: 2026, month: 3, day: 4 };
    assert.equal(resolveTheme(profile(), date).id, "march");
    assert.equal(
      resolveTheme(profile({ holidayCalendars: ["india"] }), date).id,
      "holi",
    );
    assert.equal(
      resolveTheme(profile({ holidayCalendars: ["international"] }), date).id,
      "march",
    );
  });

  it("prefers Diwali over Halloween when both calendars are on", () => {
    const date = { year: 2024, month: 10, day: 31 };
    assert.equal(
      resolveTheme(profile({ holidayCalendars: ["international"] }), date).id,
      "halloween",
    );
    assert.equal(
      resolveTheme(profile({ holidayCalendars: ["international", "india"] }), date).id,
      "diwali",
    );
  });

  it("uses New Year and New Year's Eve only when the international calendar is on", () => {
    const open = profile();
    const international = profile({ holidayCalendars: ["international"] });
    assert.equal(resolveTheme(open, { year: 2026, month: 1, day: 1 }).id, "january");
    assert.equal(resolveTheme(international, { year: 2026, month: 1, day: 1 }).id, "new-year");
    assert.equal(resolveTheme(international, { year: 2026, month: 12, day: 31 }).id, "new-years-eve");
  });
});

describe("resolveMonthTheme", () => {
  it("stays on the month even when that day is a holiday or a birthday", () => {
    const profileOn = profile({
      birthdayMonth: 11,
      birthdayDay: 8,
      holidayCalendars: ["india"],
    });
    const date = { year: 2026, month: 11, day: 8 };
    assert.equal(resolveTheme(profileOn, date).id, "birthday");
    assert.equal(resolveMonthTheme(profileOn, date).id, "november");
  });

  it("still lets a lock paint the whole month", () => {
    const locked = profile({ themeMode: "locked", lockedThemeId: "june" });
    assert.equal(
      resolveMonthTheme(locked, { year: 2026, month: 11, day: 8 }).id,
      "june",
    );
  });
});

describe("themeGreeting", () => {
  it("uses the occasion line, with the display name", () => {
    assert.equal(themeGreeting(themes.birthday, "Maya", 21), "Happy birthday, Maya.");
  });

  it("uses the time of day for an ordinary month", () => {
    assert.equal(
      themeGreeting(themes.october, "Maya", 18),
      "The evening comes early, Maya.",
    );
    assert.equal(themeGreeting(themes.october, "Maya", 3), "The dark is in, Maya.");
  });
});

describe("theme css", () => {
  it("has a light block and an explicit dark block for every theme", () => {
    for (const id of Object.keys(themes)) {
      assert.match(css, new RegExp(`\\[data-theme="${id}"\\]`));
      assert.match(css, new RegExp(`\\[data-theme="${id}"\\]\\[data-scheme="dark"\\]`));
      const theme = themes[id as keyof typeof themes];
      if (theme.displayFont) {
        assert.match(css, new RegExp(theme.displayFont.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      }
    }
  });
});
