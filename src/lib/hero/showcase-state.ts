export type HeroDirection = -1 | 1;

export type HeroShowcaseState = {
  selectedIndex: number | null;
  previewIndex: number;
  direction: HeroDirection;
};

export function createHeroShowcaseState(): HeroShowcaseState {
  return {
    selectedIndex: null,
    previewIndex: 0,
    direction: 1,
  };
}

function wrapIndex(index: number, productCount: number) {
  return ((index % productCount) + productCount) % productCount;
}

export function advanceHeroPreview(
  state: HeroShowcaseState,
  productCount: number,
): HeroShowcaseState {
  if (productCount <= 0 || state.selectedIndex !== null) {
    return state;
  }

  return {
    ...state,
    previewIndex: wrapIndex(state.previewIndex + 1, productCount),
    direction: 1,
  };
}

export function selectHeroProduct(
  state: HeroShowcaseState,
  index: number,
  productCount: number,
): HeroShowcaseState {
  if (productCount <= 0) {
    return state;
  }

  const selectedIndex = wrapIndex(index, productCount);
  const direction: HeroDirection =
    selectedIndex < state.previewIndex ? -1 : 1;

  return {
    selectedIndex,
    previewIndex: selectedIndex,
    direction,
  };
}

export function clearHeroSelection(
  state: HeroShowcaseState,
): HeroShowcaseState {
  return {
    ...state,
    selectedIndex: null,
  };
}

export function moveHero(
  state: HeroShowcaseState,
  direction: HeroDirection,
  productCount: number,
): HeroShowcaseState {
  if (productCount <= 0) {
    return state;
  }

  const currentIndex = state.selectedIndex ?? state.previewIndex;
  const nextIndex = wrapIndex(currentIndex + direction, productCount);

  return {
    selectedIndex: state.selectedIndex === null ? null : nextIndex,
    previewIndex: nextIndex,
    direction,
  };
}

export function getHeroKeyboardTarget(
  key: string,
  currentIndex: number,
  productCount: number,
): number | null {
  if (productCount <= 0) {
    return null;
  }

  switch (key) {
    case "ArrowLeft":
      return wrapIndex(currentIndex - 1, productCount);
    case "ArrowRight":
      return wrapIndex(currentIndex + 1, productCount);
    case "Home":
      return 0;
    case "End":
      return productCount - 1;
    default:
      return null;
  }
}
