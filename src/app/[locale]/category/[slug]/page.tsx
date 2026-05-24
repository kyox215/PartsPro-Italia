import { notFound } from "next/navigation";

import { CatalogPageShell } from "@/components/product/catalog-page-shell";
import {
  filterCatalogSkus,
  getCategoryBySlug,
  catalogCategories,
} from "@/lib/catalog-data";
import { getMessages, isLocale, locales } from "@/lib/i18n";

type CategoryPageProps = Readonly<{
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
    catalogCategories.map((category) => ({ locale, slug: category.slug })),
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { locale, slug } = await params;
  const { quality } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const category = getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const messages = getMessages(locale);
  const skus = filterCatalogSkus({ categorySlug: slug, quality });

  return (
    <CatalogPageShell
      basePath={`/${locale}/category/${slug}`}
      copy={messages.catalog}
      description={category.description[locale]}
      locale={locale}
      selectedCategory={slug}
      selectedQuality={quality}
      skus={skus}
      title={category.name[locale]}
    />
  );
}
