import { formatClinicDate } from "@/lib/dates";
import { parseChartedTeeth } from "@/lib/dental-chart";
import {
  formatPatientCode,
  isUuid,
  nextCodeFromExisting,
  normalizePatientCode,
  parsePatientCodeNumber,
} from "@/lib/patient-code";
import { newestFirst } from "@/lib/patient-sort";
import {
  buildPatientSearchOrFilter,
  matchesPatientSearch,
  phoneDigits,
} from "@/lib/patient-search";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  PATIENT_TABLE,
  QUEUE_ACTIVE_STATUSES,
  QUEUE_DONE_STATUS,
  ticketFromRow,
  type PatientRow,
  type WaitingTicket,
} from "@/lib/supabase/patient-row";

export type MedicalHistoryEntry = {
  date: string;
  title: string;
  note: string;
  clinician: string;
};

export type DiseaseRecord = {
  name: string;
  status: string;
  diagnosedAt: string;
  notes: string;
};

export type TreatmentRecord = {
  date: string;
  procedure: string;
  tooth: string;
  clinician: string;
  notes: string;
};

export type PatientRecord = {
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
  chartedTeeth: number[];
  visitDate?: string;
  price?: string;
  treatmentType?: string;
  complaint?: string;
  createdAt?: string;
  updatedAt?: string;
  recordedAge?: number;
  roomNumber?: string | null;
  queueNumber?: number | null;
  status?: string;
};

export type PatientListItem = {
  id: string;
  code: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
  email: string;
  lastVisit: string | null;
  lastVisitLabel: string;
  visitDate: string | null;
  primaryIssue: string;
  primaryStatus: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type { WaitingTicket };

type HistoryExtras = {
  note: string;
  visitDate?: string;
  price?: string;
};

const CLINICIAN = "Dr. Zulaikha";

async function patientsClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

function encodeMedicalHistory(note: string, visitDate: string, price: string) {
  return JSON.stringify({ note, visitDate, price } satisfies HistoryExtras);
}

function decodeMedicalHistory(raw: string | null | undefined): HistoryExtras {
  if (!raw?.trim()) return { note: "" };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && "note" in parsed) {
      const record = parsed as Record<string, unknown>;
      return {
        note: String(record.note ?? ""),
        visitDate:
          typeof record.visitDate === "string" ? record.visitDate : undefined,
        price: typeof record.price === "string" ? record.price : undefined,
      };
    }
  } catch {
    /* stored as plain clinical notes */
  }
  return { note: raw };
}

