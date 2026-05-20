import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminProductBulkSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminProductBulkSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const backUrl = new URL(`/${locale}/admin/products`, request.url);

  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
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

  const ids = parsed.data.ids.split(",").map((id) => id.trim()).filter(Boolean);
  const supabase = getSupabaseAdminClient();
  const { data: skus, error: loadError } = await supabase
    .from("skus")
    .select("id, product_id")
    .in("id", ids);

  if (loadError) {
    backUrl.searchParams.set("error", loadError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const active = parsed.data.action === "publish";
  const now = new Date().toISOString();
  const productIds = [...new Set((skus ?? []).map((sku) => sku.product_id))];
  const { error: skuError } = await supabase
    .from("skus")
    .update({
      is_active: active,
      archived_at: active ? null : now,
      updated_at: now,
    })
    .in("id", ids);

  if (skuError) {
    backUrl.searchParams.set("error", skuError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  if (productIds.length) {
    const { error: productError } = await supabase
      .from("products")
      .update({
        is_active: active,
        archived_at: active ? null : now,
        updated_at: now,
      })
      .in("id", productIds);

    if (productError) {
      backUrl.searchParams.set("error", productError.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  backUrl.searchParams.set("bulk", parsed.data.action);
  backUrl.searchParams.set("count", String(ids.length));
  return NextResponse.redirect(backUrl, 303);
}
