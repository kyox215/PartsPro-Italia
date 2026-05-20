import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { recordCustomerAuditEvent } from "@/lib/admin-accounts";
import {
  normalizeCustomerType,
  toStoredCustomerPriceGroup,
} from "@/lib/admin-display";
import { hasAdminPermission } from "@/lib/admin-permissions";
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

  const customerType = parsed.data.customerType ?? normalizeCustomerType(parsed.data.priceGroup);
  const storedPriceGroup = toStoredCustomerPriceGroup(customerType);
  const shouldManageStaff = parsed.data.staffRole !== undefined;
  const desiredStaffRole = parsed.data.staffRole ?? "none";
  const desiredStaffStatus = parsed.data.staffStatus ?? "active";

  if (shouldManageStaff && !hasAdminPermission(admin.context, "staff:manage")) {
    backUrl.searchParams.set("error", "Permission denied");
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  let profileId: string | null = null;
  let companyId: string | null = null;
  let profileRole: string | null = null;
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
      customerType: normalizeCustomerType(company.price_group),
      nextFollowUpAt: company.next_follow_up_at,
      ownerId: company.owner_id,
    };

    const { error: companyError } = await supabase
      .from("companies")
      .update({
        price_group: storedPriceGroup,
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
      customerType: normalizeCustomerType(profile.role),
      accountStatus: profile.account_status,
    };
    profileRole = profile.role;
  }

  if (profileId) {
    if (!profileRole) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", profileId)
        .maybeSingle();
      profileRole = profile?.role ?? null;
    }

    const profileUpdate: {
      role?: string;
      account_status: string;
      updated_at: string;
    } = {
      account_status: parsed.data.accountStatus,
      updated_at: new Date().toISOString(),
    };
    if (profileRole !== "admin") {
      profileUpdate.role = storedPriceGroup;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", profileId);

    if (profileError) {
      backUrl.searchParams.set("error", profileError.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  let beforeStaff: Record<string, unknown> | null = null;
  if (shouldManageStaff) {
    if (!profileId) {
      backUrl.searchParams.set("error", "Registered profile required before assigning staff access.");
      return NextResponse.redirect(backUrl, 303);
    }

    if (desiredStaffRole === "owner" && !admin.context.isAdmin && admin.context.staffRole !== "owner") {
      backUrl.searchParams.set("error", "Only owner/admin can assign owner role.");
      return NextResponse.redirect(backUrl, 303);
    }

    const { data: existingStaff } = await supabase
      .from("staff_members")
      .select("id, role, status")
      .eq("profile_id", profileId)
      .maybeSingle();

    beforeStaff = existingStaff ?? null;
    const nextRole = desiredStaffRole === "none" ? existingStaff?.role ?? "support" : desiredStaffRole;
    const nextStatus = desiredStaffRole === "none" ? "archived" : desiredStaffStatus;

    if (await wouldRemoveLastOwner(supabase, profileId, nextRole, nextStatus)) {
      backUrl.searchParams.set("error", "Cannot remove the last active owner.");
      return NextResponse.redirect(backUrl, 303);
    }

    if (desiredStaffRole === "none") {
      if (existingStaff) {
        const { error: staffArchiveError } = await supabase
          .from("staff_members")
          .update({
            status: "archived",
            updated_at: new Date().toISOString(),
          })
          .eq("profile_id", profileId);
        if (staffArchiveError) {
          backUrl.searchParams.set("error", staffArchiveError.message);
          return NextResponse.redirect(backUrl, 303);
        }
      }
    } else {
      const { error: staffError } = await supabase
        .from("staff_members")
        .upsert(
          {
            profile_id: profileId,
            role: desiredStaffRole,
            status: desiredStaffStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "profile_id" },
        );
      if (staffError) {
        backUrl.searchParams.set("error", staffError.message);
        return NextResponse.redirect(backUrl, 303);
      }
    }
  }

  const afterData = {
    source: parsed.data.source,
    customerType,
    priceGroup: storedPriceGroup,
    accountStatus: parsed.data.accountStatus,
    crmStatus: parsed.data.crmStatus,
    nextFollowUpAt: parsed.data.nextFollowUpAt || null,
    profileId,
    companyId,
    staffRole: shouldManageStaff ? desiredStaffRole : undefined,
    staffStatus: shouldManageStaff ? desiredStaffStatus : undefined,
    beforeStaff,
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

async function wouldRemoveLastOwner(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  profileId: string,
  nextRole: string,
  nextStatus: string,
) {
  const { data, error } = await supabase
    .from("staff_members")
    .select("profile_id")
    .eq("role", "owner")
    .eq("status", "active");

  if (error) {
    console.error("Failed to verify active owners", error.message);
    return false;
  }

  const ownerIds = new Set((data ?? []).map((owner) => owner.profile_id));
  const isCurrentOwner = ownerIds.has(profileId);
  const willRemainOwner = nextRole === "owner" && nextStatus === "active";
  return isCurrentOwner && !willRemainOwner && ownerIds.size <= 1;
}
