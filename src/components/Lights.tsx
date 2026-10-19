"use client";

import { useEffect, useRef, useState } from "react";
import { getLenis, prefersReducedMotion, race, startLap } from "@/lib/race";

const STEP = 420;

// The start sequence. Five red lights come on one at a time, hold for a moment that is
// never quite the same twice, then all go out, and the page is released.
export default function Lights() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    const html = document.documentElement;
    const timers: number[] = [];
    let released = false;

    const release = (instant: boolean) => {
      if (released) return;
      released = true;
      timers.forEach((t) => window.clearTimeout(t));
      html.classList.remove("on-grid");
      html.classList.add("is-racing");
      try {
        sessionStorage.setItem("one-lap-seen", "1");
      } catch {}
      race.started = true;
      getLenis()?.start();
      startLap();
      if (instant || !root) {
        setDone(true);
        return;
      }
      root.classList.add("is-out");
      timers.push(window.setTimeout(() => setDone(true), 900));
    };

    let seen = false;
    try {
      seen = sessionStorage.getItem("one-lap-seen") === "1";
    } catch {}
    if (seen || prefersReducedMotion() || !root) {
      release(true);
      return;
    }

    html.classList.add("on-grid");
    getLenis()?.stop();
    const lamps = Array.from(root.querySelectorAll(".lights__pod"));
    lamps.forEach((lamp, i) => timers.push(window.setTimeout(() => lamp.classList.add("is-on"), 500 + i * STEP)));
    const hold = 500 + lamps.length * STEP + 350 + Math.random() * 900;
    timers.push(window.setTimeout(() => release(false), hold));

    // Anyone in a hurry can jump the start.
    const skip = () => release(false);
    window.addEventListener("pointerdown", skip);
    window.addEventListener("keydown", skip);
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      html.classList.remove("on-grid");
    };
  }, []);

  if (done) return null;

  return (
    <div ref={rootRef} className="lights" aria-hidden="true">
      <div className="lights__gantry">
        {[0, 1, 2, 3, 4].map((n) => (
          <div className="lights__pod" key={n}>
            <i />
            <i />
          </div>
        ))}
      </div>
      <p className="lights__call mono">Formation lap complete · Wait for the lights</p>
      <p className="lights__out">
        Lights out<span> and away we go</span>
      </p>
    </div>
  );
}
