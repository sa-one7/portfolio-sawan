"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { clamp, damp, emit, prefersReducedMotion, race, scrollToTarget, setLenis } from "@/lib/race";

// Smooths the scroll and turns it into race state: how far round the lap we are, which
// chapter the car should be posing for, and how fast the page is moving.
export default function Director() {
  useEffect(() => {
    const lenis = prefersReducedMotion() ? null : new Lenis({ lerp: 0.1, autoRaf: true });
    setLenis(lenis);
    // Scrolling is held until the start lights have gone out.
    if (!race.started) lenis?.stop();

    let marks: number[] = [];

    const update = () => {
      const vh = window.innerHeight;
      const y = window.scrollY + vh * 0.5;
      const zone = vh * 0.85;
      let lap = 0;
      let chapter = 0;
      for (let i = 1; i < marks.length; i++) {
        const t = clamp((y - marks[i] + zone / 2) / zone);
        lap += t;
        if (t > 0.5) chapter = i;
      }
      race.lap = lap;
      race.chapter = chapter;
      race.progress = clamp(window.scrollY / Math.max(1, document.documentElement.scrollHeight - vh));
      emit();
    };

    const measure = () => {
      const y0 = window.scrollY;
      // Only the sections: the <html> element carries a data-chapter of its own for the CSS.
      marks = Array.from(document.querySelectorAll<HTMLElement>("main [data-chapter]")).map((el) => el.getBoundingClientRect().top + y0);
      update();
    };

    // Speed is measured every frame, so it falls back to zero when the page stops.
    let raf = 0;
    let lastY = window.scrollY;
    let lastT = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = lastT ? Math.min(now - lastT, 100) : 16.667;
      lastT = now;
      const y = window.scrollY;
      const v = ((y - lastY) / dt) * 1000;
      lastY = y;
      race.velocity += (v - race.velocity) * damp(0.2, dt);
      if (Math.abs(race.velocity) < 0.5) race.velocity = 0;
    };
    raf = requestAnimationFrame(tick);

    // In-page links glide instead of jumping.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const hash = link.getAttribute("href")!;
      if (hash.length < 2 || !document.querySelector(hash)) return;
      e.preventDefault();
      scrollToTarget(hash === "#grid" ? 0 : hash);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure);
    document.addEventListener("click", onClick);
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    measure();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      document.removeEventListener("click", onClick);
      ro.disconnect();
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
