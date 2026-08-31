"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { RegisterPatientFab } from "@/components/register-patient-fab";

export function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      suppressHydrationWarning
      data-mounted={mounted ? "true" : "false"}
      className="relative isolate min-h-svh overflow-x-hidden bg-[#01113a]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_72%_48%,#5ee7ff_0%,#2b9dff_14%,#1563d8_32%,#0a3fae_50%,#062a7a_70%,#01113a_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_40%,rgba(4,18,72,0.55)_0%,transparent_46%)]"
      />
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute top-[18%] right-[8%] hidden h-[58%] w-[46%] rounded-full bg-[#7af0ff]/30 blur-[100px] sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-35 mix-blend-screen bg-[linear-gradient(118deg,transparent_20%,rgba(190,245,255,0.16)_38%,transparent_46%,transparent_60%,rgba(255,255,255,0.1)_68%,transparent_76%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[18%] -left-8 hidden size-36 rounded-full bg-cyan-200/15 blur-3xl sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[12%] left-[22%] hidden size-24 rounded-full bg-sky-200/20 blur-2xl sm:block"
      />

      <main
        id="hero"
        suppressHydrationWarning
        className="relative z-10 mx-auto flex min-h-svh w-full min-w-0 max-w-7xl flex-col items-center justify-center gap-5 px-4 pt-[5.75rem] pb-28 sm:gap-8 sm:px-10 sm:pt-28 sm:pb-16 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:px-12 lg:pt-28 xl:px-16"
      >
        <div className="flex w-full min-w-0 max-w-xl flex-col items-center text-center lg:w-[46%] lg:items-start lg:text-left">
          <h1
            suppressHydrationWarning
            className="text-[clamp(2.4rem,7.2vw,6.75rem)] leading-[0.94] font-extrabold tracking-[-0.045em] text-[#7cefff] drop-shadow-[0_0_32px_rgba(94,231,255,0.35)]"
          >
            Dental
            <span className="block">Care</span>
          </h1>
          <p
            suppressHydrationWarning
            className="mt-4 max-w-md text-sm leading-6 text-balance text-sky-100/80 sm:mt-6 sm:text-base sm:leading-7 lg:text-lg lg:leading-8"
          >
            Advanced dental solutions crafted for your comfort and a brilliant
            smile.
          </p>
        </div>

        <div className="relative flex w-full min-w-0 max-w-[min(18.5rem,82vw)] items-center justify-center sm:max-w-[420px] lg:w-[54%] lg:max-w-none">
          <div
            aria-hidden
            className="hero-glow pointer-events-none absolute top-1/2 left-1/2 size-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#67e8f9]/35 blur-[80px]"
          />
          <div className="relative z-10 w-full max-w-[17.5rem] animate-float sm:max-w-[420px] lg:max-w-[620px]">
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              className="hero-orbit hero-orbit-back"
            >
              <ellipse
                className="hero-orbit-ring"
                cx="50"
                cy="50"
                rx="46"
                ry="46"
                pathLength="100"
              />
            </svg>
            <Image
              src="/clean-glowing-tooth.png"
              alt="Glowing 3D tooth"
              width={1024}
              height={1024}
              priority
              unoptimized
              suppressHydrationWarning
              className="relative z-10 h-auto w-full bg-transparent select-none"
            />
            <svg
              aria-hidden
              viewBox="0 0 100 100"
              className="hero-orbit hero-orbit-front"
            >
              <ellipse
                className="hero-orbit-ring"
                cx="50"
                cy="50"
                rx="46"
                ry="46"
                pathLength="100"
              />
            </svg>
          </div>
        </div>
      </main>

      <RegisterPatientFab />
    </div>
  );
}
