import type { Metadata } from "next";
import { ViewTransition } from "react";

import { DoctorDashboard } from "@/components/doctor-dashboard";
import { StaffShell } from "@/components/staff-shell";
import { getDoctorDashboard } from "@/lib/db/clinic";

export const metadata: Metadata = {
  title: "Doctor Dashboard — Lumina Dental",
  description:
    "Practice analytics, today’s appointments, waiting-room status, and clinic shortcuts.",
};

export const dynamic = "force-dynamic";

export default async function DoctorDashboardPage() {
  const data = await getDoctorDashboard();

  return (
    <ViewTransition>
      <StaffShell contentClassName="min-w-0 px-3 pt-14 pb-5 sm:px-6 sm:py-10">
        <h1 className="sr-only">Doctor dashboard</h1>
        <DoctorDashboard data={data} />
      </StaffShell>
    </ViewTransition>
  );
}
