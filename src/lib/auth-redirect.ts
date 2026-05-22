import { type Locale } from "@/lib/i18n";

export function normalizeAuthLocale(value: FormDataEntryValue | string | null | undefined): Locale {
  return value === "zh" ? "zh" : "it";
}

export function getSafeAuthRedirect(
  value: FormDataEntryValue | string | null | undefined,
  locale: Locale,
) {
  const fallback = `/${locale}/account`;
  const next = String(value ?? "");

  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
    return fallback;
  }

  try {
    const url = new URL(next, "https://partspro.local");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function getRoleAwareAuthRedirect({
  value,
  locale,
}: {
  value: FormDataEntryValue | string | null | undefined;
  locale: Locale;
  isAdmin: boolean;
}) {
  const rawNext = String(value ?? "");
  const defaultPath = `/${locale}/account`;

  if (!rawNext) {
    return defaultPath;
  }

  const safeNext = getSafeAuthRedirect(rawNext, locale);
  return safeNext;
}
