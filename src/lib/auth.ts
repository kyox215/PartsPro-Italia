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
  isAdmin: boolean;
};

const b2bPriceRoles = new Set([
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
      isAdmin: false,
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
      isAdmin: false,
    };
  }

  const { role, isAdmin } = await getRoleForUser({
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
    isAdmin,
  };
}

export async function getRoleForUser(user: { id: string; email?: string | null }) {
  let role: string | null = null;

  if (hasSupabaseAdminConfig()) {
    const admin = getSupabaseAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    role = data?.role ?? null;
  }

  const adminEmail = getAdminEmail();
  const isAdmin = role === "admin" || user.email?.toLowerCase() === adminEmail;

  return { role, isAdmin };
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
