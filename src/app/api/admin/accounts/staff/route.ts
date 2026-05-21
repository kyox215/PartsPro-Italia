import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { findProfileByEmail, recordCustomerAuditEvent } from "@/lib/admin-accounts";
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
import { adminStaffMemberSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function GET() {
  const admin = await assertAdminPermission("staff:manage");
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  if (!hasSupabaseAdminConfig()) {
    return NextResponse.json({ staff: [] });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select("id, profile_id, role, status, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ staff: data ?? [] });
}

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminStaffMemberSchema.safeParse(rawBody);
  const locale = rawBody.locale === "zh" ? "zh" : "it";
  const backUrl = getAdminBackUrl(request, {
    locale,
    returnTo: rawBody.returnTo,
    fallbackPath: "/admin/settings/permissions",
    allowedPrefixes: ["/admin/settings/permissions", "/admin/accounts/permissions"],
  });

  if (!parsed.success) {
    backUrl.searchParams.set("error", parsed.error.issues.map((issue) => issue.message).join(", "));
    return NextResponse.redirect(backUrl, 303);
  }

  const csrfRedirect = redirectOnInvalidAdminCsrf(request, rawBody, backUrl);
  if (csrfRedirect) return csrfRedirect;

  const admin = await assertAdminPermission("staff:manage");
  if (!admin.ok) {
    backUrl.searchParams.set("error", admin.error);
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const profile = await findProfileByEmail(parsed.data.email);
  if (!profile) {
    backUrl.searchParams.set("error", "No registered profile found for this email.");
    return NextResponse.redirect(backUrl, 303);
  }

  if (parsed.data.role === "owner" && !admin.context.isAdmin && admin.context.staffRole !== "owner") {
    backUrl.searchParams.set("error", "Only owner/admin can assign owner role.");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("staff_members")
    .select("id, role, status")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const payload = {
    profile_id: profile.id,
    role: parsed.data.role,
    status: parsed.data.status,
    display_name: profile.full_name ?? null,
    invited_email: profile.email,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("staff_members")
    .upsert(payload, { onConflict: "profile_id" });

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  await recordCustomerAuditEvent({
    actor: admin.context,
    action: existing ? "staff.member.update" : "staff.member.create",
    customerProfileId: profile.id,
    beforeData: existing ?? null,
    afterData: {
      email: profile.email,
      role: parsed.data.role,
      status: parsed.data.status,
    },
  });

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: existing ? "staff.member.update" : "staff.member.create",
    entityType: "staff_member",
    entityId: profile.id,
    beforeData: existing ?? null,
    afterData: {
      email: profile.email,
      role: parsed.data.role,
      status: parsed.data.status,
    },
  });

  backUrl.searchParams.set("saved", "staff");
  return NextResponse.redirect(backUrl, 303);
}

export const PATCH = POST;
