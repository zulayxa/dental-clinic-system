import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

import { LOWER_FDI, UPPER_FDI, toothKind, type ToothKind } from "@/lib/dental-chart";

const ARCH_RX = 1.22;
const ARCH_RZ = 1.55;
const ARCH_N_FRONT = 1.92;
const ARCH_N_BACK = 2.55;
const GUM_WRAP = 0.92;
const TOOTH_WRAP = 0.5;
const TOOTH_SCALE = 1.58;

type ToothSpec = {
  kind: ToothKind;
  md: number;
  bl: number;
  crownH: number;
  radius: number;
  cusp: number;
};

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function superellipse(angle: number, rx: number, rz: number, n: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return new THREE.Vector3(
    Math.sign(c) * rx * Math.abs(c) ** (2 / n),
    0,
    Math.sign(s) * rz * Math.abs(s) ** (2 / n),
  );
}

function archExponent(t: number) {
  const anterior = Math.pow(Math.sin(clamp01(t) * Math.PI), 1.2);
  return lerp(ARCH_N_BACK, ARCH_N_FRONT, anterior);
}

function archPoint(t: number, scale = 1, wrap = GUM_WRAP) {
  const a0 = Math.PI + wrap;
  const a1 = -wrap;
  const a = a0 + (a1 - a0) * clamp01(t);
  const anterior = Math.sin(clamp01(t) * Math.PI);
  const rx = ARCH_RX * scale * lerp(1.08, 0.52, anterior);
  const rz = ARCH_RZ * scale;
  return superellipse(a, rx, rz, archExponent(t));
}

function archScale(arch: "upper" | "lower") {
  return arch === "upper" ? 1.04 : 0.96;
}

export function toothSpec(fdi: number): ToothSpec {
  const digit = fdi % 10;
  const upper = fdi < 30;
  const kind = toothKind(fdi);

  const byDigit: Record<number, Omit<ToothSpec, "kind">> = {
    1: {
      md: upper ? 0.168 : 0.128,
      bl: upper ? 0.1 : 0.092,
      crownH: upper ? 0.236 : 0.192,
      radius: 0.01,
      cusp: 0,
    },
    2: {
      md: upper ? 0.118 : 0.112,
      bl: upper ? 0.092 : 0.088,
      crownH: upper ? 0.2 : 0.178,
      radius: 0.012,
      cusp: 0,
    },
    3: {
      md: 0.128,
      bl: upper ? 0.126 : 0.118,
      crownH: 0.248,
      radius: 0.02,
      cusp: 0.048,
    },
    4: {
      md: 0.142,
      bl: upper ? 0.168 : 0.154,
      crownH: 0.168,
      radius: 0.024,
      cusp: 0.028,
    },
    5: {
      md: 0.148,
      bl: upper ? 0.174 : 0.16,
      crownH: 0.16,
      radius: 0.024,
      cusp: 0.026,
    },
    6: {
      md: upper ? 0.218 : 0.228,
      bl: upper ? 0.198 : 0.182,
      crownH: 0.152,
      radius: 0.028,
      cusp: 0.032,
    },
    7: {
      md: upper ? 0.208 : 0.216,
      bl: upper ? 0.188 : 0.176,
      crownH: 0.146,
      radius: 0.026,
      cusp: 0.028,
    },
    8: {
      md: 0.178,
      bl: 0.164,
      crownH: 0.134,
      radius: 0.024,
      cusp: 0.022,
    },
  };

  const spec = { kind, ...byDigit[digit] };
  return {
    ...spec,
    md: spec.md * TOOTH_SCALE,
    bl: spec.bl * TOOTH_SCALE,
    crownH: spec.crownH * TOOTH_SCALE,
    radius: spec.radius * TOOTH_SCALE,
    cusp: spec.cusp * TOOTH_SCALE,
  };
}

