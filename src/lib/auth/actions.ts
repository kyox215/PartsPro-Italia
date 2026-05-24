"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authCredentialsSchema } from "@/lib/validations/auth";
import type { Locale } from "@/types";

import { ensureUserProfile } from "./profile";
import { localizedPath, normalizeRedirectPath } from "./roles";

export type AuthResultCode =
  | "signedIn"
  | "registered"
  | "checkEmail"
  | "invalidFields"
  | "invalidCredentials"
  | "authFailed"
  | "profileFailed";

export type AuthActionResult =
  | {
      ok: true;
      code: AuthResultCode;
      redirectTo: string;
    }
  | {
      ok: false;
      code: AuthResultCode;
    };

type AuthActionInput = {
  email: string;
  password: string;
  fullName?: string;
};

export async function signInAction(
  locale: Locale,
  input: AuthActionInput,
  nextPath?: string | null,
): Promise<AuthActionResult> {
  const parsed = authCredentialsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "invalidFields" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false, code: "invalidCredentials" };
  }

  if (data.user) {
    await ensureUserProfile(supabase, data.user, locale);
  }

  return {
    ok: true,
    code: "signedIn",
    redirectTo: normalizeRedirectPath(
      nextPath,
      localizedPath(locale, "/account"),
    ),
  };
}

export async function signUpAction(
  locale: Locale,
  input: AuthActionInput,
): Promise<AuthActionResult> {
  const parsed = authCredentialsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, code: "invalidFields" };
  }

  const supabase = await createSupabaseServerClient();
  const origin = await getRequestOrigin();
  const emailRedirectTo = `${origin}${localizedPath(
    locale,
    "/auth/callback",
  )}?next=${encodeURIComponent(localizedPath(locale, "/account"))}`;

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo,
      data: {
        full_name: parsed.data.fullName ?? "",
        locale,
      },
    },
  });

  if (error) {
    return { ok: false, code: "authFailed" };
  }

  if (data.session && data.user) {
    await ensureUserProfile(supabase, data.user, locale);

    return {
      ok: true,
      code: "registered",
      redirectTo: localizedPath(locale, "/account"),
    };
  }

  return {
    ok: true,
    code: "checkEmail",
    redirectTo: localizedPath(locale, "/login"),
  };
}

export async function signOutAction(formData: FormData) {
  const candidateLocale = String(formData.get("locale") ?? "");
  const locale = isLocale(candidateLocale) ? candidateLocale : defaultLocale;
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();
  redirect(localizedPath(locale, "/login"));
}

async function getRequestOrigin() {
  const headerStore = await headers();
  return (
    headerStore.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000"
  );
}
