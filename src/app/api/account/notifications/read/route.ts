import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { markAccountNotificationsRead } from "@/lib/account-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { accountNotificationReadSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = accountNotificationReadSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "it");
  const redirectUrl = new URL(`/${locale}/account`, request.url);

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
    await markAccountNotificationsRead({
      user: auth.user,
      notificationId: parsed.data.id || null,
    });
    redirectUrl.searchParams.set("saved", "notifications-read");
  } catch (error) {
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "notification_read_failed",
    );
  }

  return NextResponse.redirect(redirectUrl, 303);
}
