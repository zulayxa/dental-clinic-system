export type ToothIdentity = {
  fdi: number;
  universal: number;
  name: string;
  arch: "upper" | "lower";
};

const TOOTH_IDENTITIES: readonly ToothIdentity[] = [
  { fdi: 18, universal: 1, arch: "upper", name: "Upper right third molar (wisdom)" },
  { fdi: 17, universal: 2, arch: "upper", name: "Upper right second molar" },
  { fdi: 16, universal: 3, arch: "upper", name: "Upper right first molar" },
  { fdi: 15, universal: 4, arch: "upper", name: "Upper right second premolar" },
  { fdi: 14, universal: 5, arch: "upper", name: "Upper right first premolar" },
  { fdi: 13, universal: 6, arch: "upper", name: "Upper right canine" },
  { fdi: 12, universal: 7, arch: "upper", name: "Upper right lateral incisor" },
  { fdi: 11, universal: 8, arch: "upper", name: "Upper right central incisor" },
  { fdi: 21, universal: 9, arch: "upper", name: "Upper left central incisor" },
  { fdi: 22, universal: 10, arch: "upper", name: "Upper left lateral incisor" },
  { fdi: 23, universal: 11, arch: "upper", name: "Upper left canine" },
  { fdi: 24, universal: 12, arch: "upper", name: "Upper left first premolar" },
  { fdi: 25, universal: 13, arch: "upper", name: "Upper left second premolar" },
  { fdi: 26, universal: 14, arch: "upper", name: "Upper left first molar" },
  { fdi: 27, universal: 15, arch: "upper", name: "Upper left second molar" },
  { fdi: 28, universal: 16, arch: "upper", name: "Upper left third molar (wisdom)" },
  { fdi: 38, universal: 17, arch: "lower", name: "Lower left third molar (wisdom)" },
  { fdi: 37, universal: 18, arch: "lower", name: "Lower left second molar" },
  { fdi: 36, universal: 19, arch: "lower", name: "Lower left first molar" },
  { fdi: 35, universal: 20, arch: "lower", name: "Lower left second premolar" },
  { fdi: 34, universal: 21, arch: "lower", name: "Lower left first premolar" },
  { fdi: 33, universal: 22, arch: "lower", name: "Lower left canine" },
  { fdi: 32, universal: 23, arch: "lower", name: "Lower left lateral incisor" },
  { fdi: 31, universal: 24, arch: "lower", name: "Lower left central incisor" },
  { fdi: 41, universal: 25, arch: "lower", name: "Lower right central incisor" },
  { fdi: 42, universal: 26, arch: "lower", name: "Lower right lateral incisor" },
  { fdi: 43, universal: 27, arch: "lower", name: "Lower right canine" },
  { fdi: 44, universal: 28, arch: "lower", name: "Lower right first premolar" },
  { fdi: 45, universal: 29, arch: "lower", name: "Lower right second premolar" },
  { fdi: 46, universal: 30, arch: "lower", name: "Lower right first molar" },
  { fdi: 47, universal: 31, arch: "lower", name: "Lower right second molar" },
  { fdi: 48, universal: 32, arch: "lower", name: "Lower right third molar (wisdom)" },
];

const TOOTH_BY_FDI = new Map(TOOTH_IDENTITIES.map((tooth) => [tooth.fdi, tooth]));

export function toothIdentity(fdi: number): ToothIdentity | null {
  return TOOTH_BY_FDI.get(fdi) ?? null;
}

export function formatToothIdentity(fdi: number) {
  const tooth = toothIdentity(fdi);
  if (!tooth) return null;
  return {
    ...tooth,
    numbers: `Tooth #${tooth.universal} · FDI ${tooth.fdi}`,
  };
}

export function isUpperTooth(fdi: number) {
  const quadrant = Math.floor(fdi / 10);
  return quadrant === 1 || quadrant === 2;
}

/** Patient's left (screen-right in the default view): quadrants 2 and 3. */
export function isPatientLeftTooth(fdi: number) {
  const quadrant = Math.floor(fdi / 10);
  return quadrant === 2 || quadrant === 3;
}

export const MAX_SELECTED_TEETH = 16;
