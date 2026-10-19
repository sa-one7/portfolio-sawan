"use client";

import { useEffect, useRef } from "react";
import { chapters } from "@/lib/content";
import { clock, emit, lapTime, prefersReducedMotion, race, readBest, saveBest } from "@/lib/race";

// A made-up circuit, drawn as one closed path. The start line is at the bottom left and
// the lap runs anticlockwise.
export const TRACK =
  "M 44 122 L 150 122 Q 174 122 174 100 L 174 72 Q 174 56 158 54 Q 146 52 146 40 Q 146 22 126 22 L 86 22 Q 62 22 62 40 Q 62 56 78 58 L 104 62 Q 118 64 116 78 Q 114 92 98 92 L 50 92 Q 22 92 22 107 Q 22 122 44 122 Z";

const GEARS = [0, 22, 60, 100, 145, 195, 245, 295, 345];
const LEDS = 12;

// The broadcast graphics: a lap timer with sector lights at the top, and a dock at the
// bottom holding the track map and a steering-wheel dash. The dash reads the page's own
// scroll speed as if it were the car's.
export default function Hud() {
  const timeRef = useRef<HTMLSpanElement>(null);
  const stateRef = useRef<HTMLSpanElement>(null);
  const sectorsRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const doneRef = useRef<SVGPathElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const turnsRef = useRef<SVGGElement>(null);
  const gearRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const ledsRef = useRef<HTMLDivElement>(null);
  const drsRef = useRef<HTMLSpanElement>(null);
  const turnRef = useRef<HTMLElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const path = pathRef.current!;
    const length = path.getTotalLength();
    const calm = prefersReducedMotion();
    doneRef.current!.style.strokeDasharray = `${length}`;

    // Put each chapter's corner marker on the map.
    const turns = Array.from(turnsRef.current!.children) as SVGGElement[];
    turns.forEach((g, i) => {
      const p = path.getPointAtLength(chapters[i].at * length);
      g.setAttribute("transform", `translate(${p.x} ${p.y})`);
    });

    let best = readBest();
    let lapId = clock.t0;
    let speed = 0;
    let lastText = "";
    let lastChapter = -1;
    let lastGear = "";
    let lastLeds = -1;
    let raf = 0;
    let lastT = 0;

    const sectors = Array.from(sectorsRef.current!.children) as HTMLElement[];
    const paint = () => sectors.forEach((el, i) => (el.dataset.mark = clock.marks[i]));

    const judge = (i: number, ms: number) => {
      clock.sectors[i] = ms;
      const ref = best?.sectors[i];
      clock.marks[i] = !ref || ms < ref ? "purple" : ms < ref * 1.08 ? "green" : "yellow";
      paint();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = lastT ? Math.min(now - lastT, 100) : 16.667;
      lastT = now;
      const p = race.progress;

      // A fresh lap is judged against the best one so far, including the one just set.
      if (clock.t0 !== lapId) {
        lapId = clock.t0;
        best = readBest();
        paint();
      }

      // Stopwatch: sector splits at each third, the flag at the bottom of the page.
      if (clock.running) {
        clock.time = now - clock.t0;
        const split = (i: number) => clock.time - clock.sectors.slice(0, i).reduce((a, b) => a + b, 0);
        if (!clock.sectors[0] && p >= 1 / 3) judge(0, split(0));
        if (clock.sectors[0] && !clock.sectors[1] && p >= 2 / 3) judge(1, split(1));
        if (clock.sectors[1] && p >= 0.985) {
          judge(2, split(2));
          clock.running = false;
          clock.finished = true;
          clock.best = !best || clock.time < best.lap;
          if (clock.best) saveBest({ lap: clock.time, sectors: [...clock.sectors] });
          emit();
        }
      }
      const text = lapTime(clock.time);
      if (text !== lastText) {
        lastText = text;
        timeRef.current!.textContent = text;
      }
      const state = clock.finished ? (clock.best ? "Personal best" : "Finish") : clock.running ? "Lap 1 / 1" : "Grid";
      if (stateRef.current!.textContent !== state) {
        stateRef.current!.textContent = state;
        stateRef.current!.dataset.state = clock.finished ? (clock.best ? "best" : "done") : "";
        paint();
      }

      // Track map.
      const at = path.getPointAtLength(p * length);
      const ahead = path.getPointAtLength(Math.min(length, p * length + 1));
      const heading = (Math.atan2(ahead.y - at.y, ahead.x - at.x) * 180) / Math.PI;
      carRef.current!.setAttribute("transform", `translate(${at.x} ${at.y}) rotate(${heading})`);
      doneRef.current!.style.strokeDashoffset = `${length * (1 - p)}`;
      if (race.chapter !== lastChapter) {
        lastChapter = race.chapter;
        document.documentElement.dataset.chapter = String(lastChapter);
        turns.forEach((g, i) => g.classList.toggle("is-on", i === lastChapter));
        turnRef.current!.textContent = chapters[lastChapter].turn;
        nameRef.current!.textContent = chapters[lastChapter].label;
        document
          .querySelectorAll<HTMLElement>(".bar__links a")
          .forEach((a) => a.classList.toggle("is-on", a.getAttribute("href") === `#${chapters[lastChapter].id}`));
      }

      // Dash: the page's scroll speed, read as a car's.
      const target = calm ? 0 : Math.min(360, Math.abs(race.velocity) * 0.085);
      speed += (target - speed) * (1 - Math.pow(1 - (target > speed ? 0.16 : 0.07), dt / 16.667));
      let gear = 0;
      while (gear < 8 && speed >= GEARS[gear + 1]) gear++;
      const label = speed < 3 ? "N" : String(Math.max(1, gear));
      if (label !== lastGear) {
        lastGear = label;
        gearRef.current!.textContent = label;
      }
      speedRef.current!.textContent = String(Math.round(speed)).padStart(3, "0");
      const lo = GEARS[Math.max(0, gear)];
      const hi = GEARS[Math.min(8, gear + 1)];
      const lit = speed < 3 ? 0 : Math.round(Math.min(1, (speed - lo) / Math.max(1, hi - lo)) * LEDS);
      if (lit !== lastLeds) {
        lastLeds = lit;
        Array.from(ledsRef.current!.children).forEach((led, i) => led.classList.toggle("is-on", i < lit));
      }
      drsRef.current!.classList.toggle("is-on", speed > 200);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="hud" aria-hidden="true">
      <div className="hud__clock">
        <span ref={stateRef} className="hud__state mono">
          Grid
        </span>
        <span ref={timeRef} className="hud__time">
          0:00.000
        </span>
        <div ref={sectorsRef} className="hud__sectors mono">
          <span>S1</span>
          <span>S2</span>
          <span>S3</span>
        </div>
      </div>

      <div className="dock">
        <svg className="dock__map" viewBox="8 8 180 128">
          <path className="map__road" d={TRACK} />
          <path ref={pathRef} className="map__line" d={TRACK} />
          <path ref={doneRef} className="map__done" d={TRACK} />
          <path className="map__flag" d="M 44 115 L 44 129" />
          <g ref={turnsRef}>
            {chapters.map((c) => (
              <g className="map__turn" key={c.id}>
                <circle r="3" />
              </g>
            ))}
          </g>
          <g ref={carRef} className="map__car">
            <path d="M 7 0 L -5 4.4 L -2.6 0 L -5 -4.4 Z" />
          </g>
        </svg>

        <div className="dock__corner mono">
          <b ref={turnRef}>{chapters[0].turn}</b>
          <span ref={nameRef}>{chapters[0].label}</span>
        </div>

        <div className="dock__dash">
          <div ref={ledsRef} className="dash__leds">
            {Array.from({ length: LEDS }, (_, i) => (
              <i key={i} />
            ))}
          </div>
          <div className="dash__row">
            <span ref={gearRef} className="dash__gear">
              N
            </span>
            <span className="dash__speed">
              <b ref={speedRef}>000</b>
              <small className="mono">km/h</small>
            </span>
            <span ref={drsRef} className="dash__drs mono">
              DRS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
