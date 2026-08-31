export type PatientRow = {
  id: string;
  created_at: string;
  full_name: string;
  phone_number: string | null;
  age: number | null;
  gender: string | null;
  medical_history: string | null;
  treatment_type: string | null;
  tooth_number: string | null;
  room_number: string | null;
  queue_number: number | null;
  status: string | null;
  patient_code: string | null;
};

export type WaitingTicket = {
  id: string;
  number: number;
  name: string;
  chair: string;
};

export const PATIENT_TABLE = "patients";

export const QUEUE_ACTIVE_STATUSES = ["waiting", "current"] as const;
export const QUEUE_DONE_STATUS = "done";

export function ticketFromRow(row: PatientRow): WaitingTicket {
  return {
    id: row.id,
    number: row.queue_number ?? 0,
    name: row.full_name,
    chair: row.room_number?.trim() || "—",
  };
}

export function isActiveQueueStatus(status: string | null | undefined) {
  const value = (status ?? "").trim().toLowerCase();
  return QUEUE_ACTIVE_STATUSES.includes(value as (typeof QUEUE_ACTIVE_STATUSES)[number]);
}
