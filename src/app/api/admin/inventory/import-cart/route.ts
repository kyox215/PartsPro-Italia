import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { redirectOnInvalidAdminCsrf } from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import {
  parseSupplierCartWorkbook,
  toSupplierCartPayload,
} from "@/lib/inventory-import";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { isCatalogChineseTranslationStale } from "@/lib/catalog-translation";
import type { SupplierCartImportPayloadRow } from "@/lib/inventory-import";

export const runtime = "nodejs";

const defaultCartPath = "/Users/kyox215/Downloads/cart (1).xlsx";

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get("locale") ?? "zh");
  const backUrl = new URL(`/${locale}/admin/inventory/import`, request.url);
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

  try {
    const { buffer, filename } = await readImportFile(formData);
    const rows = parseSupplierCartWorkbook(buffer);
    const payload = toSupplierCartPayload(rows);
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.rpc("import_supplier_cart_items", {
      payload_items: payload,
      source_filename: filename,
    });

    if (error) throw new Error(error.message);
    await syncSupplierCartTranslations(supabase, payload);

    const result = Array.isArray(data) ? data[0] : data;
    await recordAdminActivity({
      request,
      actor: admin.context,
      action: "inventory.import_supplier_cart",
      entityType: "supplier_purchase_order",
      entityId: result?.purchase_order_id ?? null,
      afterData: {
        filename,
        imported: result?.imported ?? 0,
        processed: result?.processed ?? rows.length,
        skipped: result?.skipped ?? 0,
        orderedQty: result?.ordered_qty ?? 0,
      },
    });
    backUrl.searchParams.set("imported", String(result?.imported ?? 0));
    backUrl.searchParams.set("processed", String(result?.processed ?? rows.length));
    backUrl.searchParams.set("skipped", String(result?.skipped ?? 0));
    backUrl.searchParams.set("ordered", String(result?.ordered_qty ?? 0));
    backUrl.searchParams.set("po", String(result?.purchase_order_id ?? ""));
    return NextResponse.redirect(backUrl, 303);
  } catch (error) {
    backUrl.searchParams.set(
      "error",
      error instanceof Error ? error.message : "Excel import failed",
    );
    return NextResponse.redirect(backUrl, 303);
  }
}

async function syncSupplierCartTranslations(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: SupplierCartImportPayloadRow[],
) {
  const eans = payload.map((row) => row.ean13).filter(Boolean);
  if (!eans.length) return;

  const { data, error } = await supabase
    .from("products")
    .select("id, external_id, name_it, name_zh")
    .eq("external_source", "supplier_cart")
    .in("external_id", eans);

  if (error) throw new Error(error.message);

  for (const product of data ?? []) {
    const row = payload.find((candidate) => candidate.ean13 === product.external_id);
    if (!row || !isCatalogChineseTranslationStale(product.name_it, product.name_zh)) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name_zh: row.name_zh,
        description_zh: row.description_zh,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id);

    if (updateError) throw new Error(updateError.message);
  }
}

async function readImportFile(formData: FormData) {
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    return {
      buffer: Buffer.from(await file.arrayBuffer()),
      filename: file.name || "cart.xlsx",
    };
  }

  const sourcePath = String(formData.get("sourcePath") ?? defaultCartPath);
  return {
    buffer: await readFile(sourcePath),
    filename: sourcePath.split("/").pop() || "cart.xlsx",
  };
}
