import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { redirectOnInvalidAdminCsrf } from "@/lib/admin-security";
import { assertAdminPermission } from "@/lib/auth";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminInventoryReceiveSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get("locale") ?? "zh");
  const parsed = adminInventoryReceiveSchema.safeParse({
    locale,
    purchaseOrderId: String(formData.get("purchaseOrderId") ?? ""),
    itemIds: String(formData.get("itemIds") ?? ""),
  });
  const backUrl = new URL(`/${locale}/admin/inventory/incoming`, request.url);
  const purchaseOrderId = String(formData.get("purchaseOrderId") ?? "");
  if (purchaseOrderId) {
    backUrl.searchParams.set("po", purchaseOrderId);
  }

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, formData, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdminPermission("inventory:write");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("error", "SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.redirect(backUrl, 303);
  }

  const itemIds = parsed.data.itemIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const { data: purchaseItems, error: loadError } = await getSupabaseAdminClient()
    .from("supplier_purchase_order_items")
    .select("id, ordered_qty, received_qty, missing_qty")
    .eq("purchase_order_id", parsed.data.purchaseOrderId)
    .in("id", itemIds)
    .in("status", ["ordered", "partial"]);

  if (loadError) {
    backUrl.searchParams.set("error", loadError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const payload = (purchaseItems ?? [])
    .map((item) => {
      const orderedQty = Number(item.ordered_qty ?? 0);
      const alreadyReceived = Number(item.received_qty ?? 0);
      const alreadyMissing = Number(item.missing_qty ?? 0);
      const remainingQty = Math.max(orderedQty - alreadyReceived - alreadyMissing, 0);
      const requestedMissing = Math.max(
        0,
        Number(formData.get(`missing_${item.id}`) ?? 0),
      );
      const missingQty = Math.min(requestedMissing, remainingQty);

      return {
        id: item.id,
        received_qty: Math.max(remainingQty - missingQty, 0),
        missing_qty: missingQty,
      };
    })
    .filter((item) => item.received_qty > 0 || item.missing_qty > 0);

  if (payload.length === 0) {
    backUrl.searchParams.set("error", "No open purchase items found");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("receive_supplier_purchase_items", {
    payload_items: payload,
  });

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const result = Array.isArray(data) ? data[0] : data;
  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "inventory.receive_purchase_items",
    entityType: "supplier_purchase_order_items",
    afterData: {
      requestedItems: payload.length,
      receivedQty: result?.received_qty ?? 0,
      missingQty: result?.missing_qty ?? 0,
      processed: result?.processed ?? payload.length,
    },
  });
  backUrl.searchParams.set("received", String(result?.received_qty ?? 0));
  backUrl.searchParams.set("missing", String(result?.missing_qty ?? 0));
  backUrl.searchParams.set("processed", String(result?.processed ?? payload.length));
  return NextResponse.redirect(backUrl, 303);
}
