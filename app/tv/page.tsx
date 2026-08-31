import type { Metadata } from "next";
import { ViewTransition } from "react";

import TVDisplay from "@/components/tv-display";
import { listWaitingQueue } from "@/lib/db/patients";

export const metadata: Metadata = {
  title: "شاشەی نۆرە — کڵینیکی ددانی ڤایتاڵ",
  description: "Waiting-room queue display with spoken ticket announcements.",
};

export const dynamic = "force-dynamic";

export default async function TVPage() {
  let initialQueue: Awaited<ReturnType<typeof listWaitingQueue>> = [];
  try {
    initialQueue = await listWaitingQueue();
  } catch {
    initialQueue = [];
  }

  return (
    <ViewTransition>
      <div
        dir="rtl"
        lang="ckb"
        className="flex h-svh min-w-0 flex-col overflow-hidden bg-black pt-[4.75rem] font-[family-name:var(--font-noto-arabic)] text-white"
      >
        <TVDisplay initialQueue={initialQueue} />
      </div>
    </ViewTransition>
  );
}
