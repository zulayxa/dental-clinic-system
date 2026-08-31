import Link from "next/link";
import {
  LayoutDashboard,
  MonitorPlay,
  Stethoscope,
  Users,
  UsersRound,
} from "lucide-react";

import { DoctorProfileCard } from "@/components/doctor-profile-card";
import { RegisterPatientFab } from "@/components/register-patient-fab";
import { Button } from "@/components/ui/button";
import type { DoctorDashboardData } from "@/lib/db/clinic";

export function DoctorDashboard({ data }: { data: DoctorDashboardData }) {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-xl gap-4 pb-24 sm:gap-5 sm:pb-8">
      <DoctorProfileCard data={data} />

      <section className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5">
        <div className="mb-3 flex min-w-0 items-center gap-2">
          <LayoutDashboard className="size-4 shrink-0 text-cyan-300" />
          <h3 className="min-w-0 text-sm font-semibold text-white">
            Quick management
          </h3>
        </div>
        <div className="grid min-w-0 gap-2">
          <Button
            className="h-11 w-full min-w-0 justify-start rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 sm:h-10"
            asChild
          >
            <Link href="/records">
              <Users data-icon="inline-start" />
              Patient records
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full min-w-0 justify-start rounded-full border-white/20 bg-white/5 text-cyan-50 hover:bg-white/15 hover:text-white sm:h-10"
            asChild
          >
            <Link href="/tv">
              <MonitorPlay data-icon="inline-start" />
              Waiting room TV
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full min-w-0 justify-start rounded-full border-white/20 bg-white/5 text-cyan-50 hover:bg-white/15 hover:text-white sm:h-10"
            asChild
          >
            <Link href="/records">
              <Stethoscope data-icon="inline-start" />
              Open next chart
            </Link>
          </Button>
          <Button
            variant="outline"
            className="h-11 w-full min-w-0 justify-start rounded-full border-white/20 bg-white/5 text-cyan-50 hover:bg-white/15 hover:text-white sm:h-10"
            asChild
          >
            <Link href="/reception">
              <UsersRound data-icon="inline-start" />
              Reception lookup
            </Link>
          </Button>
        </div>
      </section>

      <RegisterPatientFab />
    </div>
  );
}
