"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getInitialRevealState, getRevealDelay } from "@/lib/motion";

export function MotionController() {
  const pathname = usePathname();

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let secondFrame = 0;

    const setup = () => {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      if (reducedMotion.matches) return;

      const nodes = [
        ...document.querySelectorAll<HTMLElement>("[data-reveal]"),
      ];
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.setAttribute("data-reveal-state", "visible");
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
      );

      // Leer y escribir por separado. Antes el bucle alternaba una escritura de
      // estilo con un getBoundingClientRect() por nodo, y cada lectura obligaba al
      // navegador a recalcular el layout que la escritura anterior acababa de
      // invalidar. Con ~20 elementos revelables eso costaba 109 ms de reflujo
      // forzado justo mientras el hero intentaba pintar.
      const viewportHeight = window.innerHeight;
      const measured = nodes.map((node) => ({
        node,
        top: node.getBoundingClientRect().top,
        index: Number(node.dataset.revealIndex ?? "0"),
      }));

      for (const { node, top, index } of measured) {
        node.style.setProperty("--reveal-delay", `${getRevealDelay(index)}ms`);
        const state = getInitialRevealState(top, viewportHeight);
        node.setAttribute("data-reveal-state", state);
        if (state === "pending") observer.observe(node);
      }
    };

    // React can hydrate nested server content after this layout-level effect.
    // Two frames keep reveal attributes out of the DOM until hydration settles.
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(setup);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
