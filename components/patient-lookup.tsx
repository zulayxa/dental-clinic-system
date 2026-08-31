"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardList,
  Search,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { searchPatientById, type PatientSearchState } from "@/app/reception/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SAMPLE_IDS = ["P-1001", "P-1002", "P-1003", "P-1004"];

const initialState: PatientSearchState = { status: "idle" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

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

export function PatientLookup() {
  const [query, setQuery] = useState("");
  const [state, formAction, pending] = useActionState(
    searchPatientById,
    initialState,
  );

  useEffect(() => {
    const patientId = query.trim();
    if (patientId.length < 2) return;

    const timer = window.setTimeout(() => {
      const formData = new FormData();
      formData.set("patientId", patientId);
      startTransition(() => {
        formAction(formData);
      });
    }, 280);

    return () => window.clearTimeout(timer);
  }, [query, formAction]);

  const patient = state.status === "success" ? state.patient : null;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Patient chart lookup</CardTitle>
          <CardDescription>
            Type a patient code, full name, or phone number. Matching charts load
            from the clinic database as soon as they are recognized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-3">
            <Label htmlFor="patientId">Code, name, or phone</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="patientId"
                name="patientId"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="P-1001, name, or phone"
                autoComplete="off"
                spellCheck={false}
                className="h-11 text-base sm:flex-1"
                aria-describedby="patient-id-hint"
              />
              <Button
                type="submit"
                className="h-11 px-5"
                disabled={pending || query.trim().length < 2}
              >
                <Search data-icon="inline-start" />
                {pending ? "Searching…" : "Search"}
              </Button>
            </div>
            <p id="patient-id-hint" className="text-xs text-muted-foreground">
              Search by code, name, or phone. Sample codes:
              {SAMPLE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="ml-2 font-mono text-primary underline-offset-2 hover:underline"
                  onClick={() => setQuery(id)}
                >
                  {id}
                </button>
              ))}
            </p>
            <p className="min-h-5 text-sm text-destructive" aria-live="polite">
              {state.status === "error" ? state.message : pending ? "Looking up chart…" : ""}
            </p>
          </form>
        </CardContent>
      </Card>

      {state.status === "many" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Matching patients</CardTitle>
            <CardDescription>
              {state.matches.length} records match. Select one to open the chart.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {state.matches.map((match) => (
              <button
                key={match.id}
                type="button"
                className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3 py-2.5 text-left hover:bg-muted/60"
                onClick={() => setQuery(match.code || match.id)}
              >
                <span className="font-medium">{match.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {match.code || "—"} · {match.phone || "—"}
                </span>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {patient ? (
        <div className="grid gap-4">
          <Card>
            <CardHeader className="border-b">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <UserRound className="size-5 text-primary" />
                    {patient.name}
                  </CardTitle>
                  <CardDescription className="mt-1 font-mono">
                    {patient.code || patient.id} · {patient.sex} · DOB {formatDate(patient.dateOfBirth)}
                  </CardDescription>
                </div>
                <Badge variant="secondary">Chart loaded</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Phone
                </p>
                <p className="mt-1">{patient.phone}</p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Email
                </p>
                <p className="mt-1 break-all">{patient.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Allergies
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {patient.allergies.map((allergy) => (
                    <Badge
                      key={allergy}
                      variant={
                        allergy === "None recorded" ? "outline" : "destructive"
                      }
                    >
                      {allergy === "None recorded" ? null : (
                        <AlertTriangle className="size-3" />
                      )}
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="size-4 text-primary" />
                  Medical history
                </CardTitle>
                <CardDescription>
                  Prior visits and clinical notes on file.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {patient.medicalHistory.map((entry) => (
                  <article
                    key={`${entry.date}-${entry.title}`}
                    className="border-l-2 border-primary/30 pl-3"
                  >
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.date)} · {entry.clinician}
                    </p>
                    <h3 className="mt-0.5 font-medium">{entry.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {entry.note}
                    </p>
                  </article>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  Diseases & conditions
                </CardTitle>
                <CardDescription>
                  Active and historical diagnoses.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {patient.diseases.map((disease) => (
                  <article
                    key={disease.name}
                    className="rounded-xl bg-muted/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium">{disease.name}</h3>
                      <Badge
                        variant={diseaseVariant(disease.status)}
                        className={cn("shrink-0")}
                      >
                        {disease.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diagnosed {formatDate(disease.diagnosedAt)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {disease.notes}
                    </p>
                  </article>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="size-4 text-primary" />
                Previous treatments
              </CardTitle>
              <CardDescription>
                Completed procedures, sites, and treating clinicians.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {patient.treatments.map((treatment) => (
                <article
                  key={`${treatment.date}-${treatment.procedure}-${treatment.tooth}`}
                  className="grid gap-1 rounded-xl border border-border/80 p-3 sm:grid-cols-[7rem_1fr_auto] sm:items-start sm:gap-4"
                >
                  <p className="text-xs font-medium text-muted-foreground sm:pt-1">
                    {formatDate(treatment.date)}
                  </p>
                  <div>
                    <h3 className="font-medium">{treatment.procedure}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {treatment.tooth} · {treatment.clinician}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {treatment.notes}
                    </p>
                  </div>
                </article>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
