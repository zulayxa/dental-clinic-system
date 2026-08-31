import {
  Activity,
  ClipboardList,
  Stethoscope,
} from "lucide-react";

import { DentalMap } from "@/components/dental-map";
import { InteractiveDentalChart } from "@/components/interactive-dental-chart";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatClinicDate } from "@/lib/dates";
import {
  registrationDetails,
  type PatientRecord,
} from "@/lib/db/patients";
import { formatUsd } from "@/lib/db/clinic";
import { cn } from "@/lib/utils";

const jawColumnClassName =
  "h-[15.5rem] max-h-[calc(100svh-8.5rem)] min-w-0 lg:h-full lg:min-h-0";

const fieldClassName =
  "h-9 w-full min-w-0 px-2 py-0.5 border-white/15 bg-white/8 text-sm text-white placeholder:text-sky-200/40 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/30";

const labelClassName = "text-[11px] leading-tight text-sky-100 sm:text-xs";

const sectionClassName =
  "min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:p-6";

function diseaseVariant(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active" || normalized === "in treatment") {
    return "destructive" as const;
  }
  if (normalized === "managed" || normalized === "observed") {
    return "secondary" as const;
  }
  return "outline" as const;
}

function formatPrice(value: string | null) {
  if (!value) return "—";
  const amount = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  if (Number.isNaN(amount)) return value;
  return formatUsd(amount);
}

function DetailField({
  id,
  label,
  value,
}: {
  id: string;
  label: string;
  value: string;
}) {
  return (
    <div className="grid min-w-0 gap-1">
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>
      <Input
        id={id}
        readOnly
        tabIndex={-1}
        defaultValue={value}
        className={fieldClassName}
      />
    </div>
  );
}

