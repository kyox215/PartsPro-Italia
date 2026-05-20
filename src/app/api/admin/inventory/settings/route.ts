import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { redirectOnInvalidAdminCsrf } from "@/lib/admin-security";
import { assertAdmin } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminInventorySettingsSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const locale = String(rawBody.locale ?? "zh");
  const parsed = adminInventorySettingsSchema.safeParse(rawBody);
  const backUrl = new URL(`/${locale}/admin/inventory`, request.url);

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
  const { error } = await supabase.from("inventory_settings").upsert(
    {
      id: true,
      b2b_markup: payload.b2bMarkup,
      retail_markup: payload.retailMarkup,
      preorder_lead_time_min_days: payload.preorderLeadTimeMinDays,
      preorder_lead_time_max_days: payload.preorderLeadTimeMaxDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "inventory.settings.update",
    entityType: "inventory_settings",
    entityId: "default",
    afterData: {
      b2bMarkup: payload.b2bMarkup,
      retailMarkup: payload.retailMarkup,
      preorderLeadTimeMinDays: payload.preorderLeadTimeMinDays,
      preorderLeadTimeMaxDays: payload.preorderLeadTimeMaxDays,
    },
  });

  backUrl.searchParams.set("settings", "1");
  return NextResponse.redirect(backUrl, 303);
}
