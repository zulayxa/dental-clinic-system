"use client";

import { useEffect, useId, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, LayoutDashboard, LogOut, Menu, MonitorPlay, Users, X } from "lucide-react";

import { logoutAdmin } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const drawerId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const onTv = pathname === "/tv";
  const onRecords = pathname.startsWith("/records");
  const onDashboard = pathname.startsWith("/dashboard");
  const onLanding = pathname === "/landing";
  const onLogin = pathname === "/" || pathname === "/login";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen || !onLanding) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [menuOpen, onLanding]);

  function goHome(event: MouseEvent<HTMLAnchorElement>) {
    setMenuOpen(false);
    if (pathname !== "/landing") return;
    event.preventDefault();
    document.getElementById("hero")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  if (onLogin) return null;

  return (
    <header
      suppressHydrationWarning
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#01113a]/55 pt-[env(safe-area-inset-top)] shadow-[0_8px_40px_rgba(1,17,58,0.35)] backdrop-blur-xl"
    >
      <div className="mx-auto flex h-[4.25rem] w-full max-w-7xl items-center justify-between gap-1.5 px-3 sm:gap-3 sm:px-8 lg:gap-4 lg:px-12">
        <Link
          href="/landing#hero"
          className="flex min-w-0 shrink-0 items-center gap-1.5 transition-opacity hover:opacity-90 sm:gap-2"
          aria-label="Dental Care home"
          aria-current={onLanding ? "page" : undefined}
          onClick={goHome}
          suppressHydrationWarning
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/header-tooth.png"
            alt=""
            width={840}
            height={720}
            draggable={false}
            className="pointer-events-none -mx-1 h-[3.15rem] w-[3.7rem] shrink-0 bg-transparent object-contain select-none sm:h-[3.55rem] sm:w-[4.15rem]"
          />
          <span className="drop-shadow-[0_0_14px_rgba(232,197,120,0.45)]">
            <span className="block truncate bg-[linear-gradient(180deg,#ffffff_0%,#fff8e4_18%,#efd078_40%,#ffffff_55%,#d4a84a_82%,#fff3cc_100%)] bg-clip-text text-lg leading-none font-extrabold tracking-[-0.04em] text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] sm:text-[1.85rem]">
              Dental Care
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center">
        <nav className="hidden shrink-0 items-center gap-2 lg:flex">
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-10 border-0 bg-transparent px-2 text-sm font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent",
              onDashboard && "text-white",
            )}
            asChild
          >
            <Link
              href="/dashboard"
              aria-current={onDashboard ? "page" : undefined}
            >
              <LayoutDashboard className="size-3.5" data-icon="inline-start" />
              Dashboard
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-10 border-0 bg-transparent px-2 text-sm font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent",
              onRecords && "text-white",
            )}
            asChild
          >
            <Link href="/records" aria-current={onRecords ? "page" : undefined}>
              <Users className="size-3.5" data-icon="inline-start" />
              Patient Records
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-10 border-0 bg-transparent px-2 text-sm font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent",
              onTv && "text-white",
            )}
            asChild
          >
            <Link href="/tv" aria-current={onTv ? "page" : undefined}>
              <MonitorPlay className="size-3.5" data-icon="inline-start" />
              Waiting Room TV
            </Link>
          </Button>
          <form action={logoutAdmin}>
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="h-10 border-0 bg-transparent px-2 text-sm font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent"
            >
              Sign out
            </Button>
          </form>
        </nav>

        {onLanding ? (
          <div className="flex shrink-0 items-center lg:hidden">
            <Button
              type="button"
              size="icon"
              variant="outline"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls={drawerId}
              onClick={() => setMenuOpen((open) => !open)}
              className="size-10 rounded-full border-white/20 bg-white/10 text-cyan-50 hover:bg-white/20 hover:text-white"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Go back"
            onClick={() => router.back()}
            className="size-10 rounded-full border-white/20 bg-white/10 text-cyan-50 hover:bg-white/20 hover:text-white"
          >
            <ArrowRight className="size-5" strokeWidth={2.25} />
          </Button>
        )}
        </div>
      </div>

      {onLanding && mounted ? (
      <div
        className={cn(
          "lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
          className={cn(
            "fixed inset-0 top-[calc(4.25rem+env(safe-area-inset-top))] z-40 bg-[#01113a]/70 backdrop-blur-sm transition-opacity",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <nav
          id={drawerId}
          aria-label="Mobile navigation"
          suppressHydrationWarning
          className={cn(
            "fixed top-[calc(4.25rem+env(safe-area-inset-top))] right-0 z-50 flex h-[calc(100dvh-4.25rem-env(safe-area-inset-top))] w-fit max-w-[min(12.75rem,calc(100vw-4.5rem))] min-w-0 flex-col items-start gap-0 overflow-x-hidden overflow-y-auto border-l border-white/10 bg-[#02153f]/95 px-2 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[-12px_0_40px_rgba(1,17,58,0.55)] backdrop-blur-xl transition-transform duration-200 ease-out",
            menuOpen ? "translate-x-0" : "translate-x-full",
          )}
          aria-hidden={!menuOpen}
          {...(!menuOpen ? { inert: true } : {})}
        >
          <p className="mb-0.5 px-1 text-[11px] leading-tight font-medium text-sky-200/70 sm:text-xs">
            Menu
          </p>
          <div className="flex w-fit max-w-full flex-col gap-0">
          <Button
            variant="ghost"
            className={cn(
              "h-6 w-fit max-w-full justify-start border-0 bg-transparent px-1.5 py-0 text-sm leading-none font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent",
              onDashboard && "text-white",
            )}
            asChild
          >
            <Link
              href="/dashboard"
              aria-current={onDashboard ? "page" : undefined}
            >
              <LayoutDashboard className="size-3.5" data-icon="inline-start" />
              Dashboard
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "h-6 w-fit max-w-full justify-start border-0 bg-transparent px-1.5 py-0 text-sm leading-none font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent",
              onRecords && "text-white",
            )}
            asChild
          >
            <Link href="/records" aria-current={onRecords ? "page" : undefined}>
              <Users className="size-3.5" data-icon="inline-start" />
              Patient Records
            </Link>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "h-6 w-fit max-w-full justify-start border-0 bg-transparent px-1.5 py-0 text-sm leading-none font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent",
              onTv && "text-white",
            )}
            asChild
          >
            <Link href="/tv" aria-current={onTv ? "page" : undefined}>
              <MonitorPlay className="size-3.5" data-icon="inline-start" />
              Waiting Room TV
            </Link>
          </Button>
          </div>
          <form action={logoutAdmin} className="mt-auto w-fit pt-2">
            <Button
              type="submit"
              variant="ghost"
              className="h-8 w-fit max-w-full justify-start border-0 bg-transparent px-1.5 text-sm font-medium text-cyan-50 shadow-none hover:bg-transparent hover:text-white dark:hover:bg-transparent"
            >
              <LogOut className="size-3.5" data-icon="inline-start" />
              Sign out
            </Button>
          </form>
        </nav>
      </div>
      ) : null}
    </header>
  );
}
