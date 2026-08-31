"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CircleCheck } from "lucide-react";

import {
  updatePatientInfo,
  type UpdatePatientState,
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
      <div
        className={cn(
          jawColumnClassName,
          "flex w-full items-center justify-center rounded-2xl border border-cyan-300/20 bg-transparent text-sm text-cyan-100/70",
        )}
      >
        Loading 3D jaw model…
      </div>
    ),
  },
);

const initialState: UpdatePatientState = { status: "idle" };

const fieldClassName =
  "h-9 w-full min-w-0 px-2 py-0.5 border-white/15 bg-white/8 text-sm text-white placeholder:text-sky-200/40 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/30";

const pairRowClassName = "grid min-w-0 grid-cols-2 gap-2";

const labelClassName = "text-[11px] leading-tight text-sky-100 sm:text-xs";

export type EditPatientFormValues = {
  id: string;
  name: string;
  age: number;
  phone: string;
  visitDate: string;
  price: string;
  treatmentType: string;
  complaint: string;
  chartedTeeth: number[];
};

export function EditPatientForm({ patient }: { patient: EditPatientFormValues }) {
  const router = useRouter();
  const [chartedTeeth, setChartedTeeth] = useState(patient.chartedTeeth);
  const [state, formAction, pending] = useActionState(
    updatePatientInfo,
    initialState,
  );

  useEffect(() => {
    if (state.status !== "success") return;
    const timer = window.setTimeout(() => {
      router.push("/records");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [state.status, router]);

  return (
    <div className="grid min-w-0 max-w-full gap-6 [color-scheme:dark]">
      {state.status === "success"
        ? createPortal(
            <div
              id="edit-save-success-toast"
              role="status"
              aria-live="polite"
              className="pointer-events-none fixed inset-x-0 top-[max(4.75rem,calc(env(safe-area-inset-top)+3.5rem))] z-[9999] flex justify-center px-3"
              style={{ zIndex: 9999 }}
            >
              <p className="flex w-fit max-w-[min(16rem,calc(100vw-1.5rem))] items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold leading-snug text-white shadow-[0_8px_20px_rgba(16,185,129,0.35)]">
                <CircleCheck className="size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0">{state.message}</span>
              </p>
            </div>,
            document.body,
          )
        : null}

      <form action={formAction} className="grid min-w-0 max-w-full gap-6">
        <input type="hidden" name="id" value={patient.id} />
        <input type="hidden" name="chartedTeeth" value={chartedTeeth.join(",")} />

        <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-8 lg:overflow-visible">
          <div className="flex w-full min-w-0 flex-col gap-4">
            <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:p-6">
              <header className="mb-3">
                <h2 className="min-w-0 truncate text-center text-base font-semibold leading-tight text-white sm:text-xl">
                  Edit patient
                </h2>
              </header>
              <div className="grid flex-1 content-start gap-2.5">
                <div className="grid min-w-0 gap-1">
                  <Label htmlFor="edit-name" className={labelClassName}>
                    Full name
                  </Label>
                  <Input
                    id="edit-name"
                    name="name"
                    required
                    autoComplete="name"
                    defaultValue={patient.name}
                    placeholder="سارا عەلی"
                    className={fieldClassName}
                  />
                </div>
                <div className={pairRowClassName}>
                  <div className="grid min-w-0 gap-1">
                    <Label htmlFor="edit-age" className={labelClassName}>
                      Age
                    </Label>
                    <Input
                      id="edit-age"
                      name="age"
                      type="number"
                      required
                      min={1}
                      max={120}
                      inputMode="numeric"
                      defaultValue={patient.age}
                      placeholder="34"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="grid min-w-0 gap-1">
                    <Label htmlFor="edit-visit" className={labelClassName}>
                      Visit date
                    </Label>
                    <VisitDateField
                      id="edit-visit"
                      name="visitDate"
                      required
                      defaultValue={patient.visitDate}
                      className={fieldClassName}
                    />
                  </div>
                </div>
                <div className={pairRowClassName}>
                  <div className="grid min-w-0 gap-1">
                    <Label htmlFor="edit-price" className={labelClassName}>
                      Price (IQD)
                    </Label>
                    <Input
                      id="edit-price"
                      name="price"
                      type="number"
                      required
                      min={0}
                      step="1"
                      inputMode="numeric"
                      defaultValue={patient.price}
                      placeholder="25000 IQD"
                      className={fieldClassName}
                    />
                  </div>
                  <div className="grid min-w-0 gap-1">
                    <Label htmlFor="edit-phone" className={labelClassName}>
                      Phone number
                    </Label>
                    <Input
                      id="edit-phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      defaultValue={patient.phone}
                      placeholder="(555) 014-2800"
                      className={fieldClassName}
                    />
                  </div>
                </div>
                <div className="grid min-w-0 gap-1">
                  <Label htmlFor="edit-treatment" className={labelClassName}>
                    Treatment Type
                  </Label>
                  <TreatmentTypeSelect
                    id="edit-treatment"
                    name="treatmentType"
                    required
                    defaultValue={patient.treatmentType}
                    className={fieldClassName}
                  />
                </div>
                <div className="grid min-w-0 flex-1 gap-1">
                  <Label htmlFor="edit-complaint" className={labelClassName}>
                    Chief dental complaint
                  </Label>
                  <textarea
                    id="edit-complaint"
                    name="complaint"
                    required
                    rows={4}
                    defaultValue={patient.complaint}
                    placeholder="Toothache on the upper right, sensitivity to cold…"
                    className="min-h-24 w-full min-w-0 flex-1 rounded-lg border border-white/15 bg-white/8 px-2 py-1.5 text-sm text-white placeholder:text-sky-200/40 outline-none focus-visible:border-cyan-300/70 focus-visible:ring-3 focus-visible:ring-cyan-300/30"
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
            <DentalJaw3D
              fill
              selected={chartedTeeth}
              onChange={setChartedTeeth}
              readOnly={false}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending || state.status === "success"}
          className="h-10 w-full rounded-xl bg-cyan-400 text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-cyan-300"
        >
          {pending
            ? "Saving…"
            : state.status === "success"
              ? "Saved"
              : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
