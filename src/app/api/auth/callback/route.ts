import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRoleForUser } from "@/lib/auth";
import {
  getRoleAwareAuthRedirect,
  normalizeAuthLocale,
} from "@/lib/auth-redirect";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const locale = normalizeAuthLocale(
    requestUrl.searchParams.get("locale") ??
      cookieStore.get("partspro-oauth-locale")?.value,
  );
  const requestedNext =
    requestUrl.searchParams.get("next") ?? cookieStore.get("partspro-oauth-next")?.value;
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
    const response = NextResponse.redirect(loginUrl, 303);
    response.cookies.delete("partspro-oauth-locale");
    response.cookies.delete("partspro-oauth-next");
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = user
    ? await getRoleForUser({ id: user.id, email: user.email })
    : { isAdmin: false };
  const next = getRoleAwareAuthRedirect({
    value: requestedNext,
    locale,
    isAdmin: role.isAdmin,
  });
  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.delete("partspro-oauth-locale");
  response.cookies.delete("partspro-oauth-next");
  return response;
}
