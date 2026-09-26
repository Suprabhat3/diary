import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { runInNewContext } from "node:vm";

type Policy = {
  shouldCache(
    request: { method: string; mode?: string },
    url: URL,
    origin: string,
  ): boolean;
};

const scope: { DiaryCachePolicy?: Policy } = {};
runInNewContext(
  readFileSync(join(process.cwd(), "public", "sw-policy.js"), "utf8"),
  { self: scope },
);
const policy = scope.DiaryCachePolicy;
assert.ok(policy);

const origin = "https://diary.example";
const cacheable = (path: string, method = "GET", mode = "cors") =>
  policy.shouldCache({ method, mode }, new URL(path, origin), origin);

describe("service worker cache policy", () => {
  it("caches only public shell assets, fonts, and theme art", () => {
    assert.equal(cacheable("/_next/static/chunks/app.js"), true);
    assert.equal(cacheable("/_next/static/media/body.woff2"), true);
    assert.equal(cacheable("/icons/192"), true);
    assert.equal(cacheable("/themes/october/bg-dark.avif"), true);
    assert.equal(cacheable("/offline"), true);
  });

  it("never caches private navigation, APIs, or writes", () => {
    assert.equal(cacheable("/today", "GET", "navigate"), false);
    assert.equal(cacheable("/day/2026-09-26", "GET", "navigate"), false);
    assert.equal(cacheable("/api/auth/session"), false);
    assert.equal(cacheable("/_next/static/chunks/app.js", "POST"), false);
    assert.equal(
      policy.shouldCache(
        { method: "GET", mode: "cors" },
        new URL("https://cdn.example/theme.avif"),
        origin,
      ),
      false,
    );
  });
});
