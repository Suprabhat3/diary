import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { civilNow } from "./civil";

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
});
