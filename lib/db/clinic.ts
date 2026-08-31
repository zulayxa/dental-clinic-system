import { readFile } from "node:fs/promises";
import path from "node:path";

import {
  getDoctorAvatarUrl,
  registrationStats,
} from "@/lib/db/clinic-profile";
import { listPatients, primaryIssue } from "@/lib/db/patients";

export type DoctorProfile = {
  name: string;
  nameKurdish: string;
  title: string;
  specialty: string;
  license: string;
  clinic: string;
  email: string;
  hours: string;
  chairs: number;
};

type ClinicOpsFile = {
  doctor: DoctorProfile;
};

function opsFile() {
  return path.join(process.cwd(), "data", "clinic-ops.json");
}

async function loadOps() {
  const raw = await readFile(opsFile(), "utf8");
  return JSON.parse(raw) as ClinicOpsFile;
}

export function formatUsd(value: number) {
  const amount = new Intl.NumberFormat("en", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return `${amount} IQD`;
}

export async function getDoctorDashboard() {
  const [ops, patients] = await Promise.all([loadOps(), listPatients()]);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const activeCases = patients.filter((patient) =>
    /active|in treatment/i.test(primaryIssue(patient).status),
  ).length;

  return {
    doctor: ops.doctor,
    generatedAt: now.toISOString(),
    todayLabel: new Intl.DateTimeFormat("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now),
    roster: {
      registered: patients.length,
      activeCases,
      chairs: ops.doctor.chairs,
    },
    avatarUrl: await getDoctorAvatarUrl(),
    profile: registrationStats(patients, today),
  };
}

export type DoctorDashboardData = Awaited<ReturnType<typeof getDoctorDashboard>>;
