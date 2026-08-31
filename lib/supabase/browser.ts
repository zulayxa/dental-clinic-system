"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

type BrowserClient = ReturnType<typeof createBrowserClient>;

let browserClient: BrowserClient | null = null;

export function createSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(supabaseUrl(), supabaseKey());
  }
  return browserClient;
}
