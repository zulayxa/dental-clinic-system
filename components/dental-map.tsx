import type { TreatmentRecord } from "@/lib/db/patients";
import { cn } from "@/lib/utils";

const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const QUAD_OFFSET: Record<string, number> = {
  UR: 10,
  UL: 20,
  LL: 30,
  LR: 40,
};

function treatedTeeth(treatments: TreatmentRecord[]) {
  const numbers = new Set<number>();

  for (const treatment of treatments) {
    for (const match of treatment.tooth.matchAll(/\((\d{2})\)/g)) {
      numbers.add(Number(match[1]));
    }
    for (const match of treatment.tooth.matchAll(/\b(UR|UL|LR|LL)(\d)\b/gi)) {
      const offset = QUAD_OFFSET[match[1].toUpperCase()];
      if (offset) numbers.add(offset + Number(match[2]));
    }
  }

  return numbers;
}

function Tooth({
  number,
  active,
}: {
  number: number;
  active: boolean;
}) {
  return (
    <span
      title={`Tooth ${number}`}
      className={cn(
        "flex aspect-square w-full min-w-0 items-center justify-center rounded-md border text-[10px] font-semibold transition-colors sm:text-[11px]",
        active
          ? "border-cyan-300 bg-cyan-400 text-slate-950 shadow-[0_0_16px_rgba(103,232,249,0.45)]"
          : "border-white/15 bg-white/5 text-sky-100/70",
      )}
    >
      {number}
    </span>
  );
}

export function DentalMap({
  treatments,
  chartedTeeth = [],
}: {
  treatments: TreatmentRecord[];
  chartedTeeth?: number[];
}) {
  const highlighted = new Set([
    ...treatedTeeth(treatments),
    ...chartedTeeth,
  ]);

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:p-6">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-base font-semibold leading-tight text-white sm:text-xl">
            Dental map
          </p>
          <p className="mt-1 text-[11px] leading-tight text-sky-100/65 sm:text-xs">
            Highlighted teeth appear in the treatment history.
          </p>
        </div>
        <p className="shrink-0 text-[11px] text-cyan-200 sm:text-xs">
          {highlighted.size} site{highlighted.size === 1 ? "" : "s"}
        </p>
      </div>
      <div className="grid min-w-0 gap-3">
        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-sky-200/60 uppercase">
            Upper
          </p>
          <div className="grid min-w-0 grid-cols-8 gap-1 sm:gap-1.5">
            {UPPER.map((number) => (
              <Tooth
                key={number}
                number={number}
                active={highlighted.has(number)}
              />
            ))}
          </div>
        </div>
        <div className="mx-auto h-px w-4/5 bg-white/10" />
        <div className="min-w-0">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-sky-200/60 uppercase">
            Lower
          </p>
          <div className="grid min-w-0 grid-cols-8 gap-1 sm:gap-1.5">
            {LOWER.map((number) => (
              <Tooth
                key={number}
                number={number}
                active={highlighted.has(number)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
