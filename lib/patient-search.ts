import { patientCodeMatches } from "@/lib/patient-code";

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Strip PostgREST `or()` / ilike metacharacters from user input. */
export function sanitizeIlike(value: string) {
  return value.replace(/[%_,()*]/g, " ").replace(/\s+/g, " ").trim();
}

export function matchesPatientSearch(
  patient: { id: string; code: string; name: string; phone: string },
  query: string,
) {
  const needle = query.trim().toLowerCase().replace(/^#/, "");
  if (!needle) return true;

  const digits = phoneDigits(needle);
  const name = patient.name.toLowerCase();
  const phone = patient.phone.toLowerCase();
  const id = patient.id.toLowerCase();

  return (
    name.includes(needle) ||
    phone.includes(needle) ||
    id.includes(needle) ||
    `#${id}`.includes(needle) ||
    patientCodeMatches(patient.code, needle) ||
    (digits.length >= 3 && phoneDigits(patient.phone).includes(digits))
  );
}

export function buildPatientSearchOrFilter(query: string) {
  const needle = sanitizeIlike(query.replace(/^#/, ""));
  if (!needle) return null;

  const clauses = [
    `full_name.ilike."%${needle}%"`,
    `patient_code.ilike."%${needle}%"`,
    `phone_number.ilike."%${needle}%"`,
  ];

  const digits = phoneDigits(needle);
  if (digits.length >= 3 && digits !== needle) {
    clauses.push(`phone_number.ilike."%${digits}%"`);
    clauses.push(`patient_code.ilike."%${digits}%"`);
  }

  const upper = needle.toUpperCase();
  if (upper !== needle) {
    clauses.push(`patient_code.ilike."%${upper}%"`);
  }

  return clauses.join(",");
}
