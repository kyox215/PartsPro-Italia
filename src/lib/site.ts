import { defaultLocale, locales } from "@/lib/i18n";

export const siteConfig = {
  name: "PartsPro",
  description:
    "Modern B2B/B2C procurement platform for phone repair parts in Italy and the EU.",
  defaultLocale,
  locales,
  url: getSiteUrl(),
};

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  return normalizeSiteUrl(configuredUrl);
}

function normalizeSiteUrl(value: string) {
  const trimmedValue = value.trim();
  const urlWithProtocol = /^https?:\/\//.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  return urlWithProtocol.replace(/\/+$/, "");
}
