import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  it("blocks once the window is full", () => {
    resetRateLimits();
    assert.equal(rateLimit("auth:test", 2, 60_000, 1_000), true);
    assert.equal(rateLimit("auth:test", 2, 60_000, 1_100), true);
    assert.equal(rateLimit("auth:test", 2, 60_000, 1_200), false);
    assert.equal(rateLimit("auth:test", 2, 60_000, 61_000), true);
  });
});
