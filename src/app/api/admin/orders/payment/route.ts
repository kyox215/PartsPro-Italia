import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { confirmManualPayment } from "@/lib/order-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminOrderPaymentSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminOrderPaymentSchema.safeParse(rawBody);
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
    await confirmManualPayment({
      orderId: parsed.data.id,
      expectedMethod:
        parsed.data.action === "confirm_cash" ? "cash" : "bank_transfer",
    });
    backUrl.searchParams.set("saved", "payment");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Payment update failed",
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
