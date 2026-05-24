import { notFound } from "next/navigation";

import { CatalogPageShell } from "@/components/product/catalog-page-shell";
import { filterCatalogSkus } from "@/lib/catalog-data";
import { getMessages, isLocale } from "@/lib/i18n";

type ProductsPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    quality?: string;
  }>;
}>;

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { locale } = await params;
  const { quality } = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = getMessages(locale);
  const skus = filterCatalogSkus({ quality });

  return (
    <CatalogPageShell
      basePath={`/${locale}/products`}
      copy={messages.catalog}
      description={messages.catalog.products.description}
      locale={locale}
      selectedQuality={quality}
      skus={skus}
      title={messages.catalog.products.title}
    />
  );
}
