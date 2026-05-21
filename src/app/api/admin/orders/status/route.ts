import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import { assertAdminPermission } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { notifyOrderCustomer } from "@/lib/notifications";
import { recordOrderEvent } from "@/lib/order-workflow";
import { adminOrderStatusSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = String(rawBody.locale ?? "it");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: "/admin/orders",
    allowedPrefixes: ["/admin/orders"],
  });
  const parsed = adminOrderStatusSchema.safeParse(rawBody);

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

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status: parsed.data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "order.status.update",
    entityType: "order",
    entityId: parsed.data.id,
    afterData: {
      status: parsed.data.status,
    },
  });

  await recordOrderEvent({
    orderId: parsed.data.id,
    eventType: "status_updated",
    title: `Status updated to ${parsed.data.status}`,
    body: "Admin manually changed the order status.",
    actorProfileId: admin.context.user?.id,
    metadata: {
      status: parsed.data.status,
    },
  });

  try {
    await notifyOrderCustomer({
      orderId: parsed.data.id,
      type: "status_updated",
      locale: parsed.data.locale,
      metadata: {
        status: parsed.data.status,
      },
    });
  } catch (notificationError) {
    console.error("Failed to notify order customer", notificationError);
  }

  backUrl.searchParams.set("saved", "1");
  return NextResponse.redirect(backUrl, 303);
}
