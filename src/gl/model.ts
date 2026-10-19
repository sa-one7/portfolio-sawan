import { Color, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { USDZLoader } from "three/examples/jsm/loaders/USDZLoader.js";

// The car is a real 3D model, public/models/w13.usdz, with its own textures. This file
// loads it, sets it on its wheels at the right size, and sorts its parts into the six
// systems the page talks about, so the exploded view and the highlight still work.

export type PartKey = "engine" | "aero" | "chassis" | "wheels" | "suspension" | "driver";

export type Skin = { key: PartKey; mat: MeshStandardMaterial; base: Color };

// A group of parts that moves as one in the exploded view. `away` is how far it travels.
export type Piece = { key: PartKey; node: Group; away: Vector3 };

export type Car = {
  root: Group;
  pieces: Piece[];
  skins: Skin[];
  // The two axles. Turning one about its z axis rolls its wheels.
  axles: Group[];
  rainLight: MeshStandardMaterial | null;
  dispose: () => void;
};

const FILE = "/models/w13.usdz";
// The model is about 12.5 units long with its nose along -z. The page's car is 5.6 long
// with its nose along +x.
const SCALE = 0.448;
const SHIFT = 0.19;
const AXLE_Y = 0.385;
const AXLE_X = 1.839;

// Which system each named part of the model belongs to, and where it goes when the car
// is taken apart. The first rule that matches a part's name wins.
const RULES: { match: RegExp; key: PartKey; group: string; away: [number, number, number] }[] = [
  { match: /^FrontWing|^FrontCameraBox/, key: "aero", group: "front wing", away: [1.25, 0, 0] },
  { match: /^RearWing|^WingSupport/, key: "aero", group: "rear wing", away: [-1.15, 0.45, 0] },
  { match: /^FrontTyre|^FronyWheelHub|^FrontWheelHubInner/, key: "wheels", group: "front wheels", away: [0.55, 0, 0] },
  { match: /^RearTyre|^RearWheelHub/, key: "wheels", group: "rear wheels", away: [-0.55, 0, 0] },
  { match: /^FrontSusp/, key: "suspension", group: "front suspension", away: [0.28, 0.3, 0] },
  { match: /^RearSusp/, key: "suspension", group: "rear suspension", away: [-0.28, 0.3, 0] },
  { match: /^Exhaust|^CrashStruct|^T_Cam|^TopCameraBox/, key: "engine", group: "power unit", away: [-0.75, 0.8, 0] },
  { match: /^Steering|^Seat|^Buckle|^Cube_|^Cylinder_|^WindScreen|^Interior|^Headrest/, key: "driver", group: "cockpit", away: [0.1, 1.15, 0] },
  { match: /^Floor|^Plank/, key: "chassis", group: "floor", away: [0, -0.5, 0] },
  { match: /./, key: "chassis", group: "body", away: [0, 0, 0] },
];

export async function loadCar(): Promise<Car> {
  const source = await new USDZLoader().loadAsync(FILE);

  const root = new Group();
  const holder = new Group();
  holder.scale.setScalar(SCALE);
  holder.rotation.y = -Math.PI / 2;
  holder.position.x = SHIFT;
  holder.add(source);
  root.add(holder);
  root.updateMatrixWorld(true);

  // The model's named parts all hang off one node.
  let parts: Object3D[] = [];
  source.traverse((o) => {
    if (o.name === "RootNode") parts = [...o.children];
  });
  if (!parts.length) throw new Error("Car model has an unexpected structure");

  const pieces: Piece[] = [];
  const nodes = new Map<string, Group>();
  const axles: Group[] = [];
  const axle = (x: number, into: Group) => {
    const pivot = new Group();
    pivot.position.set(x, AXLE_Y, 0);
    into.add(pivot);
    axles.push(pivot);
    return pivot;
  };

  const skins: Skin[] = [];
  const clones = new Map<string, MeshStandardMaterial>();
  let rainLight: MeshStandardMaterial | null = null;

  for (const part of parts) {
    const rule = RULES.find((r) => r.match.test(part.name))!;
    let node = nodes.get(rule.group);
    if (!node) {
      node = new Group();
      root.add(node);
      nodes.set(rule.group, node);
      pieces.push({ key: rule.key, node, away: new Vector3(...rule.away) });
      if (rule.group === "front wheels") axle(AXLE_X, node);
      if (rule.group === "rear wheels") axle(-AXLE_X, node);
    }
    // Tyres and wheel faces turn with the axle. The brakes and uprights behind them do not.
    const turns = /Tyre|WheelHub(?!Inner)/.test(part.name);
    const home = turns ? (node.children.find((c) => axles.includes(c as Group)) as Group) : node;
    home.attach(part);

    // Each system gets its own copy of each material, so one can be lit while the rest fade.
    part.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.material as MeshStandardMaterial;
      const kind = mesh.name.replace(/_0$/, "").split("_").slice(-2).join("_");
      const id = `${rule.key}:${original.uuid}`;
      let mat = clones.get(id);
      if (!mat) {
        mat = original.clone();
        if (/Body_Main|Body_Wings/.test(mesh.name) && mat instanceof MeshPhysicalMaterial) {
          // Paint: a hard clear coat over the colour, for the long studio highlights.
          mat.clearcoat = 1;
          mat.clearcoatRoughness = 0.06;
        }
        if (/BlackHole/.test(kind)) mat.color.set(0x000000);
        if (/Mirror/.test(kind)) {
          mat.metalness = 1;
          mat.roughness = 0.05;
        }
        if (/Glass_0$|Glass$/.test(mesh.name) && !/GlassLight/.test(mesh.name)) {
          mat.transparent = true;
          mat.opacity = 0.35;
          mat.roughness = 0.05;
        }
        if (/RainLight_GlassLight/.test(mesh.name)) {
          mat.emissive = new Color(1, 0.05, 0.05);
          rainLight = mat;
        }
        mat.envMapIntensity = 1;
        clones.set(id, mat);
        if (mat !== rainLight) skins.push({ key: rule.key, mat, base: mat.color.clone() });
      }
      mesh.material = mat;
    });
  }

  const dispose = () => {
    const seen = new Set<unknown>();
    root.traverse((o) => {
      const mesh = o as Mesh;
      if (!mesh.isMesh) return;
      mesh.geometry.dispose();
      const mat = mesh.material as MeshStandardMaterial;
      for (const tex of [mat.map, mat.normalMap, mat.roughnessMap, mat.metalnessMap]) {
        if (tex && !seen.has(tex)) {
          seen.add(tex);
          tex.dispose();
        }
      }
      mat.dispose();
    });
  };

  return { root, pieces, skins, axles, rainLight, dispose };
}
