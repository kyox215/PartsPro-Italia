import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminProductStateSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminProductStateSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const returnTo = String(rawBody.returnTo || `/${locale}/admin/products`);
  const backUrl = new URL(returnTo, request.url);

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

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error: skuError } = await supabase
    .from("skus")
    .update({ is_active: false, archived_at: now, updated_at: now })
    .eq("id", parsed.data.skuId);

  if (skuError) {
    backUrl.searchParams.set("error", skuError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: productError } = await supabase
    .from("products")
    .update({ is_active: false, archived_at: now, updated_at: now })
    .eq("id", parsed.data.productId);

  if (productError) {
    backUrl.searchParams.set("error", productError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  backUrl.searchParams.set("archived", "1");
  return NextResponse.redirect(backUrl, 303);
}
