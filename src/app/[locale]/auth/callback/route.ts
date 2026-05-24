import { type NextRequest, NextResponse } from "next/server";

import { ensureUserProfile } from "@/lib/auth/profile";
import { localizedPath, normalizeRedirectPath } from "@/lib/auth/roles";
import { isLocale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type CallbackContext = {
  params: Promise<{
    locale: string;
  }>;
};

export async function GET(request: NextRequest, context: CallbackContext) {
  const { locale } = await context.params;

  if (!isLocale(locale)) {
    return NextResponse.redirect(new URL("/it/login", request.url));
  }

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = normalizeRedirectPath(
    requestUrl.searchParams.get("next"),
    localizedPath(locale, "/account"),
  );

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await ensureUserProfile(supabase, user, locale);
      }

      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(
    new URL(`${localizedPath(locale, "/login")}?auth=callback_error`, request.url),
  );
}
