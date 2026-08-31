import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StaffShellProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  eyebrow?: string | false;
  contentClassName?: string;
};

export function StaffShell({
  children,
  title,
  description,
  eyebrow = false,
  contentClassName,
}: StaffShellProps) {
  return (
    <div className="relative isolate min-h-svh overflow-x-hidden bg-[#01113a] pt-[4.75rem] text-sky-50">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_-10%,#2b9dff_0%,transparent_42%),radial-gradient(ellipse_70%_50%_at_10%_110%,#0a4ec8_0%,transparent_50%)]"
      />
      <main
        className={cn(
          "relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10",
          contentClassName,
        )}
      >
        {title ? (
          <div className="mb-6">
            {eyebrow ? (
              <p className="text-sm font-medium tracking-wide text-cyan-300 uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "text-3xl font-semibold tracking-tight text-white sm:text-4xl",
                eyebrow && "mt-1",
              )}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100/70">
                {description}
              </p>
            ) : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
