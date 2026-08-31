"use client";

import { useActionState } from "react";

import { loginAdmin, type LoginState } from "@/app/login/actions";
import { LogoTooth } from "@/components/logo-tooth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { status: "idle" };

const fieldClassName =
  "h-12 w-full min-w-0 max-w-full text-base md:text-base border-white/15 bg-white/8 text-white placeholder:text-sky-200/40 focus-visible:border-cyan-300/70 focus-visible:ring-cyan-300/30";

export function StaffLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, initialState);

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-x-hidden overflow-y-auto bg-[#01113a] pt-[max(1.5rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(0.75rem,env(safe-area-inset-left))] sm:pt-[max(2.5rem,env(safe-area-inset-top))] sm:pr-[max(1.5rem,env(safe-area-inset-right))] sm:pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:pl-[max(1.5rem,env(safe-area-inset-left))] md:px-8 lg:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_80%_-10%,#2b9dff_0%,transparent_42%),radial-gradient(ellipse_70%_50%_at_10%_110%,#0a4ec8_0%,transparent_50%)]"
      />
      <form
        action={formAction}
        className="relative z-10 w-full min-w-0 max-w-md rounded-xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_48px_rgba(1,17,58,0.45)] backdrop-blur-md [color-scheme:dark] sm:rounded-2xl sm:p-8"
      >
        <div className="mb-5 flex min-w-0 flex-col items-center text-center sm:mb-6">
          <span className="flex max-w-full items-center justify-center text-[#7cefff]">
            <LogoTooth className="h-8 w-6 shrink-0 drop-shadow-[0_0_14px_rgba(255,255,255,0.55)] sm:h-10 sm:w-8" />
            <span className="-ml-0.5 text-xl leading-none font-extrabold tracking-[-0.04em] sm:text-[1.65rem]">
              ental care
            </span>
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-white sm:mt-5 sm:text-2xl">
            Sign in
          </h1>
          <p className="mt-2 max-w-prose px-1 text-sm leading-relaxed text-pretty text-sky-200/70">
            Access is limited to the authorized clinic account.
          </p>
        </div>

        <div className="grid min-w-0 gap-3 sm:gap-4">
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="staff-email" className="text-sm text-sky-100">
              Email
            </Label>
            <Input
              id="staff-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Email address"
              className={fieldClassName}
            />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="staff-password" className="text-sm text-sky-100">
              Password
            </Label>
            <Input
              id="staff-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={fieldClassName}
            />
          </div>
          {state.status === "error" ? (
            <p className="text-sm leading-relaxed text-rose-300" role="alert">
              {state.message}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={pending}
            className="mt-1 h-12 min-h-12 w-full touch-manipulation rounded-xl bg-cyan-400 text-base font-semibold text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.35)] hover:bg-cyan-300"
          >
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
