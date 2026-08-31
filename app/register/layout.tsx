import type { Metadata } from "next";
import { ViewTransition } from "react";

import { StaffShell } from "@/components/staff-shell";

export const metadata: Metadata = {
  title: "New Patient Registration — Lumina Dental",
  description:
    "Open a new patient chart with contact details, visit date, and dental charting.",
};

export default function RegisterLayout({
  children,
}: LayoutProps<"/register">) {
  return (
    <ViewTransition>
      <StaffShell
        eyebrow={false}
        contentClassName="max-w-none min-w-0 px-3 py-4 sm:px-6 sm:py-5"
      >
        {children}
      </StaffShell>
    </ViewTransition>
  );
}
