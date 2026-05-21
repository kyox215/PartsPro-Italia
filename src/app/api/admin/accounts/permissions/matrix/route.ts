import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-audit";
import { recordCustomerAuditEvent } from "@/lib/admin-accounts";
import {
  getAdminBackUrl,
  redirectOnInvalidAdminCsrf,
} from "@/lib/admin-security";
import {
  getConfigurableAdminPermissions,
} from "@/lib/admin-permissions";
import { assertAdminPermission } from "@/lib/auth";
import { parseRequestBody } from "@/lib/request";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import { adminStaffPermissionMatrixSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await parseRequestBody(request);
  const parsed = adminStaffPermissionMatrixSchema.safeParse(rawBody);
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
    backUrl.searchParams.set("error", "Only owner/admin can edit role matrix.");
    return NextResponse.redirect(backUrl, 303);
  }

  if (!hasSupabaseAdminConfig()) {
    backUrl.searchParams.set("saved", "demo");
    return NextResponse.redirect(backUrl, 303);
  }

  const supabase = getSupabaseAdminClient();
  const permissions = getConfigurableAdminPermissions();
  const rows = permissions.map((permission) => ({
    role: parsed.data.role,
    permission,
    enabled: rawBody[`permission:${permission}`] === "true",
    updated_by: admin.context.user?.id ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { data: beforeRows } = await supabase
    .from("staff_role_permissions")
    .select("permission, enabled")
    .eq("role", parsed.data.role);

  const { error } = await supabase
    .from("staff_role_permissions")
    .upsert(rows, { onConflict: "role,permission" });

  if (error) {
    backUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(backUrl, 303);
  }

  const afterData = {
    role: parsed.data.role,
    permissions: rows.filter((row) => row.enabled).map((row) => row.permission),
  };

  await recordCustomerAuditEvent({
    actor: admin.context,
    action: "staff.matrix.update",
    beforeData: {
      role: parsed.data.role,
      permissions: (beforeRows ?? []).filter((row) => row.enabled).map((row) => row.permission),
    },
    afterData,
  });

  await recordAdminActivity({
    request,
    actor: admin.context,
    action: "staff.matrix.update",
    entityType: "staff_role_permissions",
    entityId: parsed.data.role,
    beforeData: beforeRows ? { role: parsed.data.role, rows: beforeRows } : null,
    afterData,
  });

  backUrl.searchParams.set("saved", "matrix");
  return NextResponse.redirect(backUrl, 303);
}

export const PATCH = POST;
