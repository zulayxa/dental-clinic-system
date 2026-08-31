import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type { PatientRecord } from "@/lib/db/patients";

export const DEFAULT_AVATAR_URL = "/doctor-avatar.png";
export const SHARE_40 = 0.4;
export const SHARE_60 = 0.6;

const PROFILE_FILE = () => path.join(process.cwd(), "data", "clinic-profile.json");
const UPLOAD_DIR = () => path.join(process.cwd(), "public", "uploads");

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

type StoredProfile = {
  avatarUrl?: string;
  updatedAt?: string;
};

export type PeriodTotals = {
  visits: number;
  collected: number;
  share40: number;
  share60: number;
};

export type ProfilePeriodKey = "daily" | "weekly" | "monthly" | "yearly";

export type ProfileAnalytics = Record<ProfilePeriodKey, PeriodTotals>;

function isoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isoDay(value: string | null | undefined) {
  if (!value) return null;
  const day = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

export function parseCollected(price: string | null | undefined) {
  if (!price) return 0;
  const amount = Number.parseFloat(price.replace(/,/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

export function splitCollected(amount: number): Omit<PeriodTotals, "visits"> {
  const collected = Math.round(amount);
  const share40 = Math.round(collected * SHARE_40);
  return {
    collected,
    share40,
    share60: collected - share40,
  };
}

function registrationDay(patient: PatientRecord) {
  return isoDay(patient.visitDate) ?? isoDay(patient.createdAt);
}

function sumRegistrations(
  patients: PatientRecord[],
  fromIso: string,
  toIso: string,
): PeriodTotals {
  let visits = 0;
  let collected = 0;
  for (const patient of patients) {
    const day = registrationDay(patient);
    if (!day || day < fromIso || day > toIso) continue;
    visits += 1;
    collected += parseCollected(patient.price);
  }
  return { visits, ...splitCollected(collected) };
}

export function registrationStats(
  patients: PatientRecord[],
  today: Date,
): ProfileAnalytics {
  const todayIso = isoDate(today);
  return {
    daily: sumRegistrations(patients, todayIso, todayIso),
    weekly: sumRegistrations(patients, isoDate(addDays(today, -6)), todayIso),
    monthly: sumRegistrations(patients, isoDate(addDays(today, -29)), todayIso),
    yearly: sumRegistrations(
      patients,
      isoDate(new Date(today.getFullYear(), 0, 1)),
      todayIso,
    ),
  };
}

async function readStoredProfile(): Promise<StoredProfile> {
  try {
    const raw = await readFile(PROFILE_FILE(), "utf8");
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return {};
  }
}

export async function getDoctorAvatarUrl() {
  const stored = await readStoredProfile();
  const url = stored.avatarUrl?.trim();
  if (!url) return DEFAULT_AVATAR_URL;
  const bust = stored.updatedAt ? `?v=${encodeURIComponent(stored.updatedAt)}` : "";
  return `${url}${bust}`;
}

export function avatarExtensionFor(type: string) {
  return IMAGE_TYPES[type] ?? null;
}

export async function saveDoctorAvatar(buffer: Buffer, mimeType: string) {
  const ext = avatarExtensionFor(mimeType);
  if (!ext) {
    throw new Error("Unsupported image type.");
  }

  await mkdir(UPLOAD_DIR(), { recursive: true });
  const filename = `doctor-avatar.${ext}`;
  const dest = path.join(UPLOAD_DIR(), filename);

  for (const leftover of Object.values(IMAGE_TYPES)) {
    if (leftover === ext) continue;
    await unlink(path.join(UPLOAD_DIR(), `doctor-avatar.${leftover}`)).catch(
      () => undefined,
    );
  }

  await writeFile(dest, buffer);

  const avatarUrl = `/uploads/${filename}`;
  const updatedAt = new Date().toISOString();
  await writeFile(
    PROFILE_FILE(),
    `${JSON.stringify({ avatarUrl, updatedAt }, null, 2)}\n`,
    "utf8",
  );

  return `${avatarUrl}?v=${encodeURIComponent(updatedAt)}`;
}
