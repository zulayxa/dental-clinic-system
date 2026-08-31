"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { DoubleSide, Float32BufferAttribute, Matrix4, type BufferGeometry, type Mesh } from "three";

import { getGumGeometry, toothLayout, toothSpec } from "@/lib/dental-anatomy";

const MODEL = "/models/adult-dentition.glb?v=30";

/** Upper-right 16–18 and lower-right 46–48 stay on their own corrected meshes.
 *  Contralateral left molars are never flipped from their own GLB — they are
 *  always rebuilt as a sagittal mirror of the locked right molars.
 *  Upper canines 13 and 23 are permanently 180° flipped (cusp toward bite). */
const FLIP_FDI = new Set([
  13, 23,
  16, 17, 18,
  45, 44, 43, 42, 41, 31, 32, 33, 34, 35,
  46, 47, 48,
]);
const FLIP_KEY = [...FLIP_FDI].sort((a, b) => a - b).join(",");

const UPPER_RIGHT_TO_LEFT = [
  [16, 26],
  [17, 27],
  [18, 28],
] as const;
const LOWER_RIGHT_TO_LEFT = [
  [46, 36],
  [47, 37],
  [48, 38],
] as const;
const MIRROR_SAGITTAL = new Matrix4().makeScale(-1, 1, 1);

/** Upper group scale.y is -1, so a positive local Y shift moves crowns toward the bite. */
const UPPER_ARCH_DROP = 0.03;
const TUCK_ROOT_FDI = new Set([16, 17, 18]);

const ENAMEL = "#f3ece1";
const ENAMEL_SELECTED = "#0369a1";
const GINGIVA = "#c23d52";

type JawSceneProps = {
  selected: number[];
  identified?: number | null;
  readOnly?: boolean;
  onToggle: (fdi: number) => void;
  onIdentify: (fdi: number) => void;
  onHover: (fdi: number | null) => void;
  dragRef: { current: { x: number; y: number; moved: boolean } };
};

function enamelMaterial(selected: boolean, vertexColors = false) {
  return (
    <meshPhysicalMaterial
      color={selected ? ENAMEL_SELECTED : ENAMEL}
      roughness={selected ? 0.32 : 0.2}
      metalness={selected ? 0.08 : 0.02}
      clearcoat={selected ? 0.35 : 1}
      clearcoatRoughness={selected ? 0.28 : 0.07}
      ior={1.46}
      sheen={selected ? 0.45 : 0.2}
      sheenColor={selected ? "#38bdf8" : "#fff7ee"}
      emissive={selected ? "#075985" : "#000000"}
      emissiveIntensity={selected ? 0.95 : 0}
      envMapIntensity={selected ? 0.4 : 1.15}
      vertexColors={vertexColors}
      side={DoubleSide}
    />
  );
}

function gumMaterial() {
  return (
    <meshPhysicalMaterial
      color={GINGIVA}
      roughness={0.28}
      metalness={0.02}
      clearcoat={0.95}
      clearcoatRoughness={0.16}
      sheen={0.7}
      sheenColor="#f4a3b2"
      envMapIntensity={0.8}
      polygonOffset
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
      side={DoubleSide}
    />
  );
}

function clamp01(t: number) {
  return Math.min(1, Math.max(0, t));
}

function smoothstep(t: number) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

function levelIncisalEdge(geometry: BufferGeometry) {
  const pos = geometry.getAttribute("position");
  if (!pos) return;
  geometry.computeBoundingBox();
  const maxY = geometry.boundingBox?.max.y ?? 0;
  if (maxY <= 1e-6) return;
  const band = maxY * 0.22;
  const start = maxY - band;
  const samples: number[] = [];
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y > start) samples.push(y);
  }
  if (samples.length === 0) return;
  samples.sort((a, b) => a - b);
  const target = samples[Math.floor(samples.length * 0.82)] ?? maxY;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y <= start) continue;
    const t = (y - start) / band;
    pos.setY(i, y + (target - y) * t);
  }
  pos.needsUpdate = true;
}

function shadeProximalContacts(geometry: BufferGeometry) {
  const pos = geometry.getAttribute("position");
  if (!pos) return;
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return;
  const hx = Math.max(Math.abs(box.min.x), Math.abs(box.max.x), 1e-6);
  const maxY = Math.max(box.max.y, 1e-6);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i += 1) {
    const proximal = smoothstep((Math.abs(pos.getX(i)) / hx - 0.48) / 0.4);
    const crown = clamp01(pos.getY(i) / maxY);
    const shade = 1 - 0.36 * proximal * (0.4 + 0.6 * crown);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade;
    colors[i * 3 + 2] = shade;
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
}

