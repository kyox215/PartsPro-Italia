import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { redirectOnInvalidAdminCsrf } from "@/lib/admin-security";
import { assertAdminPermission } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminInventoryAdjustSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminInventoryAdjustSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const backUrl = new URL(`/${locale}/admin/inventory`, request.url);
  backUrl.searchParams.set("tools", "open");

  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdminPermission("inventory:write");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("adjusted", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const payload = parsed.data;
  if (payload.quantity === 0) {
    backUrl.searchParams.set("error", "Quantity must be greater than 0");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const { data: inventory, error: loadError } = await supabase
    .from("inventory")
    .select("id, sku_id, stock_on_hand, incoming_qty")
    .eq("sku_id", payload.skuId)
    .eq("warehouse_code", "MAIN")
    .maybeSingle();

  if (loadError || !inventory) {
    backUrl.searchParams.set("error", loadError?.message ?? "Inventory row not found");
    return NextResponse.redirect(backUrl, 303);
  }

  const currentStock = Number(inventory.stock_on_hand ?? 0);
  const currentIncoming = Number(inventory.incoming_qty ?? 0);
  const next = computeAdjustment(payload.adjustmentType, payload.quantity, currentStock, currentIncoming);

  if (next.stockOnHand < 0 || next.incomingQty < 0) {
    backUrl.searchParams.set("error", "Adjustment would make inventory negative");
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: updateError } = await supabase
    .from("inventory")
    .update({
      stock_on_hand: next.stockOnHand,
      incoming_qty: next.incomingQty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", inventory.id);

  if (updateError) {
    backUrl.searchParams.set("error", updateError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: movementError } = await supabase.from("inventory_movements").insert({
    sku_id: inventory.sku_id,
    movement_type: payload.adjustmentType === "set_stock" ? "stock_correction" : "manual_adjustment",
    quantity: payload.quantity,
    stock_delta: next.stockDelta,
    incoming_delta: next.incomingDelta,
    note: payload.reason,
    metadata: {
      adjustmentType: payload.adjustmentType,
      previousStock: currentStock,
      previousIncoming: currentIncoming,
    },
  });

  if (movementError) {
    backUrl.searchParams.set("error", movementError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "inventory.adjust",
    entityType: "sku",
    entityId: inventory.sku_id,
    beforeData: {
      stockOnHand: currentStock,
      incomingQty: currentIncoming,
    },
    afterData: {
      adjustmentType: payload.adjustmentType,
      quantity: payload.quantity,
      stockOnHand: next.stockOnHand,
      incomingQty: next.incomingQty,
      stockDelta: next.stockDelta,
      incomingDelta: next.incomingDelta,
      reason: payload.reason,
    },
  });

  backUrl.searchParams.set("adjusted", "1");
  return NextResponse.redirect(backUrl, 303);
}

function computeAdjustment(
  type: string,
  quantity: number,
  stockOnHand: number,
  incomingQty: number,
) {
  if (type === "add_stock") {
    return { stockOnHand: stockOnHand + quantity, incomingQty, stockDelta: quantity, incomingDelta: 0 };
  }
  if (type === "remove_stock") {
    return { stockOnHand: stockOnHand - quantity, incomingQty, stockDelta: -quantity, incomingDelta: 0 };
  }
  if (type === "set_stock") {
    return { stockOnHand: quantity, incomingQty, stockDelta: quantity - stockOnHand, incomingDelta: 0 };
  }
  if (type === "add_incoming") {
    return { stockOnHand, incomingQty: incomingQty + quantity, stockDelta: 0, incomingDelta: quantity };
  }
  return { stockOnHand, incomingQty: incomingQty - quantity, stockDelta: 0, incomingDelta: -quantity };
}
