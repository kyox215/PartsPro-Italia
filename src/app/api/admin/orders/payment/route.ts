import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
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
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/orders/${String(rawBody.id ?? "")}`,
    allowedPrefixes: ["/admin/orders"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

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
      actorProfileId: admin.context.user?.id,
    });
    await recordAdminActivity({
      request,
      actor: admin.context,
      action:
        parsed.data.action === "confirm_cash"
          ? "order.payment.confirm_cash"
          : "order.payment.confirm_bank_transfer",
      entityType: "order",
      entityId: parsed.data.id,
      afterData: {
        paymentMethod:
          parsed.data.action === "confirm_cash" ? "cash" : "bank_transfer",
        paymentStatus: "paid",
      },
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
