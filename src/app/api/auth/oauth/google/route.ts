import { NextResponse } from "next/server";
import {
  getSafeAuthRedirect,
  normalizeAuthLocale,
} from "@/lib/auth-redirect";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const locale = normalizeAuthLocale(body.locale);
  const next = getSafeAuthRedirect(body.next, locale);

  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=supabase-not-configured`, request.url),
      303,
    );
  }

  const callbackUrl = new URL("/api/auth/callback", request.url);

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data.url) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("error", error?.message ?? "google-oauth-start-failed");
    return NextResponse.redirect(loginUrl, 303);
  }

  const response = NextResponse.redirect(data.url, 303);
  const secure = new URL(request.url).protocol === "https:";

  response.cookies.set("partspro-oauth-locale", locale, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure,
  });
  response.cookies.set("partspro-oauth-next", next, {
    httpOnly: true,
    maxAge: 60 * 10,
    path: "/",
    sameSite: "lax",
    secure,
  });

  return response;
}
