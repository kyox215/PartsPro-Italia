import { NextResponse } from "next/server";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await parseRequestBody(request);
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");
  const fullName = String(body.fullName ?? "");
  const locale = String(body.locale ?? "it");

  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=supabase-not-configured`, request.url),
      303,
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        preferred_locale: locale,
      },
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, request.url),
      303,
    );
  }

  return NextResponse.redirect(new URL(`/${locale}/account?signup=check-email`, request.url), 303);
}
