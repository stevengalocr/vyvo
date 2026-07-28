import assert from "node:assert/strict";
import test from "node:test";
import { getInitialRevealState, getRevealDelay } from "../src/lib/motion";

test("content already near the viewport remains visible on hydration", () => {
  assert.equal(getInitialRevealState(600, 800), "visible");
  assert.equal(getInitialRevealState(790, 800), "pending");
});

test("reveal stagger is short and capped", () => {
  assert.equal(getRevealDelay(0), 0);
  assert.equal(getRevealDelay(2), 110);
  assert.equal(getRevealDelay(12), 220);
});
