import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { extendOrderReservation } from "@/lib/order-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminOrderWorkflowSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminOrderWorkflowSchema.safeParse(rawBody);
  const locale = String(rawBody.locale ?? "it");
  const backUrl = getBackUrl(request, locale, rawBody.returnTo, rawBody.id);

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const admin = await assertAdmin();
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    await extendOrderReservation(parsed.data.id);
    backUrl.searchParams.set("saved", "extended");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Extend reservation failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}

function getBackUrl(
  request: Request,
  locale: string,
  returnTo: unknown,
  id: unknown,
) {
  if (
    typeof returnTo === "string" &&
    returnTo.startsWith(`/${locale}/admin/orders`)
  ) {
    return new URL(returnTo, request.url);
  }

  return new URL(`/${locale}/admin/orders/${String(id ?? "")}`, request.url);
}
