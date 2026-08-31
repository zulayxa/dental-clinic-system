import type { Metadata } from "next";

import { PatientLookup } from "@/components/patient-lookup";
import { StaffShell } from "@/components/staff-shell";

export const metadata: Metadata = {
  title: "ID Lookup — Lumina Dental",
  description:
    "Look up a patient chart by short code and review medical history, diseases, and previous treatments.",
};

export default function ReceptionPage() {
  return (
    <StaffShell
      title="ID lookup"
      description="Search by patient code, name, or phone number to pull the record before seating. Charts include history, systemic and dental diagnoses, and completed treatments."
    >
      <PatientLookup />
    </StaffShell>
  );
}