function weld(geometry: THREE.BufferGeometry) {
  const merged = mergeVertices(geometry, 1e-4);
  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

function archFrame(t: number, scale = 1, wrap = GUM_WRAP) {
  const p = archPoint(t, scale, wrap);
  const p1 = archPoint(Math.min(1, t + 0.004), scale, wrap);
  const p0 = archPoint(Math.max(0, t - 0.004), scale, wrap);
  const tangent = new THREE.Vector3().subVectors(p1, p0).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const outward = new THREE.Vector3().crossVectors(tangent, up);
  if (outward.dot(p) < 0) outward.negate();
  if (outward.lengthSq() < 1e-8) {
    outward.set(Math.sign(p.x) || 1, 0, 0);
  }
  outward.normalize();
  const binormal = new THREE.Vector3().crossVectors(outward, tangent).normalize();
  return { p, tangent, outward, binormal };
}

function posteriorness(t: number) {
  return Math.abs(2 * clamp01(t) - 1);
}

/** Local +Y toward the bite. 0 through incisors/canines, full at the molar ends. */
export function speeTowardBite(post: number) {
  const u = smoothstep((post - 0.36) / 0.48);
  return 0.105 * u;
}

/** 1 at the midline, 0 by the premolars so sides/back stay on the original arch. */
function anteriorFlatten(t: number) {
  return smoothstep((0.52 - posteriorness(t)) / 0.42);
}

function flattenAnteriorXZ(x: number, z: number, t: number, arch: "upper" | "lower") {
  const f = anteriorFlatten(t);
  if (f <= 1e-6) return { x, z };
  const widen = 1 + 0.42 * f;
  const retract = arch === "upper" ? 0.13 : 0.16;
  return { x: x * widen, z: z * (1 - retract * f) };
}

function createAlveolarGeometry(arch: "upper" | "lower") {
  const scale = archScale(arch);
  const bodyRings = 168;
  const capRings = 14;
  const radial = 36;
  const totalRings = capRings + bodyRings + capRings;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= totalRings; i += 1) {
    let t = 0;
    let cap = 1;
    let along = 0;
    if (i < capRings) {
      const phi = (i / capRings) * (Math.PI / 2);
      cap = Math.sin(phi);
      along = -Math.cos(phi);
      t = 0;
    } else if (i > capRings + bodyRings) {
      const phi = ((i - capRings - bodyRings) / capRings) * (Math.PI / 2);
      cap = Math.cos(phi);
      along = Math.sin(phi);
      t = 1;
    } else {
      t = (i - capRings) / bodyRings;
    }

    const { p, tangent, outward, binormal } = archFrame(t, scale);
    const post = posteriorness(t);
    const spee = speeTowardBite(post);
    const width = lerp(0.22, 0.58, post) * cap;
    const height = lerp(0.44, 0.62, post) * cap;
    const capLen = lerp(0.32, 0.52, post);
    const cx0 = p.x + tangent.x * along * capLen;
    const cy = p.y + tangent.y * along * capLen + spee;
    const cz0 = p.z + tangent.z * along * capLen;
    const { x: cx, z: cz } = flattenAnteriorXZ(cx0, cz0, t, arch);
    const papilla = Math.pow(Math.abs(Math.sin(t * Math.PI * 16)), 1.35);
    const eminence = Math.pow(Math.abs(Math.cos(t * Math.PI * 16)), 1.2);

    for (let j = 0; j <= radial; j += 1) {
      const v = (j / radial) * Math.PI * 2;
      const c = Math.cos(v);
      const s = Math.sin(v);
      const n = 6.2;
      let localOut = Math.sign(c) * (width / 2) * Math.abs(c) ** (2 / n);
      let localUp = Math.sign(s) * (height / 2) * Math.abs(s) ** (2 / n) - height * 0.22;
      if (localUp > height * 0.12) {
        localUp += 0.028 * papilla * smoothstep((localUp + height * 0.05) / (height * 0.35));
      }
      if (localOut > 0) {
        const mid = 1 - Math.abs(localUp / (height * 0.5));
        localOut += 0.038 * eminence * Math.max(0, mid);
      }
      positions.push(
        cx + outward.x * localOut + binormal.x * localUp,
        cy + outward.y * localOut + binormal.y * localUp,
        cz + outward.z * localOut + binormal.z * localUp,
      );
    }
  }

  const cols = radial + 1;
  for (let i = 0; i < totalRings; i += 1) {
    for (let j = 0; j < radial; j += 1) {
      const a = i * cols + j;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return weld(geometry);
}

function coverUpperMolarGum(geometry: THREE.BufferGeometry) {
  const layout = toothLayout("upper");
  const pos = geometry.getAttribute("position");
  if (!pos) return geometry;
  for (const fdi of [16, 17, 26, 27]) {
    const molar = layout.find((tooth) => tooth.fdi === fdi);
    if (!molar) continue;
    const ox = Math.sin(molar.yaw);
    const oz = Math.cos(molar.yaw);
    const tx = -oz;
    const tz = ox;
    const cx = molar.x;
    const cy = molar.y + molar.spee + 0.03;
    const cz = molar.z;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const dx = x - cx;
      const dy = y - cy;
      const dz = z - cz;
      const out = dx * ox + dz * oz;
      if (out < -0.02) continue;
      const along = dx * tx + dz * tz;
      const r2 = (along / 0.13) ** 2 + (dy / 0.13) ** 2 + (Math.max(0, 0.02 - out) / 0.08) ** 2;
      const weight = Math.exp(-r2);
      if (weight < 0.03) continue;
      const push = 0.1 * weight;
      pos.setXYZ(i, x + ox * push, y + 0.018 * weight, z + oz * push);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

const gumCache = new Map<string, THREE.BufferGeometry>();

export function getGumGeometry(arch: "upper" | "lower") {
  const key = `gum-16-${arch}`;
  const cached = gumCache.get(key);
  if (cached) return cached;
  let geometry = createAlveolarGeometry(arch);
  if (arch === "upper") geometry = coverUpperMolarGum(geometry);
  gumCache.set(key, geometry);
  return geometry;
}

function sampleArch(scale: number, wrap: number, steps = 200) {
  const points: THREE.Vector3[] = [];
  const lengths = [0];
  for (let i = 0; i <= steps; i += 1) {
    points.push(archPoint(i / steps, scale, wrap));
    if (i > 0) lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]));
  }
  return { points, lengths, total: lengths[lengths.length - 1], scale };
}

function tAtLength(length: number, path: ReturnType<typeof sampleArch>) {
  const target = Math.min(path.total, Math.max(0, length));
  let i = 1;
  while (i < path.lengths.length && path.lengths[i] < target) i += 1;
  const a = path.lengths[i - 1];
  const b = path.lengths[i];
  const u = b === a ? 0 : (target - a) / (b - a);
  const t = (i - 1 + u) / (path.points.length - 1);
  return clamp01(t);
}

function pointOnPolyline(
  pts: { x: number; z: number }[],
  cum: number[],
  s: number,
) {
  const total = cum[cum.length - 1];
  const t = Math.min(total, Math.max(0, s));
  let i = 1;
  while (i < cum.length && cum[i] < t) i += 1;
  const a = cum[i - 1];
  const b = cum[i] ?? a;
  const u = b === a ? 0 : (t - a) / (b - a);
  const p0 = pts[i - 1];
  const p1 = pts[i] ?? p0;
  return { x: p0.x + (p1.x - p0.x) * u, z: p0.z + (p1.z - p0.z) * u };
}

function packAnteriorContacts<T extends { fdi: number; x: number; z: number; slot: number }>(
  rows: T[],
): T[] {
  const idx: number[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].fdi % 10 <= 3) idx.push(i);
  }
  if (idx.length < 2) return rows;
  const pts = idx.map((i) => ({ x: rows[i].x, z: rows[i].z, slot: rows[i].slot }));
  const cum = [0];
  for (let k = 1; k < pts.length; k += 1) {
    cum.push(cum[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].z - pts[k - 1].z));
  }
  const currentLen = cum[cum.length - 1];
  if (currentLen < 1e-6) return rows;
  const desired = [0];
  for (let k = 1; k < pts.length; k += 1) {
    desired.push(desired[k - 1] + 0.5 * (pts[k - 1].slot + pts[k].slot) * 0.86);
  }
  const desiredLen = desired[desired.length - 1];
  const start = (currentLen - desiredLen) / 2;
  return rows.map((row, i) => {
    const k = idx.indexOf(i);
    if (k < 0) return row;
    const p = pointOnPolyline(pts, cum, start + desired[k]);
    const prev = pointOnPolyline(pts, cum, start + desired[Math.max(0, k - 1)]);
    const next = pointOnPolyline(pts, cum, start + desired[Math.min(desired.length - 1, k + 1)]);
    let ox = next.z - prev.z;
    let oz = prev.x - next.x;
    if (ox * p.x + oz * p.z < 0) {
      ox = -ox;
      oz = -oz;
    }
    return { ...row, x: p.x, z: p.z, yaw: Math.atan2(ox, oz) };
  });
}

