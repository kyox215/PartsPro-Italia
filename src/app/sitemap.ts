import type { MetadataRoute } from "next";

import {
  catalogBrands,
  catalogCategories,
  catalogProducts,
} from "@/lib/catalog-data";
import { locales } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site";

const staticRoutes = ["", "/products", "/search"];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const localizedStaticRoutes = locales.flatMap((locale) =>
    staticRoutes.map((route) => ({
      url: `${siteUrl}/${locale}${route}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    })),
  );

  const categoryRoutes = locales.flatMap((locale) =>
    catalogCategories.map((category) => ({
      url: `${siteUrl}/${locale}/category/${category.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  const brandRoutes = locales.flatMap((locale) =>
    catalogBrands.map((brand) => ({
      url: `${siteUrl}/${locale}/brand/${brand.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  );

  const productRoutes = locales.flatMap((locale) =>
    catalogProducts.map((product) => ({
      url: `${siteUrl}/${locale}/product/${product.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  );

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...localizedStaticRoutes,
    ...categoryRoutes,
    ...brandRoutes,
    ...productRoutes,
  ];
}
