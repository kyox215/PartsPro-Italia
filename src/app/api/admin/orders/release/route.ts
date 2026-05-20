import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import { releaseOrderReservations } from "@/lib/order-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminOrderWorkflowSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminOrderWorkflowSchema.safeParse(rawBody);
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
    await releaseOrderReservations({
      orderId: parsed.data.id,
      paymentStatus: "cancelled",
      status: "cancelled",
      note: "Order cancelled by admin",
      actorProfileId: admin.context.user?.id,
    });
    await recordAdminActivity({
      request,
      actor: admin.context,
      action: "order.release",
      entityType: "order",
      entityId: parsed.data.id,
      afterData: {
        status: "cancelled",
        paymentStatus: "cancelled",
        note: "Order cancelled by admin",
      },
    });
    backUrl.searchParams.set("saved", "released");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Release failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}
