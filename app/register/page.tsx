"use client";

import { useActionState, useEffect, useState } from "react";
import dynamic from "next/dynamic";

import {
  registerPatient,
  type RegisterPatientState,
} from "@/app/records/actions";
import { TreatmentTypeSelect } from "@/components/treatment-type-select";
import { VisitDateField } from "@/components/visit-date-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const jawColumnClassName =
  "h-[15.5rem] w-full min-w-0 max-w-full max-h-[calc(100svh-8.5rem)] lg:h-full lg:min-h-0";

const DentalJaw3D = dynamic(
  () =>
    import("@/components/dental-jaw-3d").then((module) => module.DentalJaw3D),
  {
    ssr: false,
    loading: () => (
      <div className={cn(jawColumnClassName, "flex w-full items-center justify-center rounded-2xl border border-cyan-300/20 bg-transparent text-sm text-cyan-100/70")}>
        Loading 3D jaw model…
      </div>
    ),
  },
);

const initialState: RegisterPatientState = { status: "idle" };

const fieldClassName =
  "h-9 w-full min-w-0 px-2 py-0.5 border-white/15 bg-white/8 text-sm text-white placeholder:text-sky-200/40 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/30";

const pairRowClassName = "grid min-w-0 grid-cols-2 gap-2";

const labelClassName = "text-[11px] leading-tight text-sky-100 sm:text-xs";

function localISODate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function RegisterPatientPage() {
  const [chartedTeeth, setChartedTeeth] = useState<number[]>([]);
  const [visitDate, setVisitDate] = useState("");
  const [state, formAction, pending] = useActionState(
    registerPatient,
    initialState,
  );

  useEffect(() => {
    setVisitDate(localISODate());
  }, []);

  return (
    <form action={formAction} className="grid min-w-0 max-w-full gap-6 [color-scheme:dark]">
      <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:overflow-visible">
        <div className="flex w-full min-w-0 flex-col gap-4">
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:p-6">
            <header className="mb-3">
              <h2 className="min-w-0 truncate text-center text-base font-semibold leading-tight text-white sm:text-xl">
                Patient details
              </h2>
            </header>
            <div className="grid flex-1 content-start gap-2.5">
              <div className="grid min-w-0 gap-1">
                <Label htmlFor="register-name" className={labelClassName}>
                  Full name
                </Label>
                <Input
                  id="register-name"
                  name="name"
                  required
                  autoComplete="name"
                  placeholder="سارا عەلی"
                  className={fieldClassName}
                />
              </div>
              <div className={pairRowClassName}>
                <div className="grid min-w-0 gap-1">
                  <Label htmlFor="register-age" className={labelClassName}>
                    Age
                  </Label>
                  <Input
                    id="register-age"
                    name="age"
                    type="number"
                    required
                    min={1}
                    max={120}
                    inputMode="numeric"
                    placeholder="34"
                    className={fieldClassName}
                  />
                </div>
                <div className="grid min-w-0 gap-1">
                  <Label htmlFor="register-visit" className={labelClassName}>
                    Visit date
                  </Label>
                  <VisitDateField
                    id="register-visit"
                    name="visitDate"
                    required
                    defaultValue={visitDate}
                    className={fieldClassName}
                  />
                </div>
              </div>
              <div className={pairRowClassName}>
                <div className="grid min-w-0 gap-1">
                  <Label htmlFor="register-price" className={labelClassName}>
                    Price (IQD)
                  </Label>
                  <Input
                    id="register-price"
                    name="price"
                    type="number"
                    required
                    min={0}
                    step="1"
                    inputMode="numeric"
                    placeholder="25000 IQD"
                    className={fieldClassName}
                  />
                </div>
                <div className="grid min-w-0 gap-1">
                  <Label htmlFor="register-phone" className={labelClassName}>
                    Phone number
                  </Label>
                  <Input
                    id="register-phone"
                    name="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="(555) 014-2800"
                    className={fieldClassName}
                  />
                </div>
              </div>
              <div className="grid min-w-0 gap-1">
                <Label htmlFor="register-treatment" className={labelClassName}>
                  Treatment Type
                </Label>
                <TreatmentTypeSelect
                  id="register-treatment"
                  name="treatmentType"
                  required
                  className={fieldClassName}
                />
              </div>
              <div className="grid flex-1 gap-1">
                <Label htmlFor="register-complaint" className={labelClassName}>
                  Chief dental complaint
                </Label>
                <textarea
                  id="register-complaint"
                  name="complaint"
                  required
                  rows={4}
                  placeholder="Toothache on the upper right, sensitivity to cold…"
                  className="min-h-24 w-full flex-1 rounded-lg border border-white/15 bg-white/8 px-2 py-1.5 text-sm text-white placeholder:text-sky-200/40 outline-none focus-visible:border-cyan-300/70 focus-visible:ring-3 focus-visible:ring-cyan-300/30"
                />
              </div>
            </div>
          </section>

          {state.status === "error" ? (
            <p className="text-sm text-rose-300" role="alert">
              {state.message}
            </p>
          ) : null}
        </div>

        <div className={jawColumnClassName}>
          <DentalJaw3D fill selected={chartedTeeth} onChange={setChartedTeeth} />
        </div>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded-xl bg-cyan-400 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-cyan-300"
      >
        {pending ? "Saving…" : "Save patient"}
      </Button>
    </form>
  );
}
