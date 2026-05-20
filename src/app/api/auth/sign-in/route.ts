import { NextResponse } from "next/server";
import { getRoleForUser } from "@/lib/auth";
import {
  getRoleAwareAuthRedirect,
  normalizeAuthLocale,
} from "@/lib/auth-redirect";
import { linkApprovedCustomerLead } from "@/lib/customer-leads";
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
  const locale = normalizeAuthLocale(body.locale);

  if (!hasSupabasePublicConfig()) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=supabase-not-configured`, request.url),
      303,
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/login?error=${encodeURIComponent(error.message)}`, request.url),
      303,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await linkApprovedCustomerLead({ id: user.id, email: user.email });
  }
  const role = user
    ? await getRoleForUser({ id: user.id, email: user.email })
    : { isAdmin: false };
  const next = getRoleAwareAuthRedirect({
    value: body.next,
    locale,
    isAdmin: role.isAdmin,
  });

  return NextResponse.redirect(new URL(next, request.url), 303);
}
