import { getAdminEmail } from "@/lib/env";
import {
  getSupabaseServerClient,
  hasSupabasePublicConfig,
} from "@/lib/supabase/server";
import {
  getSupabaseAdminClient,
  hasSupabaseAdminConfig,
} from "@/lib/supabase/admin";

export type AuthContext = {
  configured: boolean;
  user: {
    id: string;
    email?: string;
  } | null;
  role: string | null;
  accountStatus: string | null;
  staffRole: string | null;
  staffStatus: string | null;
  adminPermissions: string[];
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

  if (hasSupabaseAdminConfig()) {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("role, account_status")
      .eq("id", user.id)
      .maybeSingle();
    role = data?.role ?? null;
    accountStatus = data?.account_status ?? null;
  }

  const adminEmail = getAdminEmail();
  const isAdmin = role === "admin" || user.email?.toLowerCase() === adminEmail;
  const isSuspended = accountStatus === "suspended" || accountStatus === "archived";

  return {
    role,
    accountStatus,
    staffRole: null,
    staffStatus: null,
    adminPermissions: [],
    isAdmin,
    isStaff: false,
    canAccessAdmin: false,
    suspended: isSuspended,
  };
}
