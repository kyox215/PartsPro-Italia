import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdminPermission } from "@/lib/auth";
import { updateOrderShipment } from "@/lib/order-workflow";
import { parseRequestBody } from "@/lib/request";
import { hasSupabaseAdminConfig } from "@/lib/supabase/admin";
import { adminOrderShipmentSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminOrderShipmentSchema.safeParse(rawBody);
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

  const admin = await assertAdminPermission("orders:write");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    const result = await updateOrderShipment({
      orderId: parsed.data.id,
      shippingCarrier: parsed.data.shippingCarrier || null,
      trackingNumber: parsed.data.trackingNumber || null,
      trackingUrl: parsed.data.trackingUrl || null,
      shipmentNote: parsed.data.shipmentNote || null,
      customerNote: parsed.data.customerNote || null,
      actorProfileId: admin.context.user?.id,
      locale: parsed.data.locale,
    });

    await recordAdminActivity({
      request,
      actor: admin.context,
      action: "order.shipment.update",
      entityType: "order",
      entityId: parsed.data.id,
      afterData: result,
    });
    backUrl.searchParams.set("saved", "shipment");
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Shipment update failed",
    );
  }

  return NextResponse.redirect(backUrl, 303);
}
