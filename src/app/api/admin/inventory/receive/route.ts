import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { redirectOnInvalidAdminCsrf } from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
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
    itemIds: String(formData.get("itemIds") ?? ""),
  });
  const backUrl = new URL(`/${locale}/admin/inventory`, request.url);

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, formData, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdmin();
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("error", "SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.redirect(backUrl, 303);
  }

  const payload = parsed.data.itemIds
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((id) => ({
      id,
      received_qty: Number(formData.get(`received_${id}`) ?? 0),
      missing_qty: Number(formData.get(`missing_${id}`) ?? 0),
    }))
    .filter((item) => item.received_qty > 0 || item.missing_qty > 0);

  if (payload.length === 0) {
    backUrl.searchParams.set("error", "No received or missing quantities entered");
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
