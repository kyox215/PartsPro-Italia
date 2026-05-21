import { NextResponse } from "next/server";
import {
  ensureCatalogReferenceRows,
  parseSkuAttributes,
  upsertSkuAttributeValues,
} from "@/lib/admin-catalog";
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
import { adminProductUpdateSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminProductUpdateSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: "/admin/products",
    allowedPrefixes: ["/admin/products"],
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

  const admin = await assertAdminPermission("products:write");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const payload = parsed.data;
  const supabase = getSupabaseAdminClient();

  try {
    await ensureCatalogReferenceRows(supabase, payload);
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Reference upsert failed",
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: productError } = await supabase
    .from("products")
    .update({
      slug: payload.slug,
      brand: payload.brand,
      model: payload.model,
      category: payload.category,
      quality_grade: payload.qualityGrade,
      name_it: payload.nameIt,
      name_zh: payload.nameZh,
      description_it: payload.descriptionIt || null,
      description_zh: payload.descriptionZh || null,
      image_url: payload.imageUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.productId);

  if (productError) {
    backUrl.searchParams.set("error", productError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: skuError } = await supabase
    .from("skus")
    .update({
      sku: payload.sku,
      barcode_ean13: payload.barcodeEan13 || null,
      cost_price:
        typeof payload.costPrice === "number" ? payload.costPrice : null,
      color: payload.color || null,
      compatibility: payload.compatibility
        ? payload.compatibility.split(",").map((item) => item.trim()).filter(Boolean)
        : [],
      moq: payload.moq,
      retail_price: payload.retailPrice,
      b2b_price: payload.b2bPrice,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.skuId);

  if (skuError) {
    backUrl.searchParams.set("error", skuError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    await upsertSkuAttributeValues(
      supabase,
      payload.skuId,
      parseSkuAttributes(payload.attributes),
    );
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Attribute save failed",
    );
    return NextResponse.redirect(backUrl, 303);
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "product.update",
    entityType: "sku",
    entityId: payload.skuId,
    afterData: {
      productId: payload.productId,
      skuId: payload.skuId,
      sku: payload.sku,
      brand: payload.brand,
      model: payload.model,
      category: payload.category,
      qualityGrade: payload.qualityGrade,
      retailPrice: payload.retailPrice,
      b2bPrice: payload.b2bPrice,
      costPrice: payload.costPrice ?? null,
    },
  });

  backUrl.searchParams.set("saved", "1");
  return NextResponse.redirect(backUrl, 303);
}
