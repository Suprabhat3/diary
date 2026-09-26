import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { civilNow, formatIso, parseIso, shiftMonth, todayIso } from "./civil";

describe("civilNow", () => {
  it("crosses midnight in Asia/Kolkata ahead of UTC", () => {
    const before = civilNow("Asia/Kolkata", new Date("2026-01-15T18:29:00Z"));
    const after = civilNow("Asia/Kolkata", new Date("2026-01-15T18:30:00Z"));
    assert.deepEqual(
      { year: before.year, month: before.month, day: before.day, hour: before.hour },
      { year: 2026, month: 1, day: 15, hour: 23 },
    );
    assert.deepEqual(
      { year: after.year, month: after.month, day: after.day, hour: after.hour },
      { year: 2026, month: 1, day: 16, hour: 0 },
    );
  });

  it("follows the date line in Pacific/Kiritimati", () => {
    const there = civilNow("Pacific/Kiritimati", new Date("2026-01-15T10:00:00Z"));
    assert.equal(there.day, 16);
    assert.equal(there.hour, 0);
  });

  it("steps across US daylight-saving start", () => {
    const before = civilNow("America/New_York", new Date("2026-03-08T06:30:00Z"));
    const after = civilNow("America/New_York", new Date("2026-03-08T07:00:00Z"));
    assert.equal(before.hour, 1);
    assert.equal(after.hour, 3);
  });

  it("uses UTC when the zone is not real", () => {
    const zoned = civilNow("Not/AZone", new Date("2026-06-01T15:00:00Z"));
    assert.equal(zoned.hour, 15);
    assert.equal(zoned.day, 1);
  });

  it("rejects dates that are not real civil days", () => {
    assert.equal(parseIso("2026-02-29"), null);
    assert.deepEqual(parseIso("2024-02-29"), { year: 2024, month: 2, day: 29 });
    assert.equal(parseIso("2026-13-01"), null);
    assert.equal(formatIso({ year: 2026, month: 9, day: 7 }), "2026-09-07");
  });

  it("shifts months across the year boundary", () => {
    assert.deepEqual(shiftMonth(2026, 1, -1), { year: 2025, month: 12 });
    assert.deepEqual(shiftMonth(2026, 12, 1), { year: 2027, month: 1 });
  });

  it("compares a future date against the user's today", () => {
    const today = todayIso("Pacific/Kiritimati", new Date("2026-01-15T10:00:00Z"));
    assert.equal(today, "2026-01-16");
    assert.equal("2026-01-17" > today, true);
    assert.equal("2026-01-16" > today, false);
  });
});
