import { NextResponse } from "next/server";
import { assertAdminCsrf } from "@/lib/admin-csrf";
import type { Locale } from "@/lib/i18n";

type AdminBackUrlOptions = {
  locale: string;
  returnTo: unknown;
  fallbackPath: string;
  allowedPrefixes?: string[];
};

export function normalizeAdminLocale(locale: string): Locale {
  return locale === "zh" ? "zh" : "it";
}

export function getAdminBackUrl(
  request: Request,
  {
    locale,
    returnTo,
    fallbackPath,
    allowedPrefixes = [fallbackPath],
  }: AdminBackUrlOptions,
) {
  const normalizedLocale = normalizeAdminLocale(locale);
  const baseUrl = new URL(request.url);
  const fallbackUrl = new URL(
    `/${normalizedLocale}${ensureLeadingSlash(fallbackPath)}`,
    baseUrl,
  );

  if (typeof returnTo !== "string" || !returnTo.trim()) {
    return fallbackUrl;
  }

  try {
    const candidate = new URL(returnTo, baseUrl);
    if (candidate.origin !== baseUrl.origin) {
      return fallbackUrl;
    }

    const allowedPaths = allowedPrefixes.map(
      (prefix) => `/${normalizedLocale}${ensureLeadingSlash(prefix)}`,
    );

    if (allowedPaths.some((prefix) => candidate.pathname.startsWith(prefix))) {
      return candidate;
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

export function redirectOnInvalidAdminCsrf(
  request: Request,
  body: unknown,
  backUrl: URL,
) {
  const csrf = assertAdminCsrf(request, body);
  if (csrf.ok) return null;

  backUrl.searchParams.set("error", csrf.error);
  return NextResponse.redirect(backUrl, 303);
}

function ensureLeadingSlash(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}
