import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole, Locale } from "@/types";

import { canAccessAdminPath, localizedPath } from "./roles";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    supabase,
    user,
  };
}

export async function getCurrentProfile() {
  const { supabase, user } = await getCurrentUser();

  if (!user) {
    return {
      supabase,
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, locale")
    .eq("id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    profile,
  };
}

export async function requireAuth(locale: Locale, nextPath: string) {
  const session = await getCurrentProfile();

  if (!session.user) {
    const loginPath = localizedPath(locale, "/login");
    redirect(`${loginPath}?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}

export async function requireBackoffice(locale: Locale, pathname: string) {
  const session = await requireAuth(locale, pathname);
  const role = session.profile?.role as AppRole | null | undefined;

  if (!canAccessAdminPath(role, pathname)) {
    redirect(localizedPath(locale, "/403"));
  }

  return session;
}
