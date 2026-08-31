import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export function RegisterPatientFab() {
  return (
    <div
      suppressHydrationWarning
      className="fixed right-5 bottom-5 z-40 sm:right-8 sm:bottom-8"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-cyan-400/45"
      />
      <Button
        size="icon"
        className="relative size-14 rounded-full border border-cyan-200/40 bg-cyan-400 text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.65),0_0_64px_rgba(56,189,248,0.35)] hover:bg-cyan-300 hover:text-slate-950 hover:shadow-[0_0_40px_rgba(103,232,249,0.85),0_0_80px_rgba(34,211,238,0.45)]"
        asChild
      >
        <Link href="/register" aria-label="Register a new patient">
          <Plus className="size-7" strokeWidth={2.6} />
        </Link>
      </Button>
    </div>
  );
}
