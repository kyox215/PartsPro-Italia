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
import { adminAccountCustomerAccessSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminAccountCustomerAccessSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const id = String(rawBody.id ?? "");
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: `/admin/accounts/customers/${id || ""}`,
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

  if (
    parsed.data.priceGroup === "distributor" &&
    !admin.context.isAdmin &&
    admin.context.staffRole !== "owner"
  ) {
    backUrl.searchParams.set("error", "Only owner/admin can assign distributor.");
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  let profileId: string | null = null;
  let companyId: string | null = null;
  let beforeData: Record<string, unknown> | null = null;

  if (parsed.data.source === "company") {
    const { data: company, error: loadError } = await supabase
      .from("companies")
      .select("id, owner_id, contact_email, status, crm_status, price_group, next_follow_up_at")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (loadError || !company) {
      backUrl.searchParams.set("error", loadError?.message ?? "Company not found");
      return NextResponse.redirect(backUrl, 303);
    }

    companyId = company.id;
    profileId = company.owner_id ?? null;
    beforeData = {
      source: "company",
      status: company.status,
      crmStatus: company.crm_status,
      priceGroup: company.price_group,
      nextFollowUpAt: company.next_follow_up_at,
      ownerId: company.owner_id,
    };

    const { error: companyError } = await supabase
      .from("companies")
      .update({
        price_group: parsed.data.priceGroup,
        status: parsed.data.crmStatus === "lead" ? "pending" : parsed.data.crmStatus,
        crm_status: parsed.data.crmStatus,
        next_follow_up_at: parsed.data.nextFollowUpAt || null,
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.id);

    if (companyError) {
      backUrl.searchParams.set("error", companyError.message);
      return NextResponse.redirect(backUrl, 303);
    }

    if (!profileId && company.contact_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", company.contact_email.trim().toLowerCase())
        .maybeSingle();
      profileId = profile?.id ?? null;
    }
  } else {
    profileId = parsed.data.id;
    const { data: profile, error: profileLoadError } = await supabase
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", parsed.data.id)
      .maybeSingle();

    if (profileLoadError || !profile) {
      backUrl.searchParams.set("error", profileLoadError?.message ?? "Profile not found");
      return NextResponse.redirect(backUrl, 303);
    }

    beforeData = {
      source: "profile",
      role: profile.role,
      accountStatus: profile.account_status,
    };
  }

  if (profileId) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: parsed.data.priceGroup,
        account_status: parsed.data.accountStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (profileError) {
      backUrl.searchParams.set("error", profileError.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  const afterData = {
    source: parsed.data.source,
    priceGroup: parsed.data.priceGroup,
    accountStatus: parsed.data.accountStatus,
    crmStatus: parsed.data.crmStatus,
    nextFollowUpAt: parsed.data.nextFollowUpAt || null,
    profileId,
    companyId,
  };

  await recordCustomerAuditEvent({
    actor: admin.context,
    action: "customer.access.update",
    customerProfileId: profileId,
    companyId,
    beforeData,
    afterData,
  });

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "customer.access.update",
    entityType: parsed.data.source,
    entityId: parsed.data.id,
    beforeData,
    afterData,
  });

  backUrl.searchParams.set("saved", "access");
  return NextResponse.redirect(backUrl, 303);
}

export const PATCH = POST;
