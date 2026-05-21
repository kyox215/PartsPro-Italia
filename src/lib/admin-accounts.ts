import {
  getAllAdminPermissions,
  getStaffPermissionMatrix,
  isStaffRole,
  staffRoleOptions,
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

type StaffProfile = {
  email: string;
  fullName: string | null;
  role: string | null;
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
    .select("id, profile_id, role, status, display_name, invited_email, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Failed to load staff members", error);
    return [];
  }

  const profiles = await loadStaffProfiles(
    Array.from(new Set((data ?? []).map((staff) => staff.profile_id).filter(Boolean))),
  );

  return (data ?? []).flatMap((staff) => {
    if (!isStaffRole(staff.role)) return [];
    const profile = profiles.get(staff.profile_id);
    return {
      id: staff.id,
      profileId: staff.profile_id,
      email: profile?.email ?? staff.invited_email ?? "-",
      fullName: profile?.fullName ?? staff.display_name ?? null,
      role: staff.role,
      status: staff.status,
      profileRole: profile?.role ?? null,
      createdAt: staff.created_at ?? null,
      updatedAt: staff.updated_at ?? null,
    };
  });
}

async function loadStaffProfiles(profileIds: string[]) {
  const profiles = new Map<string, StaffProfile>();
  if (!hasSupabaseAdminConfig() || profileIds.length === 0) return profiles;

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .in("id", profileIds);

  if (error) {
    console.error("Failed to load staff profiles", error);
    return profiles;
  }

  (data ?? []).forEach((profile) => {
    profiles.set(profile.id, {
      email: profile.email,
      fullName: profile.full_name ?? null,
      role: profile.role ?? null,
    });
  });

  return profiles;
}

export async function getCustomerAuditEvents(
  limit = 80,
): Promise<CustomerAuditEventRow[]> {
  if (!hasSupabaseAdminConfig()) return [];

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("customer_audit_events")
    .select(
      "id, action, actor_email, customer_profile_id, company_id, before_data, after_data, note, created_at",
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
  beforeData,
  afterData,
  note,
}: {
  actor: AuthContext;
  action: string;
  customerProfileId?: string | null;
  companyId?: string | null;
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

export async function getStaffRoleSummaries(locale: "it" | "zh"): Promise<StaffRoleSummary[]> {
  const matrix = await getStaffPermissionMatrix();
  return staffRoleOptions.map((role) => ({
    role,
    label: staffRoleLabels[role][locale],
    description: staffRoleDescriptions[role][locale],
    permissions: role === "owner" ? getAllAdminPermissions() : matrix[role],
  }));
}

function asRecordOrNull(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}
