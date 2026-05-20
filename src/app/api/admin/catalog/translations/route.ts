import { NextResponse } from "next/server";
import {
  getCatalogChineseDescription,
  isCatalogChineseTranslationStale,
  translateCatalogProductName,
} from "@/lib/catalog-translation";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminCatalogTranslationsSchema } from "@/lib/validations";

export const runtime = "nodejs";

type ProductTranslationRow = {
  id: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  quality_grade: string | null;
  name_it: string;
  name_zh: string | null;
  description_zh: string | null;
  external_payload: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminCatalogTranslationsSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "zh");
  const backUrl = new URL(`/${locale}/admin/products`, request.url);

  if (!parsed.success) {
    backUrl.searchParams.set(
      "error",
      parsed.error.issues.map((issue) => issue.message).join(", "),
    );
    return NextResponse.redirect(backUrl, 303);
  }

  const admin = await assertAdmin();

  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("error", "SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.redirect(backUrl, 303);
  }

  try {
    const result =
      parsed.data.mode === "batch"
        ? await batchTranslateProducts(parsed.data.limit, parsed.data.overwrite)
        : await manuallySaveProductTranslation({
            productId: parsed.data.productId,
            nameZh: parsed.data.nameZh,
            descriptionZh: parsed.data.descriptionZh,
          });

    backUrl.searchParams.set("translations", parsed.data.mode);
    backUrl.searchParams.set("updated", String(result.updated));
    backUrl.searchParams.set("skipped", String(result.skipped));
    return NextResponse.redirect(backUrl, 303);
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Catalog translation failed",
    );
    return NextResponse.redirect(backUrl, 303);
  }
}

async function batchTranslateProducts(limit: number, overwrite: boolean) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      "id, brand, model, category, quality_grade, name_it, name_zh, description_zh, external_payload",
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  let updated = 0;
  let skipped = 0;

  for (const product of (data ?? []) as ProductTranslationRow[]) {
    if (!overwrite && !isCatalogChineseTranslationStale(product.name_it, product.name_zh)) {
      skipped += 1;
      continue;
    }

    const color =
      typeof product.external_payload?.color === "string"
        ? product.external_payload.color
        : null;
    const nameZh = translateCatalogProductName({
      originalName: product.name_it,
      brand: product.brand,
      model: product.model,
      color,
      qualityGrade: product.quality_grade,
      category: product.category,
    });
    const descriptionZh =
      product.description_zh?.trim() || getCatalogChineseDescription(product.category);

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name_zh: nameZh,
        description_zh: descriptionZh,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (updateError) throw new Error(updateError.message);
    updated += 1;
  }

  return { updated, skipped };
}

async function manuallySaveProductTranslation({
  productId,
  nameZh,
  descriptionZh,
}: {
  productId: string;
  nameZh: string;
  descriptionZh?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const payload: { name_zh: string; updated_at: string; description_zh?: string | null } = {
    name_zh: nameZh.trim(),
    updated_at: new Date().toISOString(),
  };

  if (descriptionZh !== undefined) {
    payload.description_zh = descriptionZh.trim() || null;
  }

  const { error } = await supabase.from("products").update(payload).eq("id", productId);
  if (error) throw new Error(error.message);

  return { updated: 1, skipped: 0 };
}
