"use client";

import { useEffect, useState } from "react";
import { clock, lapTime, scrollToTarget, startLap, subscribe } from "@/lib/race";

// The result board at the end of the lap: the visitor's own time down the page, sector
// by sector, and a way to go again.
export default function Finish() {
  const [result, setResult] = useState<{ time: number; sectors: number[]; marks: string[]; best: boolean } | null>(null);

  useEffect(() => {
    const sync = () => {
      setResult((was) => {
        if (!clock.finished) return null;
        if (was && was.time === clock.time) return was;
        return { time: clock.time, sectors: [...clock.sectors], marks: [...clock.marks], best: clock.best };
      });
    };
    sync();
    return subscribe(sync);
  }, []);

  const again = () => {
    scrollToTarget(0);
    // The clock restarts once the page is back on the start line.
    const wait = window.setInterval(() => {
      if (window.scrollY < 4) {
        window.clearInterval(wait);
        startLap();
      }
    }, 100);
  };

  return (
    <div className={`finish ${result ? "is-in" : ""}`} aria-live="polite">
      <div className="finish__flag" aria-hidden="true" />
      <div className="finish__body">
        <p className="mono finish__label">{result ? (result.best ? "Your lap · Personal best" : "Your lap of this page") : "Chequered flag ahead"}</p>
        <p className="finish__time">{result ? lapTime(result.time) : "-:--.---"}</p>
        <div className="finish__sectors mono">
          {[0, 1, 2].map((i) => (
            <span key={i} data-mark={result?.marks[i] ?? ""}>
              S{i + 1} {result ? (result.sectors[i] / 1000).toFixed(3) : "--.---"}
            </span>
          ))}
        </div>
      </div>
      <button type="button" className="btn" onClick={again}>
        Another lap ↺
      </button>
    </div>
  );
}
