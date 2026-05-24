import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  canAccessAdminPath,
  getLocaleFromPathname,
  localizedPath,
} from "@/lib/auth/roles";
import type { AppRole, Database } from "@/types";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });
  const pathname = request.nextUrl.pathname;
  const locale = getLocaleFromPathname(pathname);
  const isAuthRoute =
    pathname === localizedPath(locale, "/login") ||
    pathname === localizedPath(locale, "/register");
  const isAccountRoute = pathname.startsWith(localizedPath(locale, "/account"));
  const isAdminRoute = pathname.startsWith(localizedPath(locale, "/admin"));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublicKey = getSupabasePublicKey();

  if (!supabaseUrl || !supabasePublicKey) {
    if (isAccountRoute || isAdminRoute) {
      const loginUrl = new URL(localizedPath(locale, "/login"), request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabasePublicKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isAuthRoute) {
    return NextResponse.redirect(
      new URL(localizedPath(locale, "/account"), request.url),
    );
  }

  if (!user && (isAccountRoute || isAdminRoute)) {
    const loginUrl = new URL(localizedPath(locale, "/login"), request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!canAccessAdminPath(profile?.role as AppRole | null, pathname)) {
      return NextResponse.redirect(
        new URL(localizedPath(locale, "/403"), request.url),
      );
    }
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function getSupabasePublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
