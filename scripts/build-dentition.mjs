/**
 * Builds public/models/adult-dentition.glb from Open-Full-Jaw Patient_3
 * CBCT-segmented tooth + alveolar meshes (CC BY-NC-SA 4.0).
 *
 * Usage: node scripts/build-dentition.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class FileReader {
    result = null;
    onloadend = null;
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buffer) => {
        this.result = buffer;
        this.onloadend?.();
      });
    }
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "tmp-dental", "p3-extract");
const OUT_DIR = path.join(ROOT, "public", "models");
const OUT_GLB = path.join(OUT_DIR, "adult-dentition.glb");

const UNN_TO_FDI = {
  1: 18, 2: 17, 3: 16, 4: 15, 5: 14, 6: 13, 7: 12, 8: 11,
  9: 21, 10: 22, 11: 23, 12: 24, 13: 25, 14: 26, 15: 27, 16: 28,
  17: 38, 18: 37, 19: 36, 20: 35, 21: 34, 22: 33, 23: 32, 24: 31,
  25: 41, 26: 42, 27: 43, 28: 44, 29: 45, 30: 46, 31: 47, 32: 48,
};

const WISDOM = [
  { unn: 1, from: 2, neighbor: 3 },
  { unn: 16, from: 15, neighbor: 14 },
  { unn: 17, from: 18, neighbor: 19 },
  { unn: 32, from: 31, neighbor: 30 },
];

const stlLoader = new STLLoader();

function readStl(filePath) {
  const buf = fs.readFileSync(filePath);
  const geom = stlLoader.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  geom.computeBoundingBox();
  return geom;
}

function centroidOf(geometry) {
  geometry.computeBoundingBox();
  const c = new THREE.Vector3();
  geometry.boundingBox.getCenter(c);
  return c;
}

function voxelSimplify(geometry, cell) {
  const src = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = src.getAttribute("position");
  const map = new Map();
  const vertices = [];
  const index = [];
  const keyOf = (i) => {
    const x = Math.round(pos.getX(i) / cell);
    const y = Math.round(pos.getY(i) / cell);
    const z = Math.round(pos.getZ(i) / cell);
    return `${x},${y},${z}`;
  };
  const vert = (i) => {
    const key = keyOf(i);
    let idx = map.get(key);
    if (idx === undefined) {
      idx = vertices.length / 3;
      map.set(key, idx);
      vertices.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    return idx;
  };
  for (let i = 0; i < pos.count; i += 3) {
    const a = vert(i);
    const b = vert(i + 1);
    const c = vert(i + 2);
    if (a === b || b === c || c === a) continue;
    index.push(a, b, c);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  out.setIndex(index);
  const welded = mergeVertices(out, cell * 0.35);
  laplacianSmooth(welded, cell < 0.25 ? 10 : 14, 0.55);
  welded.computeVertexNormals();
  const normals = welded.getAttribute("normal");
  if (normals) normals.normalized = true;
  welded.computeBoundingBox();
  return welded;
}

function laplacianSmooth(geometry, iterations = 8, lambda = 0.5) {
  const pos = geometry.getAttribute("position");
  const index = geometry.getIndex();
  if (!pos || !index) return geometry;

  const n = pos.count;
  const adj = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    adj[a].add(b);
    adj[a].add(c);
    adj[b].add(a);
    adj[b].add(c);
    adj[c].add(a);
    adj[c].add(b);
  }

  const nx = new Float32Array(n);
  const ny = new Float32Array(n);
  const nz = new Float32Array(n);
  for (let iter = 0; iter < iterations; iter += 1) {
    for (let i = 0; i < n; i += 1) {
      const nbrs = adj[i];
      if (!nbrs.size) {
        nx[i] = pos.getX(i);
        ny[i] = pos.getY(i);
        nz[i] = pos.getZ(i);
        continue;
      }
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (const j of nbrs) {
        sx += pos.getX(j);
        sy += pos.getY(j);
        sz += pos.getZ(j);
      }
      const inv = 1 / nbrs.size;
      nx[i] = pos.getX(i) * (1 - lambda) + sx * inv * lambda;
      ny[i] = pos.getY(i) * (1 - lambda) + sy * inv * lambda;
      nz[i] = pos.getZ(i) * (1 - lambda) + sz * inv * lambda;
    }
    for (let i = 0; i < n; i += 1) pos.setXYZ(i, nx[i], ny[i], nz[i]);
  }
  return geometry;
}

function crownIsPlusY(geometry) {
  const pos = geometry.getAttribute("position");
  let posR = 0;
  let negR = 0;
  for (let i = 0; i < pos.count; i += 1) {
    const r = Math.hypot(pos.getX(i), pos.getZ(i));
    if (pos.getY(i) >= 0) posR = Math.max(posR, r);
    else negR = Math.max(negR, r);
  }
  return posR >= negR;
}

function toLocalTooth(geometry, axis) {
  const g = geometry.clone();
  const c = axis
    ? new THREE.Vector3().fromArray(axis.c)
    : centroidOf(g);
  g.translate(-c.x, -c.y, -c.z);

  if (axis) {
    const mesial = new THREE.Vector3().fromArray(axis.x).sub(c).normalize();
    const labial = new THREE.Vector3().fromArray(axis.y).sub(c).normalize();
    const long = new THREE.Vector3().fromArray(axis.z).sub(c).normalize();
    mesial.sub(long.clone().multiplyScalar(mesial.dot(long))).normalize();
    const binormal = new THREE.Vector3().crossVectors(long, mesial).normalize();
    if (binormal.dot(labial) < 0) binormal.negate();
    const basis = new THREE.Matrix4().makeBasis(mesial, long, binormal);
    g.applyMatrix4(basis.clone().invert());
  }

  // Wider section is the crown → +Y (biting plane). Apex stays -Y (into gum).
  if (!crownIsPlusY(g)) g.rotateX(Math.PI);
  g.computeBoundingBox();
  const box = g.boundingBox;
  const cej = box.min.y + (box.max.y - box.min.y) * 0.55;
  g.translate(0, -cej, 0);
  const simplified = voxelSimplify(g, 0.16);
  simplified.computeBoundingBox();
  return simplified;
}

function loadAxes(filePath) {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const map = new Map();
  for (const [key, value] of Object.entries(raw)) {
    map.set(Number(key), value);
  }
  return map;
}

function loadArchTeeth(archDir) {
  const files = fs.readdirSync(archDir).filter((name) => /^tooth_\d+\.stl$/.test(name));
  const teeth = [];
  for (const file of files) {
    const unn = Number(file.match(/\d+/)[0]);
    const geom = readStl(path.join(archDir, file));
    teeth.push({ unn, geometry: geom, centroid: centroidOf(geom) });
    process.stdout.write(`  loaded ${archDir.includes("maxilla") ? "upper" : "lower"} UNN ${unn}\n`);
  }
  return teeth;
}

function cloneWisdom(teeth, spec, axes) {
  const source = teeth.find((t) => t.unn === spec.from);
  const neighbor = teeth.find((t) => t.unn === spec.neighbor);
  if (!source || !neighbor) {
    throw new Error(`Cannot place wisdom UNN ${spec.unn}`);
  }
  const srcAxis = axes.get(spec.from);
  const nAxis = axes.get(spec.neighbor);
  const srcC = srcAxis ? new THREE.Vector3().fromArray(srcAxis.c) : source.centroid.clone();
  const nC = nAxis ? new THREE.Vector3().fromArray(nAxis.c) : neighbor.centroid.clone();
  const distal = srcC.clone().sub(nC);
  if (distal.length() < 0.5) distal.set(1, 0, 0);
  const target = srcC.clone().add(distal.multiplyScalar(0.88));
  const geom = source.geometry.clone();
  geom.translate(-srcC.x, -srcC.y, -srcC.z);
  geom.scale(0.93, 0.93, 0.93);
  geom.translate(target.x, target.y, target.z);
  geom.computeBoundingBox();
  const clonedAxis = srcAxis
    ? {
        c: target.toArray(),
        x: new THREE.Vector3().fromArray(srcAxis.x).sub(srcC).add(target).toArray(),
        y: new THREE.Vector3().fromArray(srcAxis.y).sub(srcC).add(target).toArray(),
        z: new THREE.Vector3().fromArray(srcAxis.z).sub(srcC).add(target).toArray(),
      }
    : null;
  return {
    unn: spec.unn,
    geometry: geom,
    centroid: centroidOf(geom),
    axis: clonedAxis,
  };
}

async function exportGlb(scene, dest) {
  const exporter = new GLTFExporter();
  const data = await exporter.parseAsync(scene, {
    binary: true,
    onlyVisible: true,
  });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(data));
}

async function main() {
  if (!fs.existsSync(SRC)) {
    throw new Error(`Missing ${SRC}. Extract Open-Full-Jaw Patient_3 first.`);
  }

  const maxillaDir = path.join(SRC, "maxilla");
  const mandibleDir = path.join(SRC, "mandible");
  const maxillaAxes = loadAxes(path.join(maxillaDir, "axes_teeth_axes_maxilla.json"));
  const mandibleAxes = loadAxes(path.join(mandibleDir, "axes_teeth_axes_mandible.json"));

  console.log("Loading maxillary teeth…");
  const upper = loadArchTeeth(maxillaDir);
  console.log("Loading mandibular teeth…");
  const lower = loadArchTeeth(mandibleDir);

  for (const spec of WISDOM) {
    const arch = spec.unn <= 16 ? upper : lower;
    const axes = spec.unn <= 16 ? maxillaAxes : mandibleAxes;
    arch.push(cloneWisdom(arch, spec, axes));
    console.log(`  cloned wisdom UNN ${spec.unn} from ${spec.from}`);
  }

  console.log("Normalizing teeth into local crown space…");
  const scene = new THREE.Scene();
  scene.name = "AdultDentition";

  for (const t of [...upper, ...lower]) {
    const axes = t.unn <= 16 ? maxillaAxes : mandibleAxes;
    const axis = t.axis ?? axes.get(t.unn) ?? null;
    const geom = toLocalTooth(t.geometry, axis);
    const mesh = new THREE.Mesh(geom);
    mesh.name = `tooth_${UNN_TO_FDI[t.unn]}`;
    mesh.userData = { fdi: UNN_TO_FDI[t.unn], unn: t.unn };
    scene.add(mesh);
  }

  await exportGlb(scene, OUT_GLB);
  const mb = (fs.statSync(OUT_GLB).size / (1024 * 1024)).toFixed(2);
  console.log(`Wrote ${OUT_GLB} (${mb} MB)`);
  console.log(`Teeth in scene: ${scene.children.filter((c) => c.name.startsWith("tooth_")).length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
