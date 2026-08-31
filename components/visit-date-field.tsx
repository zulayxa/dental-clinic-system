"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "radix-ui";

import { cn } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseISODate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function formatDisplayDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseISODate(value));
}

type VisitDateFieldProps = {
  id: string;
  name: string;
  required?: boolean;
  defaultValue: string;
  className?: string;
};

export function VisitDateField({
  id,
  name,
  required = true,
  defaultValue,
  className,
}: VisitDateFieldProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const selected = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseISODate(value)
    : new Date();
  const [view, setView] = useState(() => ({
    year: selected.getFullYear(),
    month: selected.getMonth(),
  }));

  useEffect(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(defaultValue)) return;
    setValue(defaultValue);
    const next = parseISODate(defaultValue);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  }, [defaultValue]);

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const startPad = first.getDay();
    const days = new Date(view.year, view.month + 1, 0).getDate();
    const slots: Array<{ iso: string; day: number; inMonth: boolean }> = [];
    for (let i = 0; i < startPad; i += 1) {
      slots.push({ iso: `pad-${i}`, day: 0, inMonth: false });
    }
    for (let day = 1; day <= days; day += 1) {
      slots.push({
        iso: toISODate(new Date(view.year, view.month, day)),
        day,
        inMonth: true,
      });
    }
    return slots;
  }, [view.month, view.year]);

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
  }).format(new Date(view.year, view.month, 1));

  function shiftMonth(delta: number) {
    setView((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  return (
    <div className="relative min-w-0">
      <input type="hidden" name={name} value={value} />
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            setView({
              year: selected.getFullYear(),
              month: selected.getMonth(),
            });
          }
        }}
      >
        <Popover.Trigger
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-label={`Visit date ${formatDisplayDate(value)}`}
          suppressHydrationWarning
          className={cn(
            "flex w-full min-w-0 items-center justify-between gap-1.5 text-left",
            className,
          )}
        >
          <span suppressHydrationWarning className="min-w-0 truncate">
            {formatDisplayDate(value)}
          </span>
          <Calendar className="size-3.5 shrink-0 text-cyan-100/70" aria-hidden />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="end"
            sideOffset={6}
            collisionPadding={12}
            avoidCollisions
            sticky="always"
            onOpenAutoFocus={(event) => event.preventDefault()}
            className="z-[300] w-[min(17.5rem,calc(100vw-1.5rem))] rounded-xl border border-white/15 bg-[#01113a] p-2.5 text-white shadow-[0_18px_48px_rgba(1,17,58,0.55)]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => shiftMonth(-1)}
                className="flex size-7 items-center justify-center rounded-md text-cyan-100/80 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="size-4" />
              </button>
              <p className="text-xs font-semibold tracking-wide text-cyan-50">
                {monthLabel}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => shiftMonth(1)}
                className="flex size-7 items-center justify-center rounded-md text-cyan-100/80 hover:bg-white/10 hover:text-white"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium text-cyan-200/60">
              {WEEKDAYS.map((day) => (
                <span key={day} className="py-1">
                  {day}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((cell) =>
                cell.inMonth ? (
                  <button
                    key={cell.iso}
                    type="button"
                    onClick={() => {
                      setValue(cell.iso);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex h-7 items-center justify-center rounded-md text-[11px] text-cyan-50 hover:bg-white/12",
                      cell.iso === value &&
                        "bg-cyan-400 font-semibold text-slate-950 hover:bg-cyan-300 hover:text-slate-950",
                    )}
                  >
                    {cell.day}
                  </button>
                ) : (
                  <span key={cell.iso} className="h-7" />
                ),
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
