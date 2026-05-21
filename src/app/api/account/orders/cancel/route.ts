import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { cancelAccountOrder } from "@/lib/account-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { accountOrderActionSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = accountOrderActionSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "it");
  const orderId = parsed.success ? parsed.data.id : String(rawBody.id ?? "");
  const redirectUrl = accountOrderUrl(request, locale, orderId);

  if (!parsed.success) {
    redirectUrl.searchParams.set("error", "invalid_payload");
    return NextResponse.redirect(redirectUrl, 303);
  }

  const auth = await getAuthContext();
  if (!auth.user) {
    redirectUrl.searchParams.set("error", "login_required");
    return NextResponse.redirect(redirectUrl, 303);
  }
  if (!hasSupabaseAdminConfig()) {
    redirectUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(redirectUrl, 303);
  }

  try {
    const result = await cancelAccountOrder({ orderId: parsed.data.id, user: auth.user });
    if (result.orderNumber) {
      redirectUrl.pathname = `/${locale}/account/orders/${encodeURIComponent(result.orderNumber)}`;
    }
    redirectUrl.searchParams.set("saved", "cancelled");
  } catch (error) {
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "cancel_failed",
    );
  }

  return NextResponse.redirect(redirectUrl, 303);
}

function accountOrderUrl(request: Request, locale: string, orderId: string) {
  return new URL(`/${locale}/account/orders/${encodeURIComponent(orderId)}`, request.url);
}
