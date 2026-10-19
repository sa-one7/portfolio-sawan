"use client";

import { useEffect, useRef } from "react";
import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RepeatWrapping,
  Scene as ThreeScene,
  WebGLRenderer,
} from "three";
import { loadCar, type Car } from "@/gl/model";
import { clamp, damp, lerp, prefersReducedMotion, race, smooth } from "@/lib/race";

// Where the camera sits for each chapter. The car stays at the origin and the camera
// orbits it: `th` swings round the car (0 is side on, positive comes round to the nose),
// `ph` lifts it overhead. `sx` and `sy` slide the whole picture across the screen so the
// car clears the text. `ex` opens the exploded view and `x` drives the car off stage.
type Key = { r: number; th: number; ph: number; sx: number; sy: number; ex: number; x: number };

const WIDE: Key[] = [
  { r: 11.2, th: 0.92, ph: 0.2, sx: 0.17, sy: 0.02, ex: 0, x: 0 }, // lights out: three-quarter front
  { r: 12.4, th: 0.0, ph: 0.05, sx: -0.2, sy: -0.17, ex: 0, x: 0 }, // driver: side on
  { r: 15.5, th: 0.55, ph: 0.92, sx: 0.2, sy: 0.0, ex: 1, x: 0 }, // the car: from above, taken apart
  { r: 11, th: 0.0, ph: 0.08, sx: 0, sy: -0.1, ex: 0, x: 19 }, // season: gone up the road
  { r: 10.5, th: 0.28, ph: 0.1, sx: 0, sy: 0, ex: 0, x: -19 }, // the grid: waiting off stage
  { r: 10.5, th: 0.28, ph: 0.1, sx: 0, sy: 0, ex: 0, x: 19 }, // pit wall: it crosses the line on the way here
];

const TALL: Key[] = [
  { r: 17, th: 1.12, ph: 0.2, sx: 0, sy: 0.25, ex: 0, x: 0 },
  { r: 25, th: 0.0, ph: 0.06, sx: 0, sy: 0.24, ex: 0, x: 0 },
  { r: 31, th: 1.57, ph: 1.0, sx: 0, sy: 0.27, ex: 1, x: 0 },
  { r: 25, th: 0.0, ph: 0.08, sx: 0, sy: 0.24, ex: 0, x: 22 },
  { r: 22, th: 0.3, ph: 0.1, sx: 0, sy: 0, ex: 0, x: -22 },
  { r: 22, th: 0.3, ph: 0.1, sx: 0, sy: 0, ex: 0, x: 22 },
];

const STREAKS = 70;

// The shadow under the car, drawn from above in the car's own outline and then blurred:
// darkest under the floor and where each tyre touches the road, soft at the edges.
function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  // 64 pixels to the metre, car centred, nose to the right.
  const at = (x: number, z: number, w: number, d: number) => ctx.fillRect(256 + x * 64 - (w * 64) / 2, 128 + z * 64 - (d * 64) / 2, w * 64, d * 64);
  ctx.filter = "blur(22px)";
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  at(0.1, 0, 5.6, 2.1);
  ctx.filter = "blur(9px)";
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  at(-0.3, 0, 3.4, 1.5);
  at(2.5, 0, 0.5, 1.9);
  at(-2.25, 0, 0.5, 1.0);
  ctx.filter = "blur(5px)";
  ctx.fillStyle = "rgba(0,0,0,0.95)";
  for (const s of [1, -1]) {
    at(1.8, s * 0.85, 0.5, 0.3);
    at(-1.8, s * 0.8, 0.52, 0.4);
  }
  return new CanvasTexture(c);
}

// The lighting a car is photographed under: a dark room with long softboxes overhead and
// down each side. They are what draw the bright streaks along the bodywork.
function studio() {
  const room = new ThreeScene();
  const wall = new Mesh(new BoxGeometry(40, 20, 40), new MeshBasicMaterial({ color: 0x050506, side: BackSide }));
  room.add(wall);
  const box = (w: number, h: number, power: number, at: [number, number, number], look: [number, number, number]) => {
    const m = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ color: new Color(power, power, power), side: DoubleSide }));
    m.position.set(...at);
    m.lookAt(...look);
    room.add(m);
  };
  box(14, 1.6, 9, [0, 7, 0], [0, 0, 0]);
  box(12, 0.9, 7, [0, 5.5, 5.5], [0, 0, 0]);
  box(12, 0.9, 7, [0, 5.5, -5.5], [0, 0, 0]);
  box(9, 2.4, 1.6, [0, 2.6, 10], [0, 0.5, 0]);
  box(9, 2.4, 1.0, [0, 2.6, -10], [0, 0.5, 0]);
  box(4, 2.4, 1.6, [11, 2.8, 0], [0, 0.5, 0]);
  box(4, 2.2, 1.0, [-11, 2.8, 0], [0, 0.5, 0]);
  return room;
}

