import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { countWords, documentToMarkdown, sanitizeDocument } from "./document";
import { MOODS } from "./moods";

describe("sanitizeDocument", () => {
  it("keeps the allowed marks and drops a link down to text", () => {
    const clean = sanitizeDocument({
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello ", marks: [{ type: "bold" }, { type: "link", attrs: { href: "https://example.com" } }] },
            { type: "text", text: "there", marks: [{ type: "italic" }] },
          ],
        },
      ],
    });

    assert.equal(clean.text, "Hello there");
    assert.equal(clean.wordCount, 2);
    assert.deepEqual(clean.doc.content[0], {
      type: "paragraph",
      content: [
        { type: "text", text: "Hello ", marks: [{ type: "bold" }] },
        { type: "text", text: "there", marks: [{ type: "italic" }] },
      ],
    });
  });

  it("turns a disallowed block into its text", () => {
    const clean = sanitizeDocument({
      type: "doc",
      content: [{ type: "codeBlock", content: [{ type: "text", text: "secret()" }] }],
    });
    assert.equal(clean.text, "secret()");
    assert.equal(documentToMarkdown(clean.doc), "secret()");
  });

  it("counts words and writes markdown headings", () => {
    const clean = sanitizeDocument({
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Morning" }] },
        { type: "paragraph" },
      ],
    });
    assert.equal(countWords("  one   two  "), 2);
    assert.equal(documentToMarkdown(clean.doc), "## Morning");
  });
});

describe("moods", () => {
  it("matches the database check constraint", () => {
    const schema = readFileSync(new URL("../db/app-schema.ts", import.meta.url), "utf8");
    for (const mood of MOODS) assert.match(schema, new RegExp(`'${mood}'`));
  });
});
