"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PatientRecordsDateFilter({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Input
        id="records-date-filter"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Filter by date"
        className="h-9 w-full min-w-0 rounded-lg border-white/15 bg-white/8 px-2 py-0.5 text-sm text-white [color-scheme:dark] placeholder:text-sky-200/40 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/30"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 rounded-lg text-cyan-100 hover:bg-white/10 hover:text-white"
          aria-label="Clear date filter"
          onClick={() => onChange("")}
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
