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
import { uploadProductImageFile } from "@/lib/product-image-storage";
import { adminProductSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET() {
  const admin = await assertAdminPermission("products:write");

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
  const { rawBody, imageFile } = await parseProductCreateRequest(request);
  const locale = String(rawBody.locale ?? "it");
  const parsed = adminProductSchema.safeParse(rawBody);
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
  const now = new Date().toISOString();

  let productImageUrl = payload.imageUrl || null;
  try {
    const uploaded = await uploadProductImageFile({
      file: imageFile,
      sku: payload.sku,
    });
    productImageUrl = uploaded?.reference ?? productImageUrl;
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Product image upload failed",
    );
    return NextResponse.redirect(backUrl, 303);
  }

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
      image_url: productImageUrl,
      is_active: payload.isActive,
      archived_at: payload.isActive ? null : now,
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
      preorder_lead_time_min_days: payload.preorderLeadTimeMinDays,
      preorder_lead_time_max_days: payload.preorderLeadTimeMaxDays,
      is_active: payload.isActive,
      archived_at: payload.isActive ? null : now,
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
    reorder_point: payload.reorderPoint,
    safety_stock: payload.safetyStock,
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
      costPrice: payload.costPrice ?? null,
      stockOnHand: payload.stockOnHand,
      incomingQty: payload.incomingQty,
      reorderPoint: payload.reorderPoint,
      safetyStock: payload.safetyStock,
      preorderLeadTimeMinDays: payload.preorderLeadTimeMinDays,
      preorderLeadTimeMaxDays: payload.preorderLeadTimeMaxDays,
      isActive: payload.isActive,
      imageUrl: productImageUrl,
    },
  });

  const successUrl = new URL(
    `/${payload.locale}/admin/products/${encodeURIComponent(sku.id)}?saved=created`,
    request.url,
  );
  return NextResponse.redirect(successUrl, 303);
}

async function parseProductCreateRequest(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return {
      rawBody: Object.fromEntries(formData.entries()),
      imageFile: formData.get("imageFile"),
    };
  }

  return {
    rawBody: await parseRequestBody(request),
    imageFile: null,
  };
}
