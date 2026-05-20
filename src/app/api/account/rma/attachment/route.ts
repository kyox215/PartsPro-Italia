import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";
import { addAccountRmaAttachment } from "@/lib/account-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { accountRmaAttachmentSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = accountRmaAttachmentSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "it");
  const rmaId = parsed.success ? parsed.data.id : String(rawBody.id ?? "");
  const redirectUrl = new URL(
    `/${locale}/account/rma/${encodeURIComponent(rmaId)}`,
    request.url,
  );

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
    await addAccountRmaAttachment({
      rmaId: parsed.data.id,
      user: auth.user,
      label: parsed.data.label,
      url: parsed.data.url,
      note: parsed.data.note,
      locale: parsed.data.locale,
    });
    redirectUrl.searchParams.set("saved", "attachment");
  } catch (error) {
    redirectUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "attachment_failed",
    );
  }

  return NextResponse.redirect(redirectUrl, 303);
}
