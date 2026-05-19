import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import {
  parseSupplierCartWorkbook,
  toSupplierCartPayload,
} from "@/lib/inventory-import";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";

const defaultCartPath = "/Users/kyox215/Downloads/cart (1).xlsx";

export async function POST(request: Request) {
  const formData = await request.formData();
  const locale = String(formData.get("locale") ?? "zh");
  const backUrl = new URL(`/${locale}/admin/inventory`, request.url);
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

    const result = Array.isArray(data) ? data[0] : data;
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