function finishAnteriorGeometry(fdi: number, geometry: BufferGeometry, owned: boolean) {
  const digit = fdi % 10;
  if (digit > 3) return geometry;
  const next = owned ? geometry : geometry.clone();
  if (digit <= 2) levelIncisalEdge(next);
  shadeProximalContacts(next);
  next.computeVertexNormals();
  next.computeBoundingBox();
  return next;
}
function tuckMolarRoots(geometry: BufferGeometry) {
  const tucked = geometry.clone();
  const pos = tucked.getAttribute("position");
  if (!pos) return tucked;
  tucked.computeBoundingBox();
  const minY = tucked.boundingBox?.min.y ?? -1;
  const apex = Math.min(-0.001, minY);
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i);
    if (y >= 0.02) continue;
    const t = Math.min(1, Math.max(0, (0.02 - y) / (0.02 - apex)));
    const shrink = 1 - 0.42 * t * t;
    pos.setX(i, pos.getX(i) * shrink);
    pos.setZ(i, pos.getZ(i) * shrink);
  }
  tucked.computeBoundingBox();
  tucked.computeVertexNormals();
  return tucked;
}

function useToothGeometries() {
  const gltf = useGLTF(MODEL);

  return useMemo(() => {
    const map = new Map<number, BufferGeometry>();
    gltf.scene.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh || !mesh.name.startsWith("tooth_")) return;
      const fdi = Number.parseInt(mesh.name.slice(6), 10);
      if (!Number.isFinite(fdi)) return;
      if (FLIP_FDI.has(fdi)) {
        const flipped = mesh.geometry.clone();
        flipped.rotateX(Math.PI);
        flipped.computeBoundingBox();
        flipped.computeVertexNormals();
        const processed = TUCK_ROOT_FDI.has(fdi) ? tuckMolarRoots(flipped) : flipped;
        map.set(fdi, finishAnteriorGeometry(fdi, processed, true));
      } else {
        map.set(fdi, finishAnteriorGeometry(fdi, mesh.geometry, false));
      }
    });
    for (const [right, left] of [...UPPER_RIGHT_TO_LEFT, ...LOWER_RIGHT_TO_LEFT]) {
      const source = map.get(right);
      if (!source) continue;
      const mirrored = source.clone();
      mirrored.applyMatrix4(MIRROR_SAGITTAL);
      mirrored.computeBoundingBox();
      mirrored.computeVertexNormals();
      map.set(left, finishAnteriorGeometry(left, mirrored, true));
    }
    return map;
  }, [gltf, FLIP_KEY, "incisal-level-ao-v2"]);
}

function toothScale(fdi: number, geometry: BufferGeometry, slot: number): [number, number, number] {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  if (!box) return [1, 1, 1];
  const spec = toothSpec(fdi);
  const md = Math.max(0.001, box.max.x - box.min.x);
  const bl = Math.max(0.001, box.max.z - box.min.z);
  const crown = Math.max(0.001, box.max.y);
  const root = Math.max(0.001, -box.min.y);
  const alongArch = (slot * (fdi % 10 <= 3 ? 1.1 : 0.97)) / md;
  const throughGum = Math.min(alongArch * 0.92, (spec.bl * 0.72) / bl);
  const alongLong = Math.min(0.26 / crown, 0.2 / root);
  return [alongArch, alongLong, throughGum];
}

function occlusalEdgeY(y: number, scaleY: number, geometry: BufferGeometry) {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  return y + scaleY * (geometry.boundingBox?.max.y ?? 0);
}

type LayoutTooth = ReturnType<typeof toothLayout>[number];

function resolveUpperLowerPose(
  fdi: number,
  layout: LayoutTooth,
  teeth: LayoutTooth[],
  geometries: Map<number, BufferGeometry>,
) {
  const geometry = geometries.get(fdi);
  if (!geometry) return null;
  const { x, y, z, yaw, labialTilt, slot } = layout;
  const upperPair = UPPER_RIGHT_TO_LEFT.find(([, left]) => left === fdi);
  const lowerPair = LOWER_RIGHT_TO_LEFT.find(([, left]) => left === fdi);
  const pair = upperPair ?? lowerPair;
  const rightTooth = pair ? teeth.find((tooth) => tooth.fdi === pair[0]) : undefined;
  const rightGeometry = pair ? geometries.get(pair[0]) : undefined;
  const scale =
    rightTooth && rightGeometry
      ? toothScale(pair[0], rightGeometry, rightTooth.slot)
      : toothScale(fdi, geometry, slot);
  const pose =
    upperPair && rightTooth
      ? {
          x: -rightTooth.x,
          y: rightTooth.y,
          z: rightTooth.z,
          yaw: -rightTooth.yaw,
          labialTilt: rightTooth.labialTilt,
        }
      : { x, y, z, yaw, labialTilt };
  return { fdi, geometry, scale, ...pose, spee: layout.spee };
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.42} />
      <spotLight
        position={[3.2, 4.6, 4.4]}
        angle={0.5}
        penumbra={0.88}
        intensity={2.2}
        color="#fff4ec"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight
        position={[-3.4, 2.4, 3.2]}
        angle={0.62}
        penumbra={1}
        intensity={0.5}
        color="#67e8f9"
      />
      <pointLight position={[0, 0, 1.8]} intensity={0.55} color="#fff4e5" />
      <pointLight position={[0, 2.2, -2.4]} intensity={0.22} color="#fff7ed" />
    </>
  );
}

