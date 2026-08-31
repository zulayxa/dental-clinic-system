import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EditPatientForm } from "@/components/edit-patient-form";
import {
  findPatientById,
  registrationDetails,
} from "@/lib/db/patients";

type EditPageProps = {
  params: Promise<{ id: string }>;
};

function numericPrice(value: string | null) {
  if (!value) return "";
  const amount = value.replace(/[^0-9.]/g, "");
  return amount;
}

export async function generateMetadata({
  params,
}: EditPageProps): Promise<Metadata> {
  const { id } = await params;
  const patient = await findPatientById(id);
  return {
    title: patient
      ? `Edit ${patient.name} — Lumina Dental`
      : "Patient not found — Lumina Dental",
  };
}

export const dynamic = "force-dynamic";

export default async function EditPatientPage({ params }: EditPageProps) {
  const { id } = await params;
  const patient = await findPatientById(id);

  if (!patient) {
    notFound();
  }

  const details = registrationDetails(patient);

  return (
    <EditPatientForm
      patient={{
        id: patient.id,
        name: details.name,
        age: details.age,
        phone: details.phone,
        visitDate: details.visitDate ?? "",
        price: numericPrice(details.price),
        treatmentType: details.treatmentType ?? "",
        complaint: details.complaint ?? "",
        chartedTeeth: patient.chartedTeeth ?? [],
      }}
    />
  );
}
