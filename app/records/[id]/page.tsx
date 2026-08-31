import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";

import { PatientChartView } from "@/components/patient-chart-view";
import { StaffShell } from "@/components/staff-shell";
import { findPatientById } from "@/lib/db/patients";
type ChartPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ChartPageProps): Promise<Metadata> {
  const { id } = await params;
  const patient = await findPatientById(id);
  return {
    title: patient
      ? `${patient.name} · Chart — Lumina Dental`
      : "Chart not found — Lumina Dental",
  };
}

export default async function PatientChartPage({ params }: ChartPageProps) {
  const { id } = await params;
  const patient = await findPatientById(id);

  if (!patient) {
    notFound();
  }

  return (
    <ViewTransition>
      <StaffShell
        eyebrow={false}
        contentClassName="max-w-none min-w-0 px-3 py-4 sm:px-6 sm:py-5"
      >
        <PatientChartView patient={patient} tone="dark" />
      </StaffShell>
    </ViewTransition>
  );
}
