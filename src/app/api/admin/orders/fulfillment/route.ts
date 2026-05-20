import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import {
  completeOrder,
  shipOrPickupOrder,
  startOrderPicking,
} from "@/lib/order-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminOrderFulfillmentSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminOrderFulfillmentSchema.safeParse(rawBody);
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
    if (parsed.data.action === "start_picking") {
      await startOrderPicking(parsed.data.id, admin.context.user?.id);
    } else if (parsed.data.action === "mark_shipped") {
      await shipOrPickupOrder({
        orderId: parsed.data.id,
        mode: "shipped",
        actorProfileId: admin.context.user?.id,
      });
    } else if (parsed.data.action === "mark_picked_up") {
      await shipOrPickupOrder({
        orderId: parsed.data.id,
        mode: "picked_up",
        actorProfileId: admin.context.user?.id,
      });
    } else {
      await completeOrder(parsed.data.id, admin.context.user?.id);
    }
    await recordAdminActivity({
      request,
      actor: admin.context,
      action: `order.fulfillment.${parsed.data.action}`,
      entityType: "order",
      entityId: parsed.data.id,
      afterData: {
        action: parsed.data.action,
      },
    });
    backUrl.searchParams.set("saved", parsed.data.action);
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Fulfillment update failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}
