"use client";

import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/race";

// Anything with the class "reveal" slides into place the first time it is seen, and any
// [data-count] number counts up to its value.
export default function Reveal() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }

    const count = (el: HTMLElement) => {
      const to = Number(el.dataset.count);
      const places = Number(el.dataset.decimals ?? 0);
      const suffix = el.dataset.suffix ?? "";
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / 1500);
        el.textContent = `${(to * (1 - Math.pow(1 - p, 4))).toFixed(places)}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        // Things that arrive together come in one after another.
        let order = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          el.style.setProperty("--d", String(order++));
          el.classList.add("is-in");
          el.querySelectorAll<HTMLElement>("[data-count]").forEach(count);
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