export function toothLayout(arch: "upper" | "lower") {
  const list = arch === "upper" ? UPPER_FDI : LOWER_FDI;
  const scale = archScale(arch);
  const widths = list.map((fdi) => toothSpec(fdi).md);
  let occupied = widths.reduce((sum, w) => sum + w, 0);
  const path = sampleArch(scale, TOOTH_WRAP);
  const fit = occupied > 1e-6 ? (path.total * 0.994) / occupied : 1;
  for (let i = 0; i < widths.length; i += 1) widths[i] *= fit;
  occupied *= fit;
  const pad = Math.max(0, (path.total - occupied) / 2);
  let cursor = pad;
  const rows = list.map((fdi, index) => {
    const t = tAtLength(cursor + widths[index] / 2, path);
    cursor += widths[index];
    const { p, outward } = archFrame(t, scale, TOOTH_WRAP);
    const digit = fdi % 10;
    const post = posteriorness(t);
    const labialTilt = digit <= 2 ? 0.04 : digit === 3 ? 0.03 : 0;
    const height = lerp(0.44, 0.62, post);
    const crest = height * 0.28;
    const labial = 0.008 + post * 0.012;
    const spee = speeTowardBite(post);
    const placed = flattenAnteriorXZ(p.x + outward.x * labial, p.z + outward.z * labial, t, arch);
    return {
      fdi,
      x: placed.x,
      y: crest - 0.02,
      z: placed.z,
      yaw: Math.atan2(outward.x, outward.z),
      labialTilt,
      slot: widths[index],
      spee,
    };
  });
  return packAnteriorContacts(rows);
}
