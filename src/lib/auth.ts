import { getAdminEmail } from "@/lib/env";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";
import {
  getAllAdminPermissions,
  getStaffPermissionsForRole,
  isStaffRole,
  type AdminPermission,
  type StaffRole,
} from "@/lib/admin-permissions";

export type AuthContext = {
  configured: boolean;
  user: {
    id: string;
    email?: string;
  } | null;
  role: string | null;
  accountStatus: string | null;
  staffRole: StaffRole | null;
  staffStatus: string | null;
  adminPermissions: AdminPermission[];
  isAdmin: boolean;
  isStaff: boolean;
  canAccessAdmin: boolean;
};

const b2bPriceRoles = new Set([
  "wholesale",
  "b2b_basic",
  "b2b_silver",
  "b2b_gold",
  "distributor",
]);

export function canViewB2BPrice(
  auth: Pick<AuthContext, "role" | "isAdmin">,
) {
  return auth.isAdmin || (auth.role ? b2bPriceRoles.has(auth.role) : false);
}

export async function getAuthContext(): Promise<AuthContext> {
  if (!hasSupabasePublicConfig()) {
    return {
      configured: false,
      user: null,
      role: null,
      accountStatus: null,
      staffRole: null,
      staffStatus: null,
      adminPermissions: [],
      isAdmin: false,
      isStaff: false,
      canAccessAdmin: false,
    };
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      user: null,
      role: null,
      accountStatus: null,
      staffRole: null,
      staffStatus: null,
      adminPermissions: [],
      isAdmin: false,
      isStaff: false,
      canAccessAdmin: false,
    };
  }

  const {
    role,
    accountStatus,
    staffRole,
    staffStatus,
    adminPermissions,
    isAdmin,
    isStaff,
    canAccessAdmin,
  } = await getRoleForUser({
    id: user.id,
    email: user.email,
  });

  return {
    configured: true,
    user: {
      id: user.id,
      email: user.email,
    },
    role,
    accountStatus,
    staffRole,
    staffStatus,
    adminPermissions,
    isAdmin,
    isStaff,
    canAccessAdmin,
  };
}

export async function getRoleForUser(user: { id: string; email?: string | null }) {
  let role: string | null = null;
  let accountStatus: string | null = null;
  let staffRole: StaffRole | null = null;
  let staffStatus: string | null = null;

  if (hasSupabaseAdminConfig()) {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("role, account_status")
      .eq("id", user.id)
      .maybeSingle();
    role = data?.role ?? null;
    accountStatus = data?.account_status ?? null;

    const { data: staff } = await admin
      .from("staff_members")
      .select("role, status")
      .eq("profile_id", user.id)
      .maybeSingle();

    staffRole = isStaffRole(staff?.role) ? staff.role : null;
    staffStatus = staff?.status ?? null;
  }

  const adminEmail = getAdminEmail();
  const isAdmin = role === "admin" || user.email?.toLowerCase() === adminEmail;
  const isSuspended = accountStatus === "suspended" || accountStatus === "archived";
  const isStaff = Boolean(staffRole && staffStatus === "active" && !isSuspended);
  const adminPermissions = isAdmin
    ? getAllAdminPermissions()
    : await getStaffPermissionsForRole(staffRole);
  const canAccessAdmin = Boolean((isAdmin || isStaff) && !isSuspended);

  return {
    role,
    accountStatus,
    staffRole,
    staffStatus,
    adminPermissions,
    isAdmin,
    isStaff,
    canAccessAdmin,
  };
}

export async function assertAdmin() {
  const context = await getAuthContext();

  if (!context.configured) {
    return { ok: true as const, context, demoMode: true };
  }

  if (!context.user) {
    return { ok: false as const, context, status: 401, error: "Not authenticated" };
  }

  if (!context.isAdmin) {
    return { ok: false as const, context, status: 403, error: "Admin access required" };
  }

  return { ok: true as const, context, demoMode: false };
}

export async function assertAdminAccess() {
  const context = await getAuthContext();

  if (!context.configured) {
    return { ok: true as const, context, demoMode: true };
  }

  if (!context.user) {
    return { ok: false as const, context, status: 401, error: "Not authenticated" };
  }

  if (!context.canAccessAdmin) {
    return { ok: false as const, context, status: 403, error: "Admin access required" };
  }

  return { ok: true as const, context, demoMode: false };
}

export async function assertAdminPermission(permission: AdminPermission) {
  const access = await assertAdminAccess();

  if (!access.ok) return access;
  if (access.demoMode) return access;

  if (!access.context.isAdmin && !access.context.adminPermissions.includes(permission)) {
    return {
      ok: false as const,
      context: access.context,
      status: 403,
      error: "Permission denied",
    };
  }

  return access;
}
