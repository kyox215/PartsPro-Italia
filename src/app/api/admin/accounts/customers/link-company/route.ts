import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { recordCustomerAuditEvent } from "@/lib/admin-accounts";
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
import { adminAccountLinkCompanySchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminAccountLinkCompanySchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const profileId = String(rawBody.profileId ?? "");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/accounts/customers/${profileId || ""}`,
    allowedPrefixes: ["/admin/accounts/customers"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdminPermission("accounts:write");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", parsed.data.profileId)
    .maybeSingle();

  if (profileError || !profile) {
    backUrl.searchParams.set("error", profileError?.message ?? "Profile not found");
    return NextResponse.redirect(backUrl, 303);
  }

  const { data: existing } = await supabase
    .from("companies")
    .select("id")
    .eq("owner_id", parsed.data.profileId)
    .maybeSingle();

  const companyPayload = {
    owner_id: parsed.data.profileId,
    company_name: parsed.data.companyName,
    vat_number: parsed.data.vatNumber || null,
    contact_email: parsed.data.contactEmail || profile.email,
    status: profile.role === "retail" ? "pending" : "active",
    crm_status: profile.role === "retail" ? "lead" : "active",
    price_group: profile.role,
    updated_at: new Date().toISOString(),
  };

  let companyId = existing?.id ?? null;
  if (companyId) {
    const { error } = await supabase
      .from("companies")
      .update(companyPayload)
      .eq("id", companyId);
    if (error) {
      backUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(backUrl, 303);
    }
  } else {
    const { data, error } = await supabase
      .from("companies")
      .insert(companyPayload)
      .select("id")
      .single();
    if (error) {
      backUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(backUrl, 303);
    }
    companyId = data.id;
  }

  await recordCustomerAuditEvent({
    actor: admin.context,
    action: existing ? "customer.company.link.update" : "customer.company.link.create",
    customerProfileId: parsed.data.profileId,
    companyId,
    afterData: companyPayload,
  });

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: existing ? "customer.company.link.update" : "customer.company.link.create",
    entityType: "company",
    entityId: companyId,
    afterData: {
      profileId: parsed.data.profileId,
      companyName: parsed.data.companyName,
    },
  });

  backUrl.pathname = `/${locale}/admin/accounts/customers/${companyId}`;
  backUrl.searchParams.set("saved", "company");
  return NextResponse.redirect(backUrl, 303);
}
