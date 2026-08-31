export const UPPER_FDI = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
] as const;

export const LOWER_FDI = [
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
] as const;

export const ALL_FDI = [...UPPER_FDI, ...LOWER_FDI] as const;

export type FdiTooth = (typeof ALL_FDI)[number];

export type ToothKind = "incisor" | "canine" | "premolar" | "molar";

const fdiSet = new Set<number>(ALL_FDI);

export function isFdiTooth(value: number): value is FdiTooth {
  return fdiSet.has(value);
}

export function parseChartedTeeth(raw: string): number[] {
  const unique: number[] = [];
  const seen = new Set<number>();
  for (const part of raw.split(/[,\s]+/)) {
    const n = Number.parseInt(part, 10);
    if (isFdiTooth(n) && !seen.has(n)) {
      seen.add(n);
      unique.push(n);
    }
  }
  return unique;
}

export function toothKind(fdi: number): ToothKind {
  const digit = fdi % 10;
  if (digit <= 2) return "incisor";
  if (digit === 3) return "canine";
  if (digit <= 5) return "premolar";
  return "molar";
}

export function archSlot(fdi: number): { arch: "upper" | "lower"; index: number } {
  if (fdi >= 11 && fdi <= 18) return { arch: "upper", index: 18 - fdi };
  if (fdi >= 21 && fdi <= 28) return { arch: "upper", index: 7 + (fdi - 20) };
  if (fdi >= 41 && fdi <= 48) return { arch: "lower", index: 48 - fdi };
  return { arch: "lower", index: 7 + (fdi - 30) };
}

export function projectTooth(
  fdi: number,
  yaw: number,
): { x: number; y: number; z: number; visible: boolean } {
  const { arch, index } = archSlot(fdi);
  const angle = Math.PI * (1 - index / 15);
  const radiusX = 21.5;
  const radiusZ = 11.5;
  const x0 = Math.cos(angle) * radiusX;
  const z0 = Math.sin(angle) * radiusZ;
  // Studio photos turn toward a left-facing profile as |yaw| grows.
  const spin = Math.abs(yaw);
  const x = x0 * Math.cos(spin) - z0 * Math.sin(spin);
  const z = x0 * Math.sin(spin) + z0 * Math.cos(spin);
  const depth = 1 + z / 48;
  const yBase = arch === "upper" ? 44.2 : 55.8;
  const yLift = arch === "upper" ? -z * 0.1 : z * 0.1;
  return {
    x: 50 + x * depth,
    y: yBase + yLift,
    z,
    visible: z > -3.5,
  };
}
