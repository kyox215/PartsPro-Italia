import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const privateRoutes = locales.flatMap((locale) => [
    `/${locale}/admin/`,
    `/${locale}/account/`,
    `/${locale}/auth/`,
    `/${locale}/login`,
    `/${locale}/register`,
    `/${locale}/403`,
  ]);

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: privateRoutes,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