function Arch({
  arch,
  geometries,
  selectedSet,
  identified,
  readOnly,
  onToggle,
  onIdentify,
  onHover,
  dragRef,
}: {
  arch: "upper" | "lower";
  geometries: Map<number, BufferGeometry>;
  selectedSet: Set<number>;
  identified: number | null;
  readOnly?: boolean;
  onToggle: (fdi: number) => void;
  onIdentify: (fdi: number) => void;
  onHover: (fdi: number | null) => void;
  dragRef: JawSceneProps["dragRef"];
}) {
  const gum = useMemo(() => getGumGeometry(arch), [arch]);
  const teeth = useMemo(() => toothLayout(arch), [arch]);
  const upper = arch === "upper";
  const placed = useMemo(() => {
    const rows = teeth
      .map((layout) => resolveUpperLowerPose(layout.fdi, layout, teeth, geometries))
      .filter((row) => row !== null);
    if (!upper) {
      const withSpee = rows.map((row) => ({
        ...row,
        y: row.y + row.spee,
      }));
      const incisors = withSpee.filter((row) => row.fdi % 10 <= 2);
      const centrals = incisors.filter((row) => row.fdi === 31 || row.fdi === 41);
      if (incisors.length === 0) return withSpee;
      const target =
        centrals.length > 0
          ? centrals.reduce((sum, row) => sum + occlusalEdgeY(row.y, row.scale[1], row.geometry), 0) /
            centrals.length
          : incisors.reduce((sum, row) => sum + occlusalEdgeY(row.y, row.scale[1], row.geometry), 0) /
            incisors.length;
      return withSpee.map((row) => {
        if (row.fdi % 10 > 2) return row;
        const edge = occlusalEdgeY(row.y, row.scale[1], row.geometry);
        return { ...row, y: row.y + (target - edge) };
      });
    }
    const centrals = rows.filter((row) => row.fdi === 11 || row.fdi === 21);
    const occlusals = rows.map((row) => occlusalEdgeY(row.y, row.scale[1], row.geometry));
    const target =
      centrals.length > 0
        ? centrals.reduce((sum, row) => sum + occlusalEdgeY(row.y, row.scale[1], row.geometry), 0) /
          centrals.length
        : occlusals.slice().sort((a, b) => a - b)[Math.floor(occlusals.length / 2)] ?? 0;
    return rows.map((row, index) => ({
      ...row,
      y: row.y + (target - occlusals[index]) + UPPER_ARCH_DROP + row.spee,
    }));
  }, [arch, geometries, teeth, upper]);

  return (
    <group position={[0, upper ? 0.46 : -0.46, 0]} scale={[1, upper ? -1 : 1, 1]}>
      <mesh geometry={gum} castShadow receiveShadow frustumCulled={false} raycast={() => undefined}>
        {gumMaterial()}
      </mesh>
      {placed.map(({ fdi, x, y, z, yaw, labialTilt, scale, geometry }) => {
        const digit = fdi % 10;
        const incisalTilt = digit <= 2 ? 0 : labialTilt;
        return (
          <group
            key={fdi}
            position={[x, y, z]}
            rotation={[incisalTilt, yaw, 0]}
            scale={scale}
          >
            <mesh
              name={`tooth_${fdi}`}
              geometry={geometry}
              castShadow
              receiveShadow
              frustumCulled={false}
              onPointerOver={(event) => {
                event.stopPropagation();
                onHover(fdi);
              }}
              onPointerOut={() => onHover(null)}
              onPointerDown={(event) => {
                event.stopPropagation();
                dragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  moved: false,
                };
                onIdentify(fdi);
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (dragRef.current.moved) return;
                if (readOnly) return;
                onToggle(fdi);
              }}
            >
              {enamelMaterial(selectedSet.has(fdi), digit <= 3)}
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function JawScene({
  selected,
  identified = null,
  readOnly,
  onToggle,
  onIdentify,
  onHover,
  dragRef,
}: JawSceneProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const geometries = useToothGeometries();

  return (
    <group rotation={[0.1, 0.32, 0]}>
      <Lights />
      <Arch
        arch="upper"
        geometries={geometries}
        selectedSet={selectedSet}
        identified={identified}
        readOnly={readOnly}
        onToggle={onToggle}
        onIdentify={onIdentify}
        onHover={onHover}
        dragRef={dragRef}
      />
      <Arch
        arch="lower"
        geometries={geometries}
        selectedSet={selectedSet}
        identified={identified}
        readOnly={readOnly}
        onToggle={onToggle}
        onIdentify={onIdentify}
        onHover={onHover}
        dragRef={dragRef}
      />
    </group>
  );
}

useGLTF.preload(MODEL);
