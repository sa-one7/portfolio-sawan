import type Lenis from "lenis";

// Shared, mutable state between the scroll director, the 3D scene and the HUD. It is
// read every frame, so it lives outside React.
export const race = {
  // How far round the lap we are, 0 to 1. This is the scroll position.
  progress: 0,
  // Which chapter the car's pose should hold. 2.0 is "The car", 2.5 is halfway to the
  // next one.
  lap: 0,
  // Index of the chapter under the middle of the screen.
  chapter: 0,
  // Scroll speed in pixels per second, smoothed. It drives the dash and the wheels.
  velocity: 0,
  // True once the start lights have gone out.
  started: false,
  // The car system being pointed at ("engine", "aero", ...) or "" for none.
  focus: "",
};

// The stopwatch. The lap starts when the lights go out and ends at the bottom of the page.
export const clock = {
  t0: 0,
  running: false,
  finished: false,
  // The lap so far, or the final time once finished, in milliseconds.
  time: 0,
  // Time taken for each third of the lap, 0 until that sector is complete.
  sectors: [0, 0, 0],
  // "purple" beat your best, "green" matched it, "yellow" was slower.
  marks: ["", "", ""],
  best: false,
};

type Best = { lap: number; sectors: number[] };
const KEY = "one-lap-best";

export function readBest(): Best | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Best) : null;
  } catch {
    return null;
  }
}

export function saveBest(best: Best) {
  try {
    localStorage.setItem(KEY, JSON.stringify(best));
  } catch {}
}

export function startLap() {
  clock.t0 = performance.now();
  clock.running = true;
  clock.finished = false;
  clock.time = 0;
  clock.sectors = [0, 0, 0];
  clock.marks = ["", "", ""];
  clock.best = false;
  emit();
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export const emit = () => listeners.forEach((fn) => fn());

let lenis: Lenis | null = null;
export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};
export const getLenis = () => lenis;

export function scrollToTarget(target: string | number) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) });
    return;
  }
  if (typeof target === "number") window.scrollTo({ top: target });
  else document.querySelector(target)?.scrollIntoView();
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Turns an easing factor tuned for 60fps into one that covers the same ground per second
// on any screen.
export const damp = (factor: number, dt: number) => 1 - Math.pow(1 - factor, dt / 16.667);
export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);

// m:ss.mmm, the way a lap time is written.
export function lapTime(ms: number) {
  const total = Math.max(0, Math.round(ms));
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const t = total % 1000;
  return `${m}:${String(s).padStart(2, "0")}.${String(t).padStart(3, "0")}`;
}

// The five dry and wet compounds, which double as the site's colour themes.
export const compounds = [
  { id: "soft", letter: "S", name: "Soft" },
  { id: "medium", letter: "M", name: "Medium" },
  { id: "hard", letter: "H", name: "Hard" },
  { id: "inter", letter: "I", name: "Intermediate" },
  { id: "wet", letter: "W", name: "Wet" },
] as const;

export type CompoundId = (typeof compounds)[number]["id"];
