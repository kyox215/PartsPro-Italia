import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminCatalogImportSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminCatalogImportSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "it");
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

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("import_price_catalog_batch", {
    batch_size: parsed.data.batchSize,
  });

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const result = Array.isArray(data) ? data[0] : data;
  backUrl.searchParams.set("imported", String(result?.skus_upserted ?? 0));
  backUrl.searchParams.set("processed", String(result?.processed ?? 0));
  backUrl.searchParams.set("message", String(result?.message ?? "ok"));
  return NextResponse.redirect(backUrl, 303);
}
