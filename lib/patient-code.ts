export const PATIENT_CODE_PREFIX = "P-";
export const PATIENT_CODE_START = 1001;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim());
}

export function parsePatientCodeNumber(code: string | null | undefined) {
  const match = code?.trim().match(/^P-(\d+)$/i);
  if (!match) return null;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : null;
}

export function formatPatientCode(sequence: number) {
  return `${PATIENT_CODE_PREFIX}${sequence}`;
}

/** Normalize lookup input: "#p-1001", "p-1001", and "1001" all become "P-1001". */
export function normalizePatientCode(raw: string) {
  const value = raw.trim().replace(/^#/, "").toUpperCase();
  if (/^P-\d+$/.test(value)) return value;
  if (/^\d+$/.test(value)) return formatPatientCode(Number.parseInt(value, 10));
  return value;
}

export function nextCodeFromExisting(codes: Array<string | null | undefined>) {
  let max = PATIENT_CODE_START - 1;
  for (const code of codes) {
    const n = parsePatientCodeNumber(code);
    if (n != null && n > max) max = n;
  }
  return formatPatientCode(max + 1);
}

export function patientCodeMatches(code: string | null | undefined, needle: string) {
  if (!code || !needle) return false;
  const hay = code.toLowerCase().replace(/-/g, "");
  const query = needle.toLowerCase().replace(/^#/, "").replace(/-/g, "");
  if (!query) return false;
  return (
    hay.includes(query) ||
    code.toLowerCase().includes(needle.toLowerCase()) ||
    `#${code.toLowerCase()}`.includes(needle.toLowerCase())
  );
}