export function PatientChartView({
  patient,
  tone = "dark",
}: {
  patient: PatientRecord;
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";
  const details = registrationDetails(patient);
  const visitLabel = details.visitDate
    ? formatClinicDate(details.visitDate)
    : "—";

  const fieldId = (name: string) => `chart-${patient.id}-${name}`;

  return (
    <div className="grid min-w-0 max-w-full gap-6 [color-scheme:dark]">
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex min-w-0 flex-col">
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:p-6">
            <header className="mb-3">
              <h2 className="min-w-0 truncate text-center text-base font-semibold leading-tight text-white sm:text-xl">
                Patient details
              </h2>
            </header>
            <div className="grid flex-1 content-start gap-2.5">
              <DetailField
                id={fieldId("name")}
                label="Full name"
                value={details.name}
              />
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <DetailField
                  id={fieldId("age")}
                  label="Age"
                  value={String(details.age)}
                />
                <DetailField
                  id={fieldId("visit")}
                  label="Visit date"
                  value={visitLabel}
                />
              </div>
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <DetailField
                  id={fieldId("price")}
                  label="Price (IQD)"
                  value={formatPrice(details.price)}
                />
                <DetailField
                  id={fieldId("phone")}
                  label="Phone number"
                  value={details.phone}
                />
              </div>
              <DetailField
                id={fieldId("treatment")}
                label="Treatment Type"
                value={details.treatmentType ?? "—"}
              />
              <div className="grid min-w-0 flex-1 gap-1">
                <Label htmlFor={fieldId("complaint")} className={labelClassName}>
                  Chief dental complaint
                </Label>
                <textarea
                  id={fieldId("complaint")}
                  readOnly
                  tabIndex={-1}
                  rows={4}
                  defaultValue={details.complaint ?? "—"}
                  className="min-h-24 w-full min-w-0 flex-1 resize-none rounded-lg border border-white/15 bg-white/8 px-2 py-1.5 text-sm text-white outline-none"
                />
              </div>
            </div>
            <p className="mt-auto pt-3 font-mono text-[11px] tracking-wide text-sky-200/60">
              #{patient.code || patient.id}
            </p>
          </section>
        </div>

        <div className={jawColumnClassName}>
          <InteractiveDentalChart
            fill
            selected={patient.chartedTeeth ?? []}
            readOnly
          />
        </div>
      </div>

      <div className="grid w-full min-w-0 max-w-full gap-3 sm:gap-4">
        <DentalMap
          treatments={patient.treatments}
          chartedTeeth={patient.chartedTeeth}
        />

        <div className="grid min-w-0 gap-3 lg:grid-cols-2 sm:gap-4">
          <section className={sectionClassName}>
            <header className="mb-3">
              <h2
                className={cn(
                  "flex min-w-0 items-center gap-2 text-base font-semibold leading-tight sm:text-xl",
                  dark ? "text-white" : "text-foreground",
                )}
              >
                <ClipboardList className="size-3.5 shrink-0 text-cyan-300 sm:size-4" />
                Medical history
              </h2>
              <p className={cn("mt-1", labelClassName, !dark && "text-muted-foreground")}>
                Prior visits and clinical notes on file.
              </p>
            </header>
            <div className="grid gap-3">
              {patient.medicalHistory.map((entry) => (
                <article
                  key={`${entry.date}-${entry.title}`}
                  className="min-w-0 border-l-2 border-cyan-400/40 pl-2.5"
                >
                  <p className="text-[11px] text-sky-200/70">
                    {formatClinicDate(entry.date)} · {entry.clinician}
                  </p>
                  <h3 className="mt-0.5 text-sm font-medium text-white">
                    {entry.title}
                  </h3>
                  <p className="mt-1 text-sm leading-5 break-words text-sky-100/75">
                    {entry.note}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className={sectionClassName}>
            <header className="mb-3">
              <h2
                className={cn(
                  "flex min-w-0 items-center gap-2 text-base font-semibold leading-tight sm:text-xl",
                  dark ? "text-white" : "text-foreground",
                )}
              >
                <Activity className="size-3.5 shrink-0 text-cyan-300 sm:size-4" />
                Diseases & conditions
              </h2>
              <p className={cn("mt-1", labelClassName, !dark && "text-muted-foreground")}>
                Active and historical diagnoses.
              </p>
            </header>
            <div className="grid gap-2">
              {patient.diseases.map((disease) => (
                <article
                  key={disease.name}
                  className={cn(
                    "min-w-0 rounded-xl p-2.5",
                    dark ? "bg-white/5" : "bg-muted/50",
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate text-sm font-medium text-white">
                      {disease.name}
                    </h3>
                    <Badge
                      variant={diseaseVariant(disease.status)}
                      className="h-5 shrink-0 px-1.5 text-[10px]"
                    >
                      {disease.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-sky-200/70">
                    Diagnosed {formatClinicDate(disease.diagnosedAt)}
                  </p>
                  <p className="mt-1.5 text-sm leading-5 break-words text-sky-100/75">
                    {disease.notes}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className={sectionClassName}>
          <header className="mb-3">
            <h2
              className={cn(
                "flex min-w-0 items-center gap-2 text-base font-semibold leading-tight sm:text-xl",
                dark ? "text-white" : "text-foreground",
              )}
            >
              <Stethoscope className="size-3.5 shrink-0 text-cyan-300 sm:size-4" />
              Previous treatments
            </h2>
            <p className={cn("mt-1", labelClassName, !dark && "text-muted-foreground")}>
              Completed procedures, sites, and treating clinicians.
            </p>
          </header>
          <div className="grid gap-2">
            {patient.treatments.map((treatment) => (
              <article
                key={`${treatment.date}-${treatment.procedure}-${treatment.tooth}`}
                className={cn(
                  "grid min-w-0 gap-1 rounded-xl border p-2.5 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:items-start sm:gap-3",
                  dark ? "border-white/10" : "border-border/80",
                )}
              >
                <p className="text-[11px] font-medium text-sky-200/70 sm:pt-0.5">
                  {formatClinicDate(treatment.date)}
                </p>
                <div className="min-w-0">
                  <h3 className="text-sm font-medium break-words text-white">
                    {treatment.procedure}
                  </h3>
                  <p className="mt-0.5 text-sm break-words text-sky-100/75">
                    {treatment.tooth} · {treatment.clinician}
                  </p>
                  <p className="mt-1 text-sm leading-5 break-words text-sky-100/75">
                    {treatment.notes}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