export function ageFromDateOfBirth(dateOfBirth: string, now = new Date()) {
  const birth = new Date(`${dateOfBirth}T00:00:00`);
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function dateOfBirthFromAge(age: number, now = new Date()) {
  const birth = new Date(now);
  birth.setFullYear(birth.getFullYear() - age);
  const year = birth.getFullYear();
  const month = String(birth.getMonth() + 1).padStart(2, "0");
  const day = String(birth.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isoDay(value: string | null | undefined) {
  if (!value) return null;
  const day = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function displayStatus(status: string | null | undefined) {
  const value = (status ?? "waiting").trim() || "waiting";
  if (value === "waiting" || value === "current") return "Active";
  if (value === QUEUE_DONE_STATUS) return "Completed";
  return value;
}

export function lastVisitDate(patient: PatientRecord) {
  const dates = [
    ...patient.medicalHistory.map((entry) => entry.date),
    ...patient.treatments.map((entry) => entry.date),
  ].sort();
  return dates.at(-1) ?? isoDay(patient.visitDate) ?? isoDay(patient.createdAt);
}

export function primaryIssue(patient: PatientRecord) {
  const ranked =
    patient.diseases.find((disease) =>
      /active|in treatment/i.test(disease.status),
    ) ?? patient.diseases[0];

  return {
    name:
      ranked?.name ??
      patient.treatmentType ??
      patient.complaint ??
      "No diagnosis on file",
    status: ranked?.status ?? patient.status ?? "—",
  };
}

export function registrationDetails(patient: PatientRecord) {
  const registrationVisit = patient.medicalHistory.find((entry) =>
    /registration/i.test(entry.title),
  );
  const quotedFee = patient.treatments
    .map((treatment) => treatment.notes.match(/Quoted fee:\s*([\d,]+)/i)?.[1]?.trim())
    .find((value): value is string => Boolean(value));

  return {
    name: patient.name,
    age: patient.recordedAge ?? ageFromDateOfBirth(patient.dateOfBirth),
    phone: patient.phone,
    visitDate:
      patient.visitDate ??
      registrationVisit?.date ??
      patient.medicalHistory[0]?.date ??
      lastVisitDate(patient),
    price: patient.price ?? quotedFee ?? null,
    treatmentType:
      patient.treatmentType ?? patient.treatments.at(-1)?.procedure ?? null,
    complaint:
      patient.complaint ??
      registrationVisit?.note ??
      patient.medicalHistory[0]?.note ??
      null,
  };
}

export function toListItem(patient: PatientRecord): PatientListItem {
  const issue = primaryIssue(patient);
  const lastVisit = lastVisitDate(patient);
  return {
    id: patient.id,
    code: patient.code,
    name: patient.name,
    age: patient.recordedAge ?? (patient.dateOfBirth ? ageFromDateOfBirth(patient.dateOfBirth) : 0),
    sex: patient.sex,
    phone: patient.phone,
    email: patient.email,
    lastVisit,
    lastVisitLabel: lastVisit ? formatClinicDate(lastVisit) : "—",
    visitDate: patient.visitDate ?? lastVisit,
    primaryIssue: issue.name,
    primaryStatus: issue.status,
    createdAt: patient.createdAt ?? null,
    updatedAt: patient.updatedAt ?? null,
  };
}

export function rowToPatient(row: PatientRow): PatientRecord {
  const extras = decodeMedicalHistory(row.medical_history);
  const createdAt = row.created_at;
  const visitDate = extras.visitDate ?? isoDay(createdAt) ?? "";
  const age = row.age ?? 0;
  const chartedTeeth = parseChartedTeeth(row.tooth_number ?? "");
  const treatmentType = row.treatment_type ?? "";
  const complaint = extras.note;
  const price = extras.price ?? "";
  const statusLabel = displayStatus(row.status);

  return {
    id: row.id,
    code: row.patient_code?.trim() || "",
    name: row.full_name,
    dateOfBirth: dateOfBirthFromAge(age),
    recordedAge: age,
    sex: row.gender?.trim() || "Unspecified",
    phone: row.phone_number ?? "",
    email: "",
    allergies: ["None recorded"],
    visitDate,
    price,
    treatmentType,
    complaint,
    chartedTeeth,
    createdAt,
    updatedAt: createdAt,
    roomNumber: row.room_number,
    queueNumber: row.queue_number,
    status: statusLabel,
    medicalHistory: [
      {
        date: visitDate || isoDay(createdAt) || "",
        title: "New patient registration",
        note: complaint,
        clinician: CLINICIAN,
      },
    ],
    diseases: [
      {
        name: complaint || treatmentType || "Registered",
        status: statusLabel,
        diagnosedAt: visitDate || isoDay(createdAt) || "",
        notes: "Recorded at registration.",
      },
    ],
    treatments:
      chartedTeeth.length > 0
        ? chartedTeeth.map((tooth, index) => ({
            date: visitDate || isoDay(createdAt) || "",
            procedure: treatmentType,
            tooth: `(${tooth})`,
            clinician: CLINICIAN,
            notes:
              index === 0 && price
                ? `Quoted fee: ${price} IQD. Marked at registration for pain, decay, or required treatment.`
                : "Marked at registration for pain, decay, or required treatment.",
          }))
        : [
            {
              date: visitDate || isoDay(createdAt) || "",
              procedure: treatmentType,
              tooth: "—",
              clinician: CLINICIAN,
              notes: price
                ? `Quoted fee: ${price} IQD. Recorded at registration.`
                : "Recorded at registration.",
            },
          ],
  };
}

export function rowToWaitingTicket(row: PatientRow): WaitingTicket {
  return ticketFromRow(row);
}

async function fetchRows() {
  const supabase = await patientsClient();
  const { data, error } = await supabase.from(PATIENT_TABLE).select("*");
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []) as PatientRow[];
}

export async function findPatientById(patientId: string) {
  let raw = patientId.trim().replace(/^#/, "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* already decoded */
  }
  if (!raw) return null;

  const supabase = await patientsClient();

  if (isUuid(raw)) {
    const { data, error } = await supabase
      .from(PATIENT_TABLE)
      .select("*")
      .eq("id", raw)
      .maybeSingle();

    if (!error && data) return rowToPatient(data as PatientRow);
  }

  const code = normalizePatientCode(raw);
  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .select("*")
    .ilike("patient_code", code)
    .maybeSingle();

  if (error || !data) return null;
  return rowToPatient(data as PatientRow);
}

export async function listPatients() {
  const rows = await fetchRows();
  return rows.map(rowToPatient).sort(newestFirst);
}

export async function searchPatients(query: string) {
  const raw = query.trim();
  if (!raw) return listPatients();

  const filter = buildPatientSearchOrFilter(raw);
  if (!filter) return listPatients();

  const supabase = await patientsClient();

  if (isUuid(raw)) {
    const byId = await findPatientById(raw);
    if (byId) return [byId];
  }

  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .select("*")
    .or(filter);

  if (error) {
    const rows = await fetchRows();
    return rows
      .map(rowToPatient)
      .filter((patient) => matchesPatientSearch(patient, raw))
      .sort(newestFirst);
  }

  const seen = new Set<string>();
  const matches: ReturnType<typeof rowToPatient>[] = [];

  function addRow(row: PatientRow) {
    if (seen.has(row.id)) return;
    seen.add(row.id);
    matches.push(rowToPatient(row));
  }

  for (const row of (data ?? []) as PatientRow[]) {
    addRow(row);
  }

  const digits = phoneDigits(raw);
  if (digits.length >= 4) {
    const prefix = digits.slice(0, 4);
    const extra = await supabase
      .from(PATIENT_TABLE)
      .select("*")
      .ilike("phone_number", `%${prefix}%`);
    for (const row of (extra.data ?? []) as PatientRow[]) {
      if (seen.has(row.id)) continue;
      const patient = rowToPatient(row);
      if (matchesPatientSearch(patient, raw)) {
        seen.add(row.id);
        matches.push(patient);
      }
    }
  }

  return matches.sort(newestFirst);
}

export async function listWaitingQueue(): Promise<WaitingTicket[]> {
  const supabase = await patientsClient();
  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .select("*")
    .in("status", [...QUEUE_ACTIVE_STATUSES])
    .order("queue_number", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as PatientRow[]).map(rowToWaitingTicket);
}

export type NewPatientInput = {
  name: string;
  age: number;
  phone: string;
  complaint: string;
  visitDate: string;
  price: string;
  treatmentType: string;
  chartedTeeth: number[];
};

export type PatientEditInput = NewPatientInput;

async function nextQueueNumber() {
  const supabase = await patientsClient();
  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .select("queue_number")
    .order("queue_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const current = (data as { queue_number: number | null } | null)?.queue_number;
  return (current ?? 0) + 1;
}

async function nextPatientCode() {
  const supabase = await patientsClient();
  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .select("patient_code");

  if (error) {
    throw new Error(error.message);
  }

  return nextCodeFromExisting(
    ((data ?? []) as Array<{ patient_code: string | null }>).map(
      (row) => row.patient_code,
    ),
  );
}

function isUniqueViolation(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "23505" ||
    /duplicate key|unique constraint|patients_patient_code/i.test(
      error.message ?? "",
    )
  );
}

export async function createPatient(input: NewPatientInput) {
  const supabase = await patientsClient();
  const queueNumber = await nextQueueNumber();
  const basePayload = {
    full_name: input.name.trim(),
    phone_number: input.phone.trim(),
    age: input.age,
    gender: "Unspecified",
    medical_history: encodeMedicalHistory(
      input.complaint,
      input.visitDate,
      input.price,
    ),
    treatment_type: input.treatmentType,
    tooth_number: input.chartedTeeth.join(","),
    room_number: null,
    queue_number: queueNumber,
    status: "waiting",
  };

  let code = await nextPatientCode();
  let lastError: { message?: string } | null = null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabase
      .from(PATIENT_TABLE)
      .insert({ ...basePayload, patient_code: code })
      .select("*")
      .single();

    if (!error && data) {
      return rowToPatient(data as PatientRow);
    }

    lastError = error;
    if (!isUniqueViolation(error)) break;
    const current = parsePatientCodeNumber(code) ?? 1000;
    code = formatPatientCode(current + 1);
  }

  throw new Error(
    lastError?.message?.includes("patient_code")
      ? `${lastError.message} Run supabase/migrations/003_patient_code.sql in the SQL editor.`
      : (lastError?.message ?? "Could not create the patient record."),
  );
}

export async function updatePatient(patientId: string, input: PatientEditInput) {
  const supabase = await patientsClient();
  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .update({
      full_name: input.name.trim(),
      phone_number: input.phone.trim(),
      age: input.age,
      medical_history: encodeMedicalHistory(
        input.complaint,
        input.visitDate,
        input.price,
      ),
      treatment_type: input.treatmentType,
      tooth_number: input.chartedTeeth.join(","),
    })
    .eq("id", patientId.trim())
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;
  return rowToPatient(data as PatientRow);
}

export async function deletePatient(patientId: string) {
  const id = patientId.trim();
  if (!id) return false;

  const supabase = await patientsClient();
  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function completeQueueTicket(patientId: string) {
  const supabase = await patientsClient();
  const { error } = await supabase
    .from(PATIENT_TABLE)
    .update({ status: QUEUE_DONE_STATUS })
    .eq("id", patientId);

  if (error) {
    throw new Error(error.message);
  }

  return listWaitingQueue();
}

export function listSamplePatientIds() {
  return ["P-1001", "P-1002", "P-1003", "P-1004"] as const;
}
