import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { recordCustomerAuditEvent } from "@/lib/admin-accounts";
import {
  getConfigurableAdminPermissions,
  staffRoleOptions,
} from "@/lib/admin-permissions";
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
import { adminStaffRoleSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminStaffRoleSchema.safeParse(rawBody);
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

  if (!admin.context.isAdmin && admin.context.staffRole !== "owner") {
    backUrl.searchParams.set("error", "Only owner/admin can manage roles.");
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const { action, role } = parsed.data;
  const defaultRoles = new Set(staffRoleOptions);
  if (role === "owner") {
    backUrl.searchParams.set("error", "Owner role is read-only.");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const { data: beforeRows } = await supabase
    .from("staff_role_permissions")
    .select("role, permission, enabled")
    .eq("role", role);

  if (action === "create") {
    if (defaultRoles.has(role)) {
      backUrl.searchParams.set("error", "Default roles already exist.");
      return NextResponse.redirect(backUrl, 303);
    }

    const rows = getConfigurableAdminPermissions().map((permission) => ({
      role,
      permission,
      enabled: permission === "admin:access",
      updated_by: admin.context.user?.id ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("staff_role_permissions")
      .upsert(rows, { onConflict: "role,permission" });

    if (error) {
      backUrl.searchParams.set("error", error.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  if (action === "rename") {
    const newRole = parsed.data.newRole || "";
    if (!newRole || newRole === "owner" || defaultRoles.has(role)) {
      backUrl.searchParams.set("error", "Invalid role rename.");
      return NextResponse.redirect(backUrl, 303);
    }

    const rows = (beforeRows ?? []).map((row) => ({
      role: newRole,
      permission: row.permission,
      enabled: row.enabled,
      updated_by: admin.context.user?.id ?? null,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) {
      backUrl.searchParams.set("error", "Role not found.");
      return NextResponse.redirect(backUrl, 303);
    }

    const { error: insertError } = await supabase
      .from("staff_role_permissions")
      .upsert(rows, { onConflict: "role,permission" });
    if (insertError) {
      backUrl.searchParams.set("error", insertError.message);
      return NextResponse.redirect(backUrl, 303);
    }

    const { error: staffError } = await supabase
      .from("staff_members")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("role", role);
    if (staffError) {
      backUrl.searchParams.set("error", staffError.message);
      return NextResponse.redirect(backUrl, 303);
    }

    await supabase.from("staff_role_permissions").delete().eq("role", role);
  }

  if (action === "deactivate") {
    if (defaultRoles.has(role)) {
      backUrl.searchParams.set("error", "Default roles cannot be deactivated.");
      return NextResponse.redirect(backUrl, 303);
    }

    const { error: matrixError } = await supabase
      .from("staff_role_permissions")
      .update({
        enabled: false,
        updated_by: admin.context.user?.id ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("role", role);
    if (matrixError) {
      backUrl.searchParams.set("error", matrixError.message);
      return NextResponse.redirect(backUrl, 303);
    }

    const { error: staffError } = await supabase
      .from("staff_members")
      .update({ status: "archived", updated_at: new Date().toISOString() })
      .eq("role", role);
    if (staffError) {
      backUrl.searchParams.set("error", staffError.message);
      return NextResponse.redirect(backUrl, 303);
    }
  }

  const afterData = {
    action,
    role,
    newRole: parsed.data.newRole || null,
  };

  await recordCustomerAuditEvent({
    actor: admin.context,
    action: `staff.role.${action}`,
    beforeData: { role, rows: beforeRows ?? [] },
    afterData,
  });

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: `staff.role.${action}`,
    entityType: "staff_role",
    entityId: role,
    beforeData: { role, rows: beforeRows ?? [] },
    afterData,
  });

  backUrl.searchParams.set("saved", "role");
  return NextResponse.redirect(backUrl, 303);
}

export const PATCH = POST;
