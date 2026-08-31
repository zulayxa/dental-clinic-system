"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseChartedTeeth } from "@/lib/dental-chart";
import {
  createPatient,
  deletePatient,
  searchPatients,
  toListItem,
  updatePatient,
  type PatientEditInput,
} from "@/lib/db/patients";

export type UpdatePatientState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function updatePatientInfo(
  _previous: UpdatePatientState,
  formData: FormData,
): Promise<UpdatePatientState> {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const complaint = String(formData.get("complaint") ?? "").trim();
  const visitDate = String(formData.get("visitDate") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const treatmentType = String(formData.get("treatmentType") ?? "").trim();
  const age = Number.parseInt(String(formData.get("age") ?? ""), 10);

  if (
    !id ||
    !name ||
    !phone ||
    !complaint ||
    !visitDate ||
    !price ||
    !treatmentType ||
    Number.isNaN(age)
  ) {
    return { status: "error", message: "All patient fields are required." };
  }

  if (age < 1 || age > 120) {
    return { status: "error", message: "Enter an age between 1 and 120." };
  }

  if (Number.isNaN(Number.parseFloat(price)) || Number.parseFloat(price) < 0) {
    return { status: "error", message: "Enter a valid price." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    return { status: "error", message: "Enter a valid visit date." };
  }

  const patch: PatientEditInput = {
    name,
    age,
    phone,
    complaint,
    visitDate,
    price,
    treatmentType,
    chartedTeeth: parseChartedTeeth(String(formData.get("chartedTeeth") ?? "")),
  };

  let updated;
  try {
    updated = await updatePatient(id, patch);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not update the patient record.",
    };
  }

  if (!updated) {
    return { status: "error", message: "Patient record was not found." };
  }

  revalidatePath("/records");
  revalidatePath("/records/[id]", "page");
  revalidatePath("/reception");
  revalidatePath("/tv");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Successfully updated patient record",
  };
}

export type RegisterPatientState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function registerPatient(
  _previous: RegisterPatientState,
  formData: FormData,
): Promise<RegisterPatientState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const complaint = String(formData.get("complaint") ?? "").trim();
  const visitDate = String(formData.get("visitDate") ?? "").trim();
  const price = String(formData.get("price") ?? "").trim();
  const treatmentType = String(formData.get("treatmentType") ?? "").trim();
  const age = Number.parseInt(String(formData.get("age") ?? ""), 10);

  if (
    !name ||
    !phone ||
    !complaint ||
    !visitDate ||
    !price ||
    !treatmentType ||
    Number.isNaN(age)
  ) {
    return { status: "error", message: "All registration fields are required." };
  }

  if (age < 1 || age > 120) {
    return { status: "error", message: "Enter an age between 1 and 120." };
  }

  if (Number.isNaN(Number.parseFloat(price)) || Number.parseFloat(price) < 0) {
    return { status: "error", message: "Enter a valid price." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    return { status: "error", message: "Enter a valid visit date." };
  }

  const chartedTeeth = parseChartedTeeth(
    String(formData.get("chartedTeeth") ?? ""),
  );

  let created;
  try {
    created = await createPatient({
      name,
      age,
      phone,
      complaint,
      visitDate,
      price,
      treatmentType,
      chartedTeeth,
    });
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Could not save the patient record.",
    };
  }

  revalidatePath("/records");
  revalidatePath("/records/[id]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/reception");
  revalidatePath("/tv");
  redirect(
    `/records?added=${encodeURIComponent(created.code || created.id)}`,
  );
}

export async function deletePatientRecord(
  patientId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const id = patientId.trim();
  if (!id) {
    return { ok: false, message: "Patient record was not found." };
  }

  try {
    const removed = await deletePatient(id);
    if (!removed) {
      return { ok: false, message: "Patient record was not found." };
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Could not delete the patient record.",
    };
  }

  revalidatePath("/records");
  revalidatePath("/records/[id]", "page");
  revalidatePath("/dashboard");
  revalidatePath("/reception");
  revalidatePath("/tv");
  return { ok: true };
}

export async function searchPatientRecords(query: string) {
  const patients = await searchPatients(query);
  return patients.map(toListItem);
}
