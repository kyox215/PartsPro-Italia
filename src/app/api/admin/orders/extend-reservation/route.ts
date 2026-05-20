import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
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
    await extendOrderReservation(parsed.data.id, admin.context.user?.id);
    await recordAdminActivity({
      request,
      actor: admin.context,
      action: "order.extend_reservation",
      entityType: "order",
      entityId: parsed.data.id,
      afterData: {
        extendedHours: 24,
      },
    });
    backUrl.searchParams.set("saved", "extended");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Extend reservation failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}
