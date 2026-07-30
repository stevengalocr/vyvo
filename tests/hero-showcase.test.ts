import assert from "node:assert/strict";
import test from "node:test";
import { getHeroMotionProfile } from "../src/lib/hero/motion-profile";
import {
  advanceHeroPreview,
  clearHeroSelection,
  createHeroShowcaseState,
  getHeroKeyboardTarget,
  moveHero,
  selectHeroProduct,
} from "../src/lib/hero/showcase-state";
import type { Product } from "../src/types/product";

test("hero starts in family mode while previewing the first character", () => {
  assert.deepEqual(createHeroShowcaseState(), {
    selectedIndex: null,
    previewIndex: 0,
    direction: 1,
  });
});

test("automatic preview advances only while family is selected", () => {
  assert.deepEqual(advanceHeroPreview(createHeroShowcaseState(), 9), {
    selectedIndex: null,
    previewIndex: 1,
    direction: 1,
  });

  assert.deepEqual(
    advanceHeroPreview(
      { selectedIndex: 3, previewIndex: 3, direction: 1 },
      9,
    ),
    { selectedIndex: 3, previewIndex: 3, direction: 1 },
  );
});

test("manual selection synchronizes the stage and focus card", () => {
  assert.deepEqual(
    selectHeroProduct(createHeroShowcaseState(), 4, 9),
    { selectedIndex: 4, previewIndex: 4, direction: 1 },
  );
});

test("family mode preserves the last previewed character", () => {
  assert.deepEqual(
    clearHeroSelection({
      selectedIndex: 4,
      previewIndex: 4,
      direction: 1,
    }),
    { selectedIndex: null, previewIndex: 4, direction: 1 },
  );
});

test("arrows wrap the preview in family mode", () => {
  assert.deepEqual(
    moveHero(
      { selectedIndex: null, previewIndex: 0, direction: 1 },
      -1,
      9,
    ),
    { selectedIndex: null, previewIndex: 8, direction: -1 },
  );
});

test("arrows wrap the selected character and keep the card synchronized", () => {
  assert.deepEqual(
    moveHero({ selectedIndex: 8, previewIndex: 8, direction: 1 }, 1, 9),
    { selectedIndex: 0, previewIndex: 0, direction: 1 },
  );
});

test("keyboard navigation resolves boundaries without changing unrelated keys", () => {
  assert.equal(getHeroKeyboardTarget("Home", 4, 9), 0);
  assert.equal(getHeroKeyboardTarget("End", 4, 9), 8);
  assert.equal(getHeroKeyboardTarget("ArrowLeft", 0, 9), 8);
  assert.equal(getHeroKeyboardTarget("ArrowRight", 8, 9), 0);
  assert.equal(getHeroKeyboardTarget("Enter", 4, 9), null);
});

test("zero products leave the state stable", () => {
  const state = createHeroShowcaseState();
  assert.deepEqual(advanceHeroPreview(state, 0), state);
  assert.deepEqual(moveHero(state, 1, 0), state);
  assert.deepEqual(selectHeroProduct(state, 0, 0), state);
  assert.equal(getHeroKeyboardTarget("Home", 0, 0), null);
});

test("every VYVO accent receives a distinct motion profile", () => {
  const accents: Product["accent"][] = [
    "purple",
    "orange",
    "green",
    "white",
  ];
  const profiles = accents.map((accent) => getHeroMotionProfile(accent));

  assert.deepEqual(
    profiles.map((profile) => profile.id),
    ["signal", "rush", "ground", "graphite"],
  );
  assert.equal(new Set(profiles.map((profile) => profile.id)).size, 4);
});
