import { NextResponse } from "next/server";
import {
  getSafeAuthRedirect,
  normalizeAuthLocale,
} from "@/lib/auth-redirect";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const locale = normalizeAuthLocale(requestUrl.searchParams.get("locale"));
  const next = getSafeAuthRedirect(requestUrl.searchParams.get("next"), locale);
  const code = requestUrl.searchParams.get("code");

  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=supabase-not-configured`, request.url),
      303,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=oauth-code-missing`, request.url),
      303,
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(loginUrl, 303);
  }

  return NextResponse.redirect(new URL(next, request.url), 303);
}
