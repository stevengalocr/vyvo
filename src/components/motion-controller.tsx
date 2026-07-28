"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getInitialRevealState, getRevealDelay } from "@/lib/motion";

export function MotionController() {
  const pathname = usePathname();

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    if (reducedMotion.matches) return;

    const nodes = [
      ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-reveal-state", "visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    for (const node of nodes) {
      const index = Number(node.dataset.revealIndex ?? "0");
      node.style.setProperty(
        "--reveal-delay",
        `${getRevealDelay(index)}ms`,
      );
      const state = getInitialRevealState(
        node.getBoundingClientRect().top,
        window.innerHeight,
      );
      node.setAttribute("data-reveal-state", state);
      if (state === "pending") observer.observe(node);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
