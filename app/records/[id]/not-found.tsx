import Link from "next/link";

import { StaffShell } from "@/components/staff-shell";
import { Button } from "@/components/ui/button";

export default function PatientChartNotFound() {
  return (
    <StaffShell
      title="Chart not found"
      description="That patient code is not in the register. Check the code and try again from the header search."
    >
      <Button
        className="rounded-full bg-cyan-400 text-slate-950 hover:bg-cyan-300 hover:text-slate-950"
        asChild
      >
        <Link href="/records">Back to patient records</Link>
      </Button>
    </StaffShell>
  );
}
