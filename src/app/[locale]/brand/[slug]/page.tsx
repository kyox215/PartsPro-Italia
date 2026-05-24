import { notFound } from "next/navigation";

import { CatalogPageShell } from "@/components/product/catalog-page-shell";
import { catalogBrands, filterCatalogSkus, getBrandBySlug } from "@/lib/catalog-data";
import { getMessages, isLocale, locales } from "@/lib/i18n";

type BrandPageProps = Readonly<{
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    quality?: string;
  }>;
}>;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    catalogBrands.map((brand) => ({ locale, slug: brand.slug })),
  );
}

export default async function BrandPage({
  params,
  searchParams,
}: BrandPageProps) {
  const { locale, slug } = await params;
  const { quality } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const brand = getBrandBySlug(slug);

  if (!brand) {
    notFound();
  }

  const messages = getMessages(locale);
  const skus = filterCatalogSkus({ brandSlug: slug, quality });

  return (
    <CatalogPageShell
      basePath={`/${locale}/brand/${slug}`}
      copy={messages.catalog}
      description={messages.catalog.brand.description.replace("{brand}", brand.name)}
      locale={locale}
      selectedBrand={slug}
      selectedQuality={quality}
      skus={skus}
      title={brand.name}
    />
  );
}
