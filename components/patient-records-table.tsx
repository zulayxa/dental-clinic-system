"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, FileSearch, Pencil, Search, Trash2 } from "lucide-react";

import { deletePatientRecord, searchPatientRecords } from "@/app/records/actions";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PatientRecordsDateFilter } from "@/components/patient-records-date-filter";
import type { PatientListItem } from "@/lib/db/patients";
import { newestFirst } from "@/lib/patient-sort";
import { matchesPatientSearch } from "@/lib/patient-search";
import { cn } from "@/lib/utils";

const fieldClassName =
  "h-9 w-full min-w-0 border-white/15 bg-white/8 px-2 py-0.5 text-sm text-white placeholder:text-sky-200/40 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/30";

function issueBadgeClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active" || normalized === "in treatment") {
    return "border-rose-300/30 bg-rose-400/15 text-rose-100";
  }
  if (normalized === "managed") {
    return "border-cyan-300/30 bg-cyan-400/15 text-cyan-100";
  }
  return "border-white/20 bg-white/10 text-sky-100";
}

function isoDay(value: string | null | undefined) {
  if (!value) return null;
  const day = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

function matchesDateFilter(patient: PatientListItem, selectedDate: string) {
  if (!selectedDate) return true;
  return (
    isoDay(patient.lastVisit) === selectedDate ||
    isoDay(patient.visitDate) === selectedDate
  );
}

export function PatientRecordsTable({
  patients,
  highlightId,
  initialQuery = "",
}: {
  patients: PatientListItem[];
  highlightId?: string;
  initialQuery?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [selectedDate, setSelectedDate] = useState("");
  const [rows, setRows] = useState(patients);
  const [remoteRows, setRemoteRows] = useState<PatientListItem[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setRows(patients);
  }, [patients]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const needle = query.trim();
    if (!needle) {
      setRemoteRows(null);
      return;
    }

    setRemoteRows(null);
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await searchPatientRecords(needle);
        if (!cancelled) setRemoteRows(result);
      } catch {
        if (!cancelled) setRemoteRows(null);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  const filtered = useMemo(() => {
    const needle = query.trim();
    const source = remoteRows ?? rows;
    const list = source.filter((patient) => {
      if (!matchesDateFilter(patient, selectedDate)) return false;
      if (!needle || remoteRows) return true;
      return matchesPatientSearch(patient, needle);
    });
    return [...list].sort(newestFirst);
  }, [rows, remoteRows, query, selectedDate]);

  useEffect(() => {
    if (!highlightId) return;
    const match = rows.find(
      (patient) =>
        patient.id.toLowerCase() === highlightId.toLowerCase() ||
        patient.code.toLowerCase() === highlightId.toLowerCase(),
    );
    const id = match?.id ?? highlightId;
    const nodes = document.querySelectorAll(`[data-patient-row="${CSS.escape(id)}"]`);
    const row =
      [...nodes].find((node) => node instanceof HTMLElement && node.offsetParent) ??
      nodes[0];
    if (row instanceof HTMLElement) {
      row.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    setExpandedId(id);
  }, [highlightId, rows]);

  async function handleDelete(patient: PatientListItem) {
    const confirmed = window.confirm(
      `Delete ${patient.name}? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(patient.id);
    const result = await deletePatientRecord(patient.id);
    setDeletingId(null);

    if (!result.ok) {
      window.alert(result.message);
      return;
    }

    setRows((current) =>
      current.filter((item) => item.id !== patient.id),
    );
    setRemoteRows((current) =>
      current ? current.filter((item) => item.id !== patient.id) : null,
    );
    setExpandedId((current) => (current === patient.id ? null : current));
    startTransition(() => {
      router.refresh();
    });
  }

  function recordActions(patient: PatientListItem) {
    return (
      <div className="flex shrink-0 items-center justify-end gap-1">
        <Button
          size="icon"
          className="size-7 rounded-md bg-cyan-400 text-slate-950 hover:bg-cyan-300"
          asChild
        >
          <Link href={`/records/${patient.id}`} aria-label={`View chart for ${patient.name}`}>
            <FileSearch className="size-3.5" />
          </Link>
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-7 rounded-md border-white/20 bg-white/5 text-cyan-50 hover:bg-white/15 hover:text-white"
          asChild
        >
          <Link href={`/records/${patient.id}/edit`} aria-label={`Edit ${patient.name}`}>
            <Pencil className="size-3.5" />
          </Link>
        </Button>
        <Button
          type="button"
          size="icon"
          variant="outline"
          aria-label={`Delete ${patient.name}`}
          disabled={deletingId === patient.id}
          className="size-7 rounded-md border-rose-300/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/30 hover:text-white"
          onClick={() => {
            void handleDelete(patient);
          }}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3">
      <h1 className="text-base font-semibold leading-tight text-white sm:text-xl">
        Patient records
      </h1>

      <div className="grid min-w-0 grid-cols-2 gap-2">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-cyan-200/80" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by code, name, or phone"
            aria-label="Search patients by code, name, or phone number"
            className={cn(fieldClassName, "rounded-lg pr-2 pl-8")}
          />
        </div>
        <PatientRecordsDateFilter
          value={selectedDate}
          onChange={setSelectedDate}
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-8 text-center text-sm text-sky-100/70">
          No patients match those filters.
        </p>
      ) : (
        <ul className="grid gap-1.5">
          {filtered.map((patient) => {
            const expanded = expandedId === patient.id;
            const detailsId = `patient-details-${patient.id}`;
            return (
              <li key={patient.id}>
                <article
                  data-patient-row={patient.id}
                  className={cn(
                    "min-w-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md",
                    highlightId &&
                      (highlightId.toUpperCase() === patient.id.toUpperCase() ||
                        highlightId.toUpperCase() ===
                          patient.code.toUpperCase()) &&
                      "bg-cyan-400/15 ring-1 ring-inset ring-cyan-300/40",
                  )}
                >
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-1.5 px-2 py-0.5">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={detailsId}
                      onClick={() =>
                        setExpandedId((current) =>
                          current === patient.id ? null : patient.id,
                        )
                      }
                      className="flex min-w-0 items-center gap-1 text-left"
                    >
                      <ChevronDown
                        className={cn(
                          "size-3 shrink-0 text-cyan-200/80 transition-transform",
                          expanded && "rotate-180",
                        )}
                        aria-hidden
                      />
                      <span className="truncate text-sm font-semibold leading-none text-white">
                        {patient.name}
                      </span>
                    </button>
                    <p className="whitespace-nowrap text-end font-mono text-[11px] leading-none text-cyan-200">
                      #{patient.code || "—"}
                    </p>
                    {recordActions(patient)}
                  </div>
                  {expanded ? (
                    <dl
                      id={detailsId}
                      className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-white/10 px-2.5 py-2 sm:grid-cols-3 sm:px-3"
                    >
                      <div className="min-w-0">
                        <dt className="text-[11px] leading-tight text-sky-200/70">
                          Age
                        </dt>
                        <dd className="truncate text-sm text-sky-50">
                          {patient.age}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] leading-tight text-sky-200/70">
                          Gender
                        </dt>
                        <dd className="truncate text-sm text-sky-50">
                          {patient.sex}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] leading-tight text-sky-200/70">
                          Phone
                        </dt>
                        <dd className="truncate text-sm text-sky-50">
                          {patient.phone}
                        </dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="text-[11px] leading-tight text-sky-200/70">
                          Last visit
                        </dt>
                        <dd className="truncate text-sm text-sky-50">
                          {patient.lastVisitLabel}
                        </dd>
                      </div>
                      <div className="min-w-0 sm:col-span-2">
                        <dt className="text-[11px] leading-tight text-sky-200/70">
                          Issue
                        </dt>
                        <dd className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="truncate text-sm text-sky-50">
                            {patient.primaryIssue}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[10px]",
                              issueBadgeClass(patient.primaryStatus),
                            )}
                          >
                            {patient.primaryStatus}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-[11px] text-sky-200/55">
        Showing {filtered.length} of {rows.length} registered patients.
      </p>
    </div>
  );
}
