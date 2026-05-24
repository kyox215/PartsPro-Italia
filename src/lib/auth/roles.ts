import { defaultLocale, isLocale } from "@/lib/i18n";
import type { AppRole, Locale } from "@/types";

const backofficeRoles = new Set<AppRole>(["admin", "manager", "staff"]);

export function canAccessAdmin(role: AppRole | null | undefined) {
  return role ? backofficeRoles.has(role) : false;
}

export function canAccessAdminPath(
  role: AppRole | null | undefined,
  pathname: string,
) {
  if (canAccessAdmin(role)) {
    return true;
  }

  return role === "warehouse" && pathname.includes("/admin/inventory");
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return segment && isLocale(segment) ? segment : defaultLocale;
}

export function localizedPath(locale: Locale, path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalizedPath}`;
}

export function normalizeRedirectPath(
  candidate: string | null | undefined,
  fallback: string,
) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}
