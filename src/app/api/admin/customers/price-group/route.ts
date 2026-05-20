import { NextResponse } from "next/server";
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
import { adminCustomerPriceGroupSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminCustomerPriceGroupSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const companyId = String(rawBody.id ?? "");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: null,
    fallbackPath: `/admin/customers/${companyId || ""}`,
    allowedPrefixes: ["/admin/customers"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
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

  const supabase = getSupabaseAdminClient();
  const { data: company, error: loadError } = await supabase
    .from("companies")
    .select("owner_id")
    .eq("id", parsed.data.id)
    .maybeSingle();

  if (loadError) {
    backUrl.searchParams.set("error", loadError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const { error: companyError } = await supabase
    .from("companies")
    .update({
      price_group: parsed.data.priceGroup,
      status: parsed.data.priceGroup === "retail" ? "pending" : "active",
      crm_status: parsed.data.priceGroup === "retail" ? "lead" : "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (companyError) {
    backUrl.searchParams.set("error", companyError.message);
    return NextResponse.redirect(backUrl, 303);
  }

  if (company?.owner_id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: parsed.data.priceGroup,
        updated_at: new Date().toISOString(),
      })
      .eq("id", company.owner_id);

    if (profileError) {
      backUrl.searchParams.set("error", profileError.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "customer.price_group.update",
    entityType: "company",
    entityId: parsed.data.id,
    afterData: {
      priceGroup: parsed.data.priceGroup,
      profileId: company?.owner_id ?? null,
    },
  });

  backUrl.searchParams.set("saved", "price-group");
  return NextResponse.redirect(backUrl, 303);
}
