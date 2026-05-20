import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { redirectOnInvalidAdminCsrf } from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import { normalizeAttributeKey } from "@/lib/admin-catalog";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminCatalogAttributeSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminCatalogAttributeSchema.safeParse(rawBody);
  const locale = parsed.success ? parsed.data.locale : String(rawBody.locale ?? "it");
  const backUrl = new URL(`/${locale}/admin/products`, request.url);

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
    backUrl.searchParams.set("error", "SUPABASE_SERVICE_ROLE_KEY missing");
    return NextResponse.redirect(backUrl, 303);
  }

  const payload = parsed.data;
  const supabase = getSupabaseAdminClient();
  const key = normalizeAttributeKey(payload.key);
  const { data: definition, error } = await supabase
    .from("catalog_attribute_definitions")
    .upsert(
      {
        key,
        label_it: payload.labelIt,
        label_zh: payload.labelZh,
        input_type: payload.inputType,
        unit: payload.unit || null,
        is_filterable: payload.isFilterable,
      },
      { onConflict: "key" },
    )
    .select("id")
    .single();

  if (error || !definition) {
    backUrl.searchParams.set("error", error?.message ?? "Attribute save failed");
    return NextResponse.redirect(backUrl, 303);
  }

  const options = parseOptions(payload.options);
  if (options.length > 0) {
    const { error: optionError } = await supabase
      .from("catalog_attribute_options")
      .upsert(
        options.map((option, index) => ({
          attribute_id: definition.id,
          value: option.value,
          label_it: option.labelIt,
          label_zh: option.labelZh,
          sort_order: (index + 1) * 10,
        })),
        { onConflict: "attribute_id,value" },
      );

    if (optionError) {
      backUrl.searchParams.set("error", optionError.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "catalog.attribute.upsert",
    entityType: "catalog_attribute_definition",
    entityId: definition.id,
    afterData: {
      key,
      labelIt: payload.labelIt,
      labelZh: payload.labelZh,
      inputType: payload.inputType,
      isFilterable: payload.isFilterable,
      optionCount: options.length,
    },
  });

  backUrl.searchParams.set("attribute", "saved");
  return NextResponse.redirect(backUrl, 303);
}

function parseOptions(rawValue: string | undefined) {
  if (!rawValue) return [];

  return rawValue
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValuePart, rawIt, rawZh] = line.split("|");
      const value = normalizeAttributeKey(rawValuePart).replace(/_/g, "-");
      return {
        value,
        labelIt: rawIt?.trim() || rawValuePart.trim(),
        labelZh: rawZh?.trim() || rawIt?.trim() || rawValuePart.trim(),
      };
    })
    .filter((option) => option.value);
}