// The car, drawn on a fixed canvas behind the page. It holds a different pose for every
// chapter and the camera moves between them as the page scrolls.
export default function Scene() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current!;
    const root = document.documentElement;
    const calm = prefersReducedMotion();
    if (calm) root.classList.add("calm");

    // No WebGL, no car. The page is complete without it.
    if (!document.createElement("canvas").getContext("webgl2")) return;
    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      return;
    }
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new ThreeScene();
    const pmrem = new PMREMGenerator(renderer);
    const room = studio();
    const lightRig = pmrem.fromScene(room, 0.03);
    scene.environment = lightRig.texture;
    scene.environmentIntensity = 1;

    const key = new DirectionalLight(0xffffff, 1.5);
    key.position.set(5, 7, 6);
    const rimLight = new DirectionalLight(0xffffff, 1.6);
    rimLight.position.set(-6, 2.5, -6);
    scene.add(key, rimLight, new AmbientLight(0xffffff, 0.08));

    // The car is a real model and takes a moment to arrive. Everything else is ready first.
    let car: Car | null = null;
    let gone = false;
    loadCar()
      .then((loaded) => {
        if (gone) {
          loaded.dispose();
          return;
        }
        car = loaded;
        scene.add(loaded.root);
        root.classList.add("has-car");
        if (calm) still();
      })
      .catch(() => {});

    const shadowMat = new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.9 });
    const shadow = new Mesh(new PlaneGeometry(8, 4), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.004;
    scene.add(shadow);

    // The finish line, painted across the road where the car passes on its last run.
    const check = document.createElement("canvas");
    check.width = check.height = 2;
    const cctx = check.getContext("2d")!;
    cctx.fillStyle = "#0c0c0e";
    cctx.fillRect(0, 0, 2, 2);
    cctx.fillStyle = "#f4f2ec";
    cctx.fillRect(0, 0, 1, 1);
    cctx.fillRect(1, 1, 1, 1);
    const checkTex = new CanvasTexture(check);
    checkTex.magFilter = NearestFilter;
    checkTex.wrapS = checkTex.wrapT = RepeatWrapping;
    checkTex.repeat.set(1, 9);
    const lineMat = new MeshBasicMaterial({ map: checkTex, transparent: true, opacity: 0, depthWrite: false });
    const finishLine = new Mesh(new PlaneGeometry(1.1, 9.9), lineMat);
    finishLine.rotation.x = -Math.PI / 2;
    finishLine.position.y = 0.002;
    scene.add(finishLine);

    // The road rushing past: thin streaks on the ground that run back under the car.
    const streakGeo = new PlaneGeometry(1, 0.014);
    streakGeo.rotateX(-Math.PI / 2);
    const streakMat = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const streaks = new InstancedMesh(streakGeo, streakMat, STREAKS);
    streaks.frustumCulled = false;
    // Kept to a band around the car, so they never run across the words beside it.
    const lanes = Array.from({ length: STREAKS }, () => ({
      x: Math.random() * 22 - 11,
      z: Math.random() * 6.4 - 3.6,
      len: 0.4 + Math.random() * 1.6,
      pace: 0.6 + Math.random() * 0.8,
    }));
    scene.add(streaks);

    const camera = new PerspectiveCamera(30, 1, 0.1, 120);

    // The light on the car and the streaks on the road follow the theme picked in the page.
    const glowColor = new Color();
    const readLivery = () => {
      const css = getComputedStyle(root);
      const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
      glowColor.set(get("--accent", "#ff2a1f"));
      rimLight.color.copy(glowColor).lerp(new Color(0xffffff), 0.35);
      streakMat.color.set(get("--fg", "#f3f1ec"));
    };
    readLivery();

    let width = 1;
    let height = 1;
    let tall = false;
    // The most device pixels drawn per CSS pixel. Lowered if the machine cannot keep up.
    let sharpness = 1.75;
    const resize = () => {
      width = host.clientWidth || window.innerWidth;
      height = host.clientHeight || window.innerHeight;
      tall = width / height < 1.05;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, sharpness));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const pose: Key = { ...WIDE[0] };
    const tint = new Color();
    const black = new Color(0, 0, 0);
    const matrix = new Matrix4();
    let shownLap = calm ? 0 : race.lap;
    const look = { x: 0, y: 0 };
    let time = 0;
    let last = 0;
    let raf = 0;

    const draw = (dt: number) => {
      time += dt / 1000;
      const keys = tall ? TALL : WIDE;

      if (!calm) shownLap += (race.lap - shownLap) * damp(0.08, dt);
      const i = clamp(Math.floor(shownLap), 0, keys.length - 2);
      const f = smooth(clamp(shownLap - i));
      const a = keys[i];
      const b = keys[i + 1];
      (Object.keys(pose) as (keyof Key)[]).forEach((k) => (pose[k] = lerp(a[k], b[k], f)));

      // Between "season" and "the grid" the car is off stage, swapping sides.
      const offstage = shownLap > 3.02 && shownLap < 3.98;
      shadow.visible = !offstage && !!car;
      shadow.position.x = pose.x;
      // The line fades in for the run to the flag and is gone by the time the page settles.
      lineMat.opacity = smooth(clamp((shownLap - 4.03) / 0.12)) * (1 - smooth(clamp((shownLap - 4.72) / 0.24)));
      finishLine.visible = lineMat.opacity > 0.01;

      // How much the car is "on the move": on the first screen, and on its run to the line.
      const rolling = calm ? 0 : Math.max(1 - smooth(clamp(shownLap / 0.8)), shownLap > 3.9 ? 1 : 0);
      const speed = rolling * 26 + Math.min(Math.abs(race.velocity) * 0.012, 40);
      shadowMat.opacity = 0.9 * (1 - pose.ex * 0.75);
      if (car) {
        car.root.visible = !offstage;
        car.root.position.x = pose.x;
        car.root.position.y = rolling * Math.sin(time * 31) * 0.003;
        for (const axle of car.axles) axle.rotation.z -= (speed / 0.39) * (dt / 1000) * 0.5;
        for (const p of car.pieces) p.node.position.copy(p.away).multiplyScalar(pose.ex);

        // Pointing at a system in the page fades every other part of the car.
        const k = calm ? 1 : damp(0.14, dt);
        for (const s of car.skins) {
          const away = !!race.focus && race.focus !== s.key;
          s.mat.color.lerp(tint.copy(s.base).multiplyScalar(away ? 0.16 : 1), k);
          s.mat.emissive.lerp(race.focus === s.key ? tint.copy(glowColor).multiplyScalar(0.025) : black, k);
        }
        if (car.rainLight) car.rainLight.emissiveIntensity = rolling > 0.4 && Math.sin(time * 9) > 0 ? 3 : 0.4;
      }

      streakMat.opacity = Math.min(0.3, rolling * 0.11 + Math.abs(race.velocity) * 0.00005) * (1 - pose.ex) * (offstage ? 0 : 1);
      if (streakMat.opacity > 0.002) {
        const flow = (rolling * 30 + Math.abs(race.velocity) * 0.012) * (dt / 1000);
        lanes.forEach((lane, n) => {
          lane.x -= flow * lane.pace;
          if (lane.x < -11) lane.x += 22;
          const stretch = lane.len * (1 + rolling * 1.2);
          matrix.makeScale(stretch, 1, 1).setPosition(pose.x + lane.x, 0.003, lane.z);
          streaks.setMatrixAt(n, matrix);
        });
        streaks.instanceMatrix.needsUpdate = true;
      }

      // The pointer nudges the view a little. It never chases the mouse.
      const ease = damp(0.04, dt);
      look.x += (pointer.x - look.x) * ease;
      look.y += (pointer.y - look.y) * ease;
      const th = pose.th + (calm ? 0 : Math.sin(time * 0.31) * 0.035 + look.x * 0.06);
      const ph = clamp(pose.ph + (calm ? 0 : look.y * 0.03), 0.02, 1.4);
      const lift = 0.45 + pose.ex * 0.15;
      camera.position.set(pose.r * Math.cos(ph) * Math.sin(th), lift + pose.r * Math.sin(ph), pose.r * Math.cos(ph) * Math.cos(th));
      camera.lookAt(0, lift, 0);
      camera.setViewOffset(width, height, -pose.sx * width, pose.sy * height, width, height);

      // While the car is off stage or up the road there is nothing to draw, so nothing is
      // drawn. That covers the two longest chapters.
      const empty = (offstage || Math.abs(pose.x) > 15.5) && !finishLine.visible;
      if (empty && wasEmpty) return;
      wasEmpty = empty;
      renderer.render(scene, camera);
    };

    let wasEmpty = false;
    let slowMs = 0;
    let slowFrames = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const gap = last ? now - last : 16.667;
      const dt = Math.min(gap, 50);
      last = now;

      // If frames run long for a stretch, draw fewer pixels: a little softer, but smooth.
      // Long gaps are tab switches and do not count.
      if (gap < 200 && !wasEmpty) {
        slowMs += gap;
        if (++slowFrames === 90) {
          if (slowMs / 90 > 21 && sharpness > 0.75) {
            sharpness = Math.max(0.75, Math.min(sharpness, window.devicePixelRatio || 1) - 0.25);
            resize();
          }
          slowMs = slowFrames = 0;
        }
      }
      draw(dt);
    };

    // With reduced motion the car is a still picture in the first screen: no orbiting
    // camera, no spinning wheels. It is only redrawn when the screen or livery changes.
    const still = () => requestAnimationFrame(() => draw(0));
    const ro = new ResizeObserver(() => {
      resize();
      if (calm) still();
    });
    ro.observe(host);
    const themeWatch = new MutationObserver(() => {
      readLivery();
      if (calm) still();
    });
    themeWatch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

    if (calm) still();
    else {
      window.addEventListener("pointermove", onMove, { passive: true });
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeWatch.disconnect();
      window.removeEventListener("pointermove", onMove);
      root.classList.remove("has-car");
      scene.traverse((o) => {
        const mesh = o as Mesh;
        mesh.geometry?.dispose();
        const m = mesh.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else m?.dispose();
      });
      gone = true;
      car?.dispose();
      room.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        (m.material as MeshBasicMaterial | undefined)?.dispose();
      });
      shadowMat.map?.dispose();
      checkTex.dispose();
      lightRig.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="stage" aria-hidden="true" />;
}
