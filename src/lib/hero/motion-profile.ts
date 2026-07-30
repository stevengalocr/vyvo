import type { Product } from "@/types/product";

export type HeroMotionProfile = {
  id: "signal" | "rush" | "ground" | "graphite";
  axis: "center" | "forward" | "grounded" | "contrast";
};

const profiles: Record<Product["accent"], HeroMotionProfile> = {
  purple: { id: "signal", axis: "center" },
  orange: { id: "rush", axis: "forward" },
  green: { id: "ground", axis: "grounded" },
  white: { id: "graphite", axis: "contrast" },
};

export function getHeroMotionProfile(
  accent: Product["accent"],
): HeroMotionProfile {
  return profiles[accent];
}
