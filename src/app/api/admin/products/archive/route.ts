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
import { adminProductStateSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminProductStateSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: "/admin/products",
    allowedPrefixes: ["/admin/products"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdminPermission("products:write");
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

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "product.archive",
    entityType: "sku",
    entityId: parsed.data.skuId,
    afterData: {
      productId: parsed.data.productId,
      skuId: parsed.data.skuId,
      isActive: false,
      archivedAt: now,
    },
  });

  backUrl.searchParams.set("archived", "1");
  return NextResponse.redirect(backUrl, 303);
}
