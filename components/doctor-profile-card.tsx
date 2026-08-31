import { Coins, UsersRound } from "lucide-react";

import { DoctorAvatarUpload } from "@/components/doctor-avatar-upload";
import { formatUsd, type DoctorDashboardData } from "@/lib/db/clinic";
import type { PeriodTotals, ProfilePeriodKey } from "@/lib/db/clinic-profile";

const PERIODS: { key: ProfilePeriodKey; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

function VisitTile({ label, visits }: { label: string; visits: number }) {
  return (
    <article className="min-w-0 rounded-lg border border-white/10 bg-[#02153f]/55 px-2.5 py-2 sm:px-3 sm:py-2.5">
      <p className="text-[10px] font-medium tracking-[0.12em] text-cyan-200/70 uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-heading text-base font-semibold tracking-tight text-white tabular-nums sm:text-lg">
        {visits}
      </p>
      <p className="text-[10px] text-sky-200/55">
        {visits === 1 ? "visit" : "visits"}
      </p>
    </article>
  );
}

function FinanceTile({
  label,
  totals,
}: {
  label: string;
  totals: PeriodTotals;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-[#02153f]/55 px-2.5 py-2 sm:px-3 sm:py-2.5">
      <p className="text-[10px] font-medium tracking-[0.12em] text-cyan-200/70 uppercase">
        {label}
      </p>
      <p className="mt-0.5 min-w-0 font-heading text-sm font-semibold tracking-tight break-words text-white tabular-nums sm:text-base">
        {formatUsd(totals.collected)}
      </p>
      <div className="mt-1.5 flex h-1 overflow-hidden rounded-full">
        <div className="h-full w-[40%] bg-cyan-400" />
        <div className="h-full w-[60%] bg-sky-300/35" />
      </div>
      <div className="mt-1 flex min-w-0 items-start justify-between gap-1 text-[9px] leading-tight tabular-nums sm:text-[10px]">
        <span className="min-w-0 break-words text-cyan-200/90">
          40% {formatUsd(totals.share40)}
        </span>
        <span className="min-w-0 break-words text-right text-sky-200/75">
          60% {formatUsd(totals.share60)}
        </span>
      </div>
    </article>
  );
}

export function DoctorProfileCard({
  data,
}: {
  data: DoctorDashboardData;
}) {
  const { doctor, roster, profile, avatarUrl, todayLabel, generatedAt } = data;
  const shortDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(generatedAt));

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5">
      <div className="flex flex-col items-center gap-2.5 sm:gap-3">
        <div className="flex w-full min-w-0 items-center gap-1.5 sm:gap-2">
          <p className="flex min-h-14 min-w-0 flex-1 items-center text-left text-[10px] leading-tight font-medium break-words text-cyan-100/85 sm:min-h-[4.25rem] sm:text-[11px] sm:leading-snug">
            {doctor.clinic}
          </p>
          <DoctorAvatarUpload src={avatarUrl} name={doctor.name} />
          <p className="flex min-h-14 min-w-0 flex-1 items-center justify-end text-right text-[10px] leading-tight text-sky-200/75 sm:min-h-[4.25rem] sm:text-[11px] sm:leading-snug">
            <span suppressHydrationWarning className="sm:hidden">
              {shortDate}
            </span>
            <span suppressHydrationWarning className="hidden sm:inline">
              {todayLabel}
            </span>
          </p>
        </div>
        <div className="min-w-0 w-full px-1 text-center">
          <p className="text-[10px] font-medium tracking-[0.16em] text-cyan-300 uppercase">
            {doctor.title}
          </p>
          <h2 className="mt-0.5 text-base font-semibold tracking-tight break-words text-white sm:text-lg">
            {doctor.name}
          </h2>
          <p className="mt-0.5 text-xs leading-snug text-sky-200/60">
            {doctor.hours}
          </p>
        </div>
        <div className="grid w-full min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
          {[
            { label: "Roster", value: String(roster.registered) },
            { label: "Active", value: String(roster.activeCases) },
            { label: "Chairs", value: String(roster.chairs) },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-0 rounded-lg border border-white/10 bg-[#02153f]/50 px-1 py-1.5 text-center sm:px-1.5"
            >
              <p className="font-heading text-sm font-semibold text-white tabular-nums sm:text-base">
                {item.value}
              </p>
              <p className="text-[9px] tracking-wide text-sky-200/55 uppercase">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-white">
            <UsersRound className="size-3.5 text-cyan-300" />
            <h3 className="text-sm font-semibold tracking-wide">Visits</h3>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {PERIODS.map((period) => (
              <VisitTile
                key={period.key}
                label={period.label}
                visits={profile[period.key].visits}
              />
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-white">
            <Coins className="size-3.5 text-cyan-300" />
            <h3 className="min-w-0 text-sm font-semibold tracking-wide">
              Collections · 40 / 60
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {PERIODS.map((period) => (
              <FinanceTile
                key={period.key}
                label={period.label}
                totals={profile[period.key]}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
