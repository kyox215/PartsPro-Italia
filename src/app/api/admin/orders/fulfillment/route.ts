import { NextResponse } from "next/server";
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
    if (parsed.data.action === "start_picking") {
      await startOrderPicking(parsed.data.id);
    } else if (parsed.data.action === "mark_shipped") {
      await shipOrPickupOrder({ orderId: parsed.data.id, mode: "shipped" });
    } else if (parsed.data.action === "mark_picked_up") {
      await shipOrPickupOrder({ orderId: parsed.data.id, mode: "picked_up" });
    } else {
      await completeOrder(parsed.data.id);
    }
    backUrl.searchParams.set("saved", parsed.data.action);
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Fulfillment update failed",
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
