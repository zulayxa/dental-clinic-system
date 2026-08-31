import { ViewTransition } from "react";

import { StaffShell } from "@/components/staff-shell";

export default function EditPatientLayout({
  children,
}: LayoutProps<"/records/[id]/edit">) {
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
