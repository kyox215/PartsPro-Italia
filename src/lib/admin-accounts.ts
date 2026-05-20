import {
  getAllAdminPermissions,
  isStaffRole,
  staffRoleDescriptions,
  staffRoleLabels,
  type AdminPermission,
  type StaffRole,
} from "@/lib/admin-permissions";
import type { AuthContext } from "@/lib/auth";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AdminStaffRow = {
  id: string;
  profileId: string;
  email: string;
  fullName: string | null;
  role: StaffRole;
  status: string;
  profileRole: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CustomerAuditEventRow = {
  id: string;
  action: string;
  actorEmail: string | null;
  customerProfileId: string | null;
  companyId: string | null;
  applicationId: string | null;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
};

export type StaffRoleSummary = {
  role: StaffRole;
  label: string;
  description: string;
  permissions: AdminPermission[];
};

export async function getAdminStaffRows(): Promise<AdminStaffRow[]> {
  if (!hasSupabaseAdminConfig()) {
    return [
      {
        id: "demo-owner",
        profileId: "demo-profile",
        email: "owner@example.it",
        fullName: "Demo Owner",
        role: "owner",
        status: "active",
        profileRole: "admin",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("staff_members")
    .select(
      "id, profile_id, role, status, display_name, invited_email, created_at, updated_at, profiles ( email, full_name, role )",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load staff members", error);
    return [];
  }

  return (data ?? []).flatMap((staff) => {
    if (!isStaffRole(staff.role)) return [];
    const profile = Array.isArray(staff.profiles) ? staff.profiles[0] : staff.profiles;
    return {
      id: staff.id,
      profileId: staff.profile_id,
      email: profile?.email ?? staff.invited_email ?? "-",
      fullName: profile?.full_name ?? staff.display_name ?? null,
      role: staff.role,
      status: staff.status,
      profileRole: profile?.role ?? null,
      createdAt: staff.created_at ?? null,
      updatedAt: staff.updated_at ?? null,
    };
  });
}

export async function getCustomerAuditEvents(
  limit = 80,
): Promise<CustomerAuditEventRow[]> {
  if (!hasSupabaseAdminConfig()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_audit_events")
    .select(
      "id, action, actor_email, customer_profile_id, company_id, application_id, before_data, after_data, note, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load customer audit events", error);
    return [];
  }

  return (data ?? []).map((event) => ({
    id: event.id,
    action: event.action,
    actorEmail: event.actor_email ?? null,
    customerProfileId: event.customer_profile_id ?? null,
    companyId: event.company_id ?? null,
    applicationId: event.application_id ?? null,
    beforeData: asRecordOrNull(event.before_data),
    afterData: asRecordOrNull(event.after_data),
    note: event.note ?? null,
    createdAt: event.created_at,
  }));
}

export async function recordCustomerAuditEvent({
  actor,
  action,
  customerProfileId,
  companyId,
  applicationId,
  beforeData,
  afterData,
  note,
}: {
  actor: AuthContext;
  action: string;
  customerProfileId?: string | null;
  companyId?: string | null;
  applicationId?: string | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  note?: string | null;
}) {
  if (!hasSupabaseAdminConfig()) return;

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("customer_audit_events").insert({
      actor_profile_id: actor.user?.id ?? null,
      actor_email: actor.user?.email ?? null,
      customer_profile_id: customerProfileId ?? null,
      company_id: companyId ?? null,
      application_id: applicationId ?? null,
      action,
      before_data: beforeData ?? null,
      after_data: afterData ?? null,
      note: note ?? null,
    });

    if (error) {
      console.error("Failed to write customer audit event", error.message);
    }
  } catch (error) {
    console.error("Failed to write customer audit event", error);
  }
}

export async function findProfileByEmail(email: string) {
  if (!hasSupabaseAdminConfig()) return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_status")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("Failed to find profile by email", error);
    return null;
  }

  return data;
}

export function getStaffRoleSummaries(locale: "it" | "zh"): StaffRoleSummary[] {
  const roles: StaffRole[] = ["owner", "sales", "catalog", "warehouse", "finance", "support"];
  return roles.map((role) => ({
    role,
    label: staffRoleLabels[role][locale],
    description: staffRoleDescriptions[role][locale],
    permissions: role === "owner" ? getAllAdminPermissions() : getRolePermissions(role),
  }));
}

function getRolePermissions(role: StaffRole) {
  if (role === "owner") return getAllAdminPermissions();
  const lookup: Record<Exclude<StaffRole, "owner">, AdminPermission[]> = {
    sales: [
      "admin:access",
      "accounts:read",
      "accounts:write",
      "b2b:review",
      "audit:read",
      "orders:write",
      "rma:write",
    ],
    catalog: ["admin:access", "products:write", "system:read"],
    warehouse: ["admin:access", "inventory:write", "orders:write", "system:read"],
    finance: [
      "admin:access",
      "orders:write",
      "payments:confirm",
      "audit:read",
      "system:read",
    ],
    support: ["admin:access", "accounts:read", "rma:write", "audit:read"],
  };
  return lookup[role];
}

function asRecordOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
