export type SortablePatient = {
  id: string;
  updatedAt?: string | null;
  createdAt?: string | null;
};

function activityMs(patient: SortablePatient) {
  const timestamp = Date.parse(patient.updatedAt ?? patient.createdAt ?? "");
  if (!Number.isNaN(timestamp)) return timestamp;

  const idNumber = Number.parseInt(patient.id.replace(/\D/g, ""), 10);
  return Number.isFinite(idNumber) ? idNumber : 0;
}

/** Newest updated/created records first. Legacy rows without timestamps fall back to higher IDs. */
export function newestFirst(a: SortablePatient, b: SortablePatient) {
  const aTime = activityMs(a);
  const bTime = activityMs(b);
  if (aTime !== bTime) return bTime - aTime;
  return b.id.localeCompare(a.id);
}
