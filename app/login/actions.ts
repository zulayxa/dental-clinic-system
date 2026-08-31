"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE, createSessionValue } from "@/lib/auth";
import { findAuthorizedAdminEmail } from "@/lib/supabase/authorized-admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function loginAdmin(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { status: "error", message: "Email and password are required." };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  const sessionEmail = data.user?.email?.trim() ?? "";
  if (error || !sessionEmail) {
    return { status: "error", message: "Invalid email or password." };
  }

  if (sessionEmail.toLowerCase() !== email.toLowerCase()) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This email is not authorized to access the clinic.",
    };
  }

  const admin = await findAuthorizedAdminEmail(supabase, sessionEmail, email);
  if (!admin.ok) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message:
        admin.reason === "query"
          ? "Could not verify the authorized admin list."
          : "This email is not authorized to access the clinic.",
    };
  }

  const store = await cookies();
  store.set(AUTH_COOKIE, createSessionValue(sessionEmail), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  });

  redirect("/landing");
}

export async function logoutAdmin() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect("/");
}
