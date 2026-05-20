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
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminProductSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET() {
  const admin = await assertAdmin();

  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({
      mode: "demo",
      products: [],
      message: "Supabase is not configured; admin products use local seed data.",
    });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("skus")
    .select("*, products (*), inventory (*)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase", products: data });
}

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = String(rawBody.locale ?? "it");
  const parsed = adminProductSchema.safeParse(rawBody);
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: null,
    fallbackPath: "/admin/products",
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

  const admin = await assertAdmin();

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

  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
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
      is_active: true,
    })
    .select("id")
    .single();

  if (productError || !product) {
    backUrl.searchParams.set("error", productError?.message ?? "Product insert failed");
    return NextResponse.redirect(backUrl, 303);
  }

  const { data: sku, error: skuError } = await supabase
    .from("skus")
    .insert({
      product_id: product.id,
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
      vat_rate: 0.22,
      is_active: true,
    })
    .select("id")
    .single();

  if (skuError || !sku) {
    backUrl.searchParams.set("error", skuError?.message ?? "SKU insert failed");
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: inventoryError } = await supabase.from("inventory").insert({
    sku_id: sku.id,
    warehouse_code: "MAIN",
    stock_on_hand: payload.stockOnHand,
    incoming_qty: payload.incomingQty,
  });

  if (inventoryError) {
    backUrl.searchParams.set("error", inventoryError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    await upsertSkuAttributeValues(
      supabase,
      sku.id,
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
    action: "product.create",
    entityType: "sku",
    entityId: sku.id,
    afterData: {
      productId: product.id,
      skuId: sku.id,
      sku: payload.sku,
      brand: payload.brand,
      model: payload.model,
      category: payload.category,
      qualityGrade: payload.qualityGrade,
      retailPrice: payload.retailPrice,
      b2bPrice: payload.b2bPrice,
      stockOnHand: payload.stockOnHand,
      incomingQty: payload.incomingQty,
    },
  });

  backUrl.searchParams.set("saved", "1");
  return NextResponse.redirect(backUrl, 303);
}
