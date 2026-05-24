import { notFound } from "next/navigation";

import { CatalogPageShell } from "@/components/product/catalog-page-shell";
import { filterCatalogSkus } from "@/lib/catalog-data";
import { getMessages, isLocale } from "@/lib/i18n";

type SearchPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
    quality?: string;
  }>;
}>;

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  const { q, quality } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);
  const skus = filterCatalogSkus({ query: q, quality });

  return (
    <CatalogPageShell
      basePath={`/${locale}/search${q ? `?q=${encodeURIComponent(q)}` : ""}`}
      copy={messages.catalog}
      description={messages.catalog.searchPage.description}
      locale={locale}
      query={q}
      selectedQuality={quality}
      skus={skus}
      title={messages.catalog.searchPage.title}
    />
  );
}
