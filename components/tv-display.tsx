"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  PATIENT_TABLE,
  QUEUE_ACTIVE_STATUSES,
  QUEUE_DONE_STATUS,
  isActiveQueueStatus,
  ticketFromRow,
  type PatientRow,
  type WaitingTicket,
} from "@/lib/supabase/patient-row";
import { cn } from "@/lib/utils";

type QueueTicket = WaitingTicket;

const QUEUE_SELECT = "id, full_name, queue_number, room_number, status";

const timeFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
});

const digitClassName =
  "shrink-0 self-center font-sans text-[clamp(1.05rem,calc(0.5rem+2.7vw),2.35rem)] leading-none font-medium tracking-tight text-cyan-200 tabular-nums [font-variant-numeric:tabular-nums]";

function pickVoice(voices: SpeechSynthesisVoice[]) {
  const ranked = [
    (lang: string) => lang.startsWith("ckb"),
    (lang: string) => lang.startsWith("ku"),
    (lang: string) => lang === "ar-iq",
    (lang: string) => lang.startsWith("ar"),
  ];

  for (const matches of ranked) {
    const voice = voices.find((item) => matches(item.lang.toLowerCase()));
    if (voice) return voice;
  }

  return null;
}

function announceTicket(ticket: QueueTicket) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(
    `نۆرەی ژمارە ${ticket.number}. ${ticket.name}. ${ticket.chair}`,
  );
  const voice = pickVoice(window.speechSynthesis.getVoices());

  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = "ar-IQ";
  }

  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function TVClockDate() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = new Date();
      setNow((prev) => {
        if (
          prev.getMinutes() === next.getMinutes() &&
          prev.getHours() === next.getHours() &&
          prev.getDate() === next.getDate() &&
          prev.getMonth() === next.getMonth()
        ) {
          return prev;
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <span
        suppressHydrationWarning
        lang="en"
        dir="ltr"
        className={digitClassName}
      >
        {dateFormat.format(now)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-y-1 sm:gap-y-1.5">
        <p
          dir="rtl"
          className="min-w-0 text-[clamp(1.05rem,calc(0.5rem+2.7vw),2.35rem)] leading-none font-medium whitespace-nowrap text-slate-100"
        >
          تکایە کاتێک ناوتان دەخوێنرێتەوە
        </p>
        <p
          dir="rtl"
          className="min-w-0 text-[clamp(1.05rem,calc(0.5rem+2.7vw),2.35rem)] leading-none font-medium whitespace-nowrap text-slate-100"
        >
          سەردانی ژووری پزیشک بکەن
        </p>
      </div>
      <time
        dateTime={now.toISOString()}
        suppressHydrationWarning
        lang="en"
        dir="ltr"
        className={digitClassName}
      >
        {timeFormat.format(now)}
      </time>
    </>
  );
}

export default function TVDisplay({
  initialQueue = [],
}: {
  initialQueue?: QueueTicket[];
}) {
  const [queue, setQueue] = useState(initialQueue);
  const [muted, setMuted] = useState(true);
  const [pulse, setPulse] = useState(false);
  const queueRef = useRef(queue);
  const pulseTimer = useRef<number>(0);

  queueRef.current = queue;

  const current = queue[0] ?? { number: 0, name: "—", chair: "—" };
  const waiting = queue.slice(1);
  const hasCurrent = queue.length > 0;

  const speakCurrent = useCallback((ticket: QueueTicket) => {
    if (muted) return;
    announceTicket(ticket);
  }, [muted]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousHtml = root.style.backgroundColor;
    const previousBody = body.style.backgroundColor;
    const previousHtmlOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    root.style.backgroundColor = "#000000";
    body.style.backgroundColor = "#000000";
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      root.style.backgroundColor = previousHtml;
      body.style.backgroundColor = previousBody;
      root.style.overflow = previousHtmlOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    async function refreshQueue() {
      const { data, error } = await supabase
        .from(PATIENT_TABLE)
        .select(QUEUE_SELECT)
        .in("status", [...QUEUE_ACTIVE_STATUSES])
        .order("queue_number", { ascending: true });

      if (cancelled || error) return;
      const tickets = ((data ?? []) as PatientRow[])
        .filter((row) => isActiveQueueStatus(row.status))
        .map(ticketFromRow);
      setQueue(tickets);
    }

    void refreshQueue();

    const channel = supabase
      .channel("patients-queue")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: PATIENT_TABLE },
        () => {
          void refreshQueue();
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    };
  }, []);

  const callNext = useCallback(() => {
    const currentQueue = queueRef.current;
    if (currentQueue.length < 2) return;

    const currentTicket = currentQueue[0];
    const nextQueue = currentQueue.slice(1);
    queueRef.current = nextQueue;
    setQueue(nextQueue);
    setPulse(true);
    if (pulseTimer.current) window.clearTimeout(pulseTimer.current);
    pulseTimer.current = window.setTimeout(() => setPulse(false), 900);
    speakCurrent(nextQueue[0]);

    void createSupabaseBrowserClient()
      .from(PATIENT_TABLE)
      .update({ status: QUEUE_DONE_STATUS })
      .eq("id", currentTicket.id);
  }, [speakCurrent]);

  const repeatAnnouncement = useCallback(() => {
    const ticket = queueRef.current[0];
    if (!ticket) return;
    speakCurrent(ticket);
  }, [speakCurrent]);

  const toggleMute = useCallback(() => {
    setMuted((wasMuted) => {
      const nextMuted = !wasMuted;
      const ticket = queueRef.current[0];
      if (!nextMuted && ticket) {
        announceTicket(ticket);
      } else if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
      return nextMuted;
    });
  }, []);

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-black px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-white sm:px-5 sm:py-3 md:px-8 md:py-4">
      <header className="mb-2 shrink-0 text-center sm:mb-3">
        <h1 className="text-[clamp(1.45rem,6vw,2.25rem)] font-semibold tracking-wide text-white sm:text-5xl lg:text-6xl">
          کلینیکی ددان
        </h1>
      </header>

      <section
        className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border-[3px] border-cyan-500 bg-slate-900 shadow-[0_0_80px_-20px_rgb(6_182_212)] sm:rounded-[1.75rem] md:rounded-[2rem] md:border-4"
        aria-live="polite"
      >
        <div
          dir="ltr"
          className="flex min-w-0 shrink-0 items-center gap-x-3 px-3 pt-2.5 pb-1.5 sm:gap-x-4 sm:px-5 sm:pt-4 sm:pb-2 md:gap-x-5 md:px-8 md:pt-5"
        >
          <TVClockDate />
        </div>

        <ol className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 overflow-x-hidden overflow-y-auto px-3 pb-3 pt-2 sm:gap-3 sm:px-5 sm:pt-3 sm:pb-4 lg:overflow-hidden md:px-8 md:pt-4 md:pb-5">
          {hasCurrent ? (
            <li
              className={cn(
                "flex min-w-0 shrink-0 items-center justify-between gap-2 overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-l from-amber-400/25 via-amber-500/10 to-transparent px-3 py-3 shadow-[0_0_56px_-10px_rgba(251,191,36,0.85)] sm:gap-4 sm:rounded-3xl sm:px-6 sm:py-5 md:gap-6 md:px-8 md:py-6",
                pulse && "animate-pulse",
              )}
            >
              <p className="min-w-0 flex-1 self-center py-0.5 text-center text-[clamp(0.95rem,calc(0.55rem+2.4vw),3.5rem)] font-extrabold leading-tight tracking-tight break-words text-pretty text-amber-50">
                {current.name}
              </p>
              <p className="shrink-0 py-0.5 font-heading text-[clamp(2rem,10vw,6rem)] font-extrabold leading-none tabular-nums text-amber-300 drop-shadow-[0_0_24px_rgba(251,191,36,0.55)]">
                {current.number}
              </p>
            </li>
          ) : (
            <li className="flex flex-1 items-center justify-center px-2 text-center text-lg text-slate-500 sm:text-2xl">
              نۆرە نەماوە
            </li>
          )}

          {waiting.map((ticket) => (
            <li
              key={ticket.number}
              className="flex min-w-0 shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-800/70 px-3 py-1.5 sm:gap-4 sm:px-7 sm:py-2"
            >
              <div className="min-w-0 flex-1 text-start">
                <p className="truncate text-base text-slate-100 sm:text-2xl">
                  {ticket.name}
                </p>
              </div>
              <p className="shrink-0 font-heading text-2xl font-bold tabular-nums text-cyan-300 sm:text-4xl">
                {ticket.number}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <footer
        dir="ltr"
        className="mt-2 grid w-full min-w-0 shrink-0 grid-cols-3 gap-1.5 sm:mt-3 sm:gap-2"
      >
          <Button
            variant="outline"
            className="h-8 min-w-0 w-full shrink border-slate-700 bg-slate-900 px-1.5 text-[11px] whitespace-nowrap text-white transition-none hover:bg-slate-800 hover:text-white sm:h-9 sm:px-2.5 sm:text-sm"
            onClick={toggleMute}
          >
            {muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
            {muted ? "دەنگ بکەرەوە" : "بێدەنگ"}
          </Button>
          <Button
            variant="outline"
            className="h-8 min-w-0 w-full shrink border-slate-700 bg-slate-900 px-1.5 text-[11px] whitespace-nowrap text-white transition-none hover:bg-slate-800 hover:text-white sm:h-9 sm:px-2.5 sm:text-sm"
            onClick={repeatAnnouncement}
            disabled={!hasCurrent || muted}
          >
            دووبارەکردنەوە
          </Button>
          <Button
            className="h-8 min-w-0 w-full shrink bg-cyan-500 px-1.5 text-[11px] whitespace-nowrap text-slate-950 transition-none hover:bg-cyan-400 sm:h-9 sm:px-2.5 sm:text-sm"
            onClick={callNext}
            disabled={queue.length < 2}
          >
            نۆرەی داهاتوو
          </Button>
      </footer>
    </div>
  );
}
