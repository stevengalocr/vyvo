export type RevealState = "visible" | "pending";

export function getInitialRevealState(
  top: number,
  viewportHeight: number,
): RevealState {
  return top <= viewportHeight * 0.92 ? "visible" : "pending";
}

export function getRevealDelay(index: number): number {
  return Math.min(Math.max(index, 0) * 55, 220);
}
