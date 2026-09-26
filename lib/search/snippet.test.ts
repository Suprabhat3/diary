import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { plainSnippet, splitHighlights } from "./snippet";

describe("snippets", () => {
  it("splits headline markers without treating them as html", () => {
    assert.deepEqual(splitHighlights("a «quiet» day"), [
      { text: "a ", hit: false },
      { text: "quiet", hit: true },
      { text: " day", hit: false },
    ]);
  });

  it("shortens a plain snippet", () => {
    const snippet = plainSnippet("word ".repeat(80), 20);
    assert.ok(snippet.endsWith("…"));
    assert.ok(snippet.length <= 20);
  });
});
