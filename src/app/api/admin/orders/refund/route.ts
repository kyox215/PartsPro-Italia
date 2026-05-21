import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdminPermission } from "@/lib/auth";
import { issueOrderRefund } from "@/lib/order-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminOrderRefundSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminOrderRefundSchema.safeParse(rawBody);
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

  const admin = await assertAdminPermission("payments:confirm");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    const result = await issueOrderRefund({
      orderId: parsed.data.id,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      providerReference: parsed.data.providerReference || null,
      note: parsed.data.note || null,
      actorProfileId: admin.context.user?.id,
      locale: parsed.data.locale,
    });

    await recordAdminActivity({
      request,
      actor: admin.context,
      action: "order.refund.issue",
      entityType: "order",
      entityId: parsed.data.id,
      afterData: result,
    });

    backUrl.searchParams.set("saved", "refund");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Refund failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}
