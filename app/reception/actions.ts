"use server";

import { findPatientById, searchPatients } from "@/lib/db/patients";
import type {
  DiseaseRecord,
  MedicalHistoryEntry,
  PatientRecord,
  TreatmentRecord,
} from "@/lib/db/patients";

export type PatientChart = {
  id: string;
  code: string;
  name: string;
  dateOfBirth: string;
  sex: string;
  phone: string;
  email: string;
  allergies: string[];
  medicalHistory: MedicalHistoryEntry[];
  diseases: DiseaseRecord[];
  treatments: TreatmentRecord[];
};

export type PatientMatch = {
  id: string;
  code: string;
  name: string;
  phone: string;
};

export type PatientSearchState =
  | { status: "idle"; message?: string; patient?: undefined; matches?: undefined }
  | { status: "error"; message: string; patient?: undefined; matches?: undefined }
  | { status: "success"; message?: string; patient: PatientChart; matches?: undefined }
  | { status: "many"; message?: string; patient?: undefined; matches: PatientMatch[] };

function toChart(record: PatientRecord): PatientChart {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    dateOfBirth: record.dateOfBirth,
    sex: record.sex,
    phone: record.phone,
    email: record.email,
    allergies: record.allergies,
    medicalHistory: record.medicalHistory,
    diseases: record.diseases,
    treatments: record.treatments,
  };
}

function toMatch(record: PatientRecord): PatientMatch {
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    phone: record.phone,
  };
}

export async function searchPatientById(
  _previousState: PatientSearchState,
  formData: FormData,
): Promise<PatientSearchState> {
  const raw = String(formData.get("patientId") ?? "").trim();

  if (!raw) {
    return { status: "idle" };
  }

  if (raw.length < 2) {
    return {
      status: "error",
      message: "Type a patient code, name, or phone number.",
    };
  }

  const exact = await findPatientById(raw);
  if (exact) {
    return {
      status: "success",
      patient: toChart(exact),
    };
  }

  const records = await searchPatients(raw);

  if (records.length === 1 && records[0]) {
    return {
      status: "success",
      patient: toChart(records[0]),
    };
  }

  if (records.length > 1) {
    return {
      status: "many",
      matches: records.map(toMatch),
    };
  }

  return {
    status: "error",
    message: `No patient found for “${raw}”.`,
  };
}
