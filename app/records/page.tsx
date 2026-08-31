import type { Metadata } from "next";
import { ViewTransition } from "react";

import { PatientRecordsTable } from "@/components/patient-records-table";
import { StaffShell } from "@/components/staff-shell";
import { listPatients, toListItem } from "@/lib/db/patients";

export const metadata: Metadata = {
  title: "Patient Records — Lumina Dental",
  description:
    "Search and manage registered patient charts, visit dates, and primary diagnoses.",
};

export const dynamic = "force-dynamic";

export default async function PatientRecordsPage({
  searchParams,
}: PageProps<"/records">) {
  const patients = (await listPatients()).map(toListItem);
  const params = await searchParams;
  const added = params.added;
  const q = params.q;
  const highlightId = Array.isArray(added) ? added[0] : added;
  const initialQuery = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");

  return (
    <ViewTransition>
      <StaffShell contentClassName="min-w-0 px-3 py-4 sm:px-6 sm:py-6">
        <PatientRecordsTable
          patients={patients}
          highlightId={highlightId}
          initialQuery={initialQuery}
        />
      </StaffShell>
    </ViewTransition>
  );
}
