import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthorizedAdminLookup =
  | { ok: true; email: string }
  | { ok: false; reason: "missing" | "query"; message?: string };

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function uniqueEmails(...values: Array<string | undefined>) {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const value of values) {
    const email = value?.trim() ?? "";
    if (!email || seen.has(email)) continue;
    seen.add(email);
    list.push(email);
  }
  return list;
}

function escapeIlike(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function rowMatches(stored: string, candidates: string[]) {
  const exact = new Set(candidates);
  const lowered = new Set(candidates.map(normalize));
  return exact.has(stored) || lowered.has(normalize(stored));
}

export async function findAuthorizedAdminEmail(
  supabase: SupabaseClient,
  sessionEmail: string,
  typedEmail = sessionEmail,
): Promise<AuthorizedAdminLookup> {
  const candidates = uniqueEmails(sessionEmail, typedEmail);
  if (candidates.length === 0) {
    return { ok: false, reason: "missing" };
  }

  for (const email of candidates) {
    const { data, error } = await supabase
      .from("authorized_admin")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return { ok: false, reason: "query", message: error.message };
    }

    const stored = typeof data?.email === "string" ? data.email.trim() : "";
    if (stored && rowMatches(stored, candidates)) {
      return { ok: true, email: stored };
    }
  }

  for (const email of candidates) {
    const { data, error } = await supabase
      .from("authorized_admin")
      .select("email")
      .ilike("email", escapeIlike(email))
      .maybeSingle();

    if (error) {
      return { ok: false, reason: "query", message: error.message };
    }

    const stored = typeof data?.email === "string" ? data.email.trim() : "";
    if (stored && rowMatches(stored, candidates)) {
      return { ok: true, email: stored };
    }
  }

  return { ok: false, reason: "missing" };
}
