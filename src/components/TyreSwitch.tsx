"use client";

import { useEffect, useRef, useState } from "react";
import { compounds, prefersReducedMotion, type CompoundId } from "@/lib/race";

// The theme switch. Each tyre compound is a full colour scheme, and changing it is a pit
// stop: a wipe crosses the screen with a stationary time on it while the colours swap.
export default function TyreSwitch() {
  const [compound, setCompound] = useState<CompoundId>("soft");
  const [stop, setStop] = useState<{ id: CompoundId; time: string } | null>(null);
  const busy = useRef(false);

  // The inline script in layout.tsx has already applied any saved compound before paint.
  useEffect(() => {
    const saved = document.documentElement.dataset.theme as CompoundId | undefined;
    if (saved && compounds.some((c) => c.id === saved)) setCompound(saved);
  }, []);

  const apply = (id: CompoundId) => {
    document.documentElement.dataset.theme = id;
    try {
      localStorage.setItem("one-lap-compound", id);
    } catch {}
    setCompound(id);
  };

  const fit = (id: CompoundId) => {
    if (id === compound || busy.current) return;
    if (prefersReducedMotion()) {
      apply(id);
      return;
    }
    busy.current = true;
    // A good stop is a little over two seconds. No two are the same.
    setStop({ id, time: (1.9 + Math.random() * 0.7).toFixed(1) });
    window.setTimeout(() => apply(id), 430);
    window.setTimeout(() => {
      setStop(null);
      busy.current = false;
    }, 1150);
  };

  return (
    <>
      <div className="tyres" role="radiogroup" aria-label="Tyre compound (colour theme)">
        {compounds.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === compound}
            aria-label={`${c.name} compound`}
            title={c.name}
            className="tyre"
            data-compound={c.id}
            onClick={() => fit(c.id)}
          >
            <span>{c.letter}</span>
          </button>
        ))}
      </div>
      {stop && (
        <div className="pitstop" data-compound={stop.id} aria-hidden="true">
          <p className="mono">Pit stop · {compounds.find((c) => c.id === stop.id)!.name} fitted</p>
          <p className="pitstop__time">
            {stop.time}
            <small>s</small>
          </p>
        </div>
      )}
    </>
  );
}
