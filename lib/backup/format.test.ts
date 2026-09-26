import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseDiaryExport } from "./format";

const profile = {
  displayName: "Maya",
  birthdayMonth: 2,
  birthdayDay: 29,
  birthdayYear: null,
  timezone: "Asia/Kolkata",
  themeMode: "auto" as const,
  lockedThemeId: null,
  holidayCalendars: ["india" as const],
};

describe("parseDiaryExport", () => {
  it("accepts a diary backup and keeps the last copy of a date", () => {
    const parsed = parseDiaryExport({
      format: "diary",
      version: 1,
      profile,
      entries: [
        { entryDate: "2026-09-01", bodyJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "First" }] }] }, mood: "calm" },
        { entryDate: "2026-09-01", bodyJson: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Second" }] }] }, mood: "grateful" },
      ],
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.entries.length, 1);
    assert.equal(parsed.data.entries[0]?.bodyText, "Second");
    assert.equal(parsed.data.entries[0]?.mood, "grateful");
  });

  it("refuses a file that is not ours", () => {
    const parsed = parseDiaryExport({ format: "notes", version: 1 });
    assert.equal(parsed.ok, false);
  });

  it("skips a page with an unknown mood", () => {
    const parsed = parseDiaryExport({
      format: "diary",
      version: 1,
      profile,
      entries: [{ entryDate: "2026-09-02", bodyJson: { type: "doc", content: [] }, mood: "ecstatic" }],
    });
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.data.entries.length, 0);
    assert.equal(parsed.data.invalid, 1);
  });
});
