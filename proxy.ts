import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE, isValidSession, sessionEmail } from "@/lib/auth";
import { findAuthorizedAdminEmail } from "@/lib/supabase/authorized-admin";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

const PUBLIC_PATHS = new Set(["/", "/login"]);

function nextWithPath(request: NextRequest, pathname: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function redirectWithCookies(
  url: URL,
  cookies: { name: string; value: string }[],
) {
  const redirect = NextResponse.redirect(url);
  cookies.forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);
  const cookieToken = request.cookies.get(AUTH_COOKIE)?.value;
  const cookieOk = isValidSession(cookieToken);

  if (cookieOk) {
    if (isPublic) {
      return NextResponse.redirect(new URL("/landing", request.url));
    }
    return nextWithPath(request, pathname);
  }

  let supabaseResponse = nextWithPath(request, pathname);

  if (!isSupabaseConfigured()) {
    if (!isPublic) {
      const login = new URL("/", request.url);
      login.searchParams.set("from", pathname);
      return NextResponse.redirect(login);
    }
    return supabaseResponse;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  const supabase = createServerClient(supabaseUrl(), supabaseKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authEmail = user?.email?.trim() ?? "";
  const cachedEmail = sessionEmail(cookieToken);
  let authorized = Boolean(
    authEmail && cachedEmail && cachedEmail === authEmail.toLowerCase(),
  );

  if (authEmail && !authorized) {
    const match = await findAuthorizedAdminEmail(supabase, authEmail);
    authorized = match.ok;
  }

  if (!authorized && !isPublic) {
    const login = new URL("/", request.url);
    login.searchParams.set("from", pathname);
    return redirectWithCookies(login, supabaseResponse.cookies.getAll());
  }

  if (authorized && isPublic) {
    return redirectWithCookies(
      new URL("/landing", request.url),
      supabaseResponse.cookies.getAll(),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|gltf|ico)$).*)",
  ],
};
