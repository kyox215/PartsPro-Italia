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

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: "/admin/products",
    allowedPrefixes: ["/admin/products"],
  });

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdminPermission("products:write");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  const rows = parseRows(rawBody);
  if (!rows.length) {
    backUrl.searchParams.set("saved", "0");
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  for (const row of rows) {
    const { error: productError } = await supabase
      .from("products")
      .update({
        slug: row.slug,
        brand: row.brand,
        model: row.model,
        category: row.category,
        quality_grade: row.qualityGrade,
        name_it: row.nameIt,
        name_zh: row.nameZh,
        description_it: row.descriptionIt || null,
        description_zh: row.descriptionZh || null,
        image_url: row.imageUrl || null,
        is_active: row.isActive,
        archived_at: row.isActive ? null : now,
        updated_at: now,
      })
      .eq("id", row.productId);

    if (productError) {
      backUrl.searchParams.set("error", productError.message);
      return NextResponse.redirect(backUrl, 303);
    }

    const { error: skuError } = await supabase
      .from("skus")
      .update({
        sku: row.sku,
        barcode_ean13: row.barcodeEan13 || null,
        cost_price: row.costPrice === "" ? null : Number(row.costPrice),
        color: row.color || null,
        compatibility: row.compatibility
          ? row.compatibility.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
        moq: Number(row.moq),
        retail_price: Number(row.retailPrice),
        b2b_price: Number(row.b2bPrice),
        is_active: row.isActive,
        archived_at: row.isActive ? null : now,
        updated_at: now,
      })
      .eq("id", row.skuId);

    if (skuError) {
      backUrl.searchParams.set("error", skuError.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "product.inline_update",
    entityType: "sku",
    entityId: "inline",
    afterData: {
      count: rows.length,
      skuIds: rows.map((row) => row.skuId),
    },
  });

  backUrl.searchParams.set("saved", "inline");
  backUrl.searchParams.set("count", String(rows.length));
  return NextResponse.redirect(backUrl, 303);
}

function parseRows(body: Record<string, unknown>) {
  const dirtyIds = String(body.dirtyIds ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const dirtySet = new Set(dirtyIds);
  const rowCount = Number(body.rowCount ?? 0);
  const rows = [];

  for (let index = 0; index < rowCount; index += 1) {
    const skuId = text(body[`row:${index}:skuId`]);
    if (!skuId || !dirtySet.has(skuId)) continue;
    rows.push({
      productId: text(body[`row:${index}:productId`]),
      skuId,
      slug: text(body[`row:${index}:slug`]),
      sku: text(body[`row:${index}:sku`]),
      barcodeEan13: text(body[`row:${index}:barcodeEan13`]),
      category: text(body[`row:${index}:category`]),
      qualityGrade: text(body[`row:${index}:qualityGrade`]),
      color: text(body[`row:${index}:color`]),
      costPrice: text(body[`row:${index}:costPrice`]),
      descriptionIt: text(body[`row:${index}:descriptionIt`]),
      descriptionZh: text(body[`row:${index}:descriptionZh`]),
      compatibility: text(body[`row:${index}:compatibility`]),
      nameIt: text(body[`row:${index}:nameIt`]),
      nameZh: text(body[`row:${index}:nameZh`]),
      brand: text(body[`row:${index}:brand`]),
      model: text(body[`row:${index}:model`]),
      retailPrice: text(body[`row:${index}:retailPrice`]),
      b2bPrice: text(body[`row:${index}:b2bPrice`]),
      moq: text(body[`row:${index}:moq`]),
      imageUrl: text(body[`row:${index}:imageUrl`]),
      isActive: text(body[`row:${index}:isActive`]) === "true",
    });
  }

  return rows.filter((row) =>
    row.productId &&
    row.skuId &&
    row.slug &&
    row.sku &&
    row.brand &&
    row.model &&
    row.category &&
    row.qualityGrade &&
    row.nameIt &&
    row.nameZh &&
    Number.isFinite(Number(row.retailPrice)) &&
    Number.isFinite(Number(row.b2bPrice)) &&
    Number.isFinite(Number(row.moq)),
  );
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
