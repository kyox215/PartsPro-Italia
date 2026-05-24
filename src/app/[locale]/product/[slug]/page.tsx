import Link from "next/link";
import { ArrowLeft, Boxes, PackageCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { CatalogProductGrid } from "@/components/product/catalog-product-grid";
import { PartVisual } from "@/components/product/part-visual";
import { QualityBadge } from "@/components/product/quality-badge";
import { StockBadge } from "@/components/product/stock-badge";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  catalogProducts,
  filterCatalogSkus,
  getBrandBySlug,
  getCategoryBySlug,
  getProductBySlug,
  getSkusByProduct,
} from "@/lib/catalog-data";
import { getMessages, isLocale, locales } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type ProductPageProps = Readonly<{
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}>;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    catalogProducts.map((product) => ({ locale, slug: product.slug })),
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const messages = getMessages(locale);
  const copy = messages.catalog;
  const brand = getBrandBySlug(product.brandSlug);
  const category = getCategoryBySlug(product.categorySlug);
  const skus = getSkusByProduct(product.slug);
  const relatedSkus = filterCatalogSkus({ categorySlug: product.categorySlug })
    .filter((sku) => sku.productSlug !== product.slug)
    .slice(0, 4);

  if (!brand || !category) {
    notFound();
  }

  return (
    <>
      <SiteHeader
        cartLabels={copy.cart}
        labels={copy.header}
        locale={locale}
      />
      <main className="min-w-0 flex-1 bg-background pb-20 text-foreground md:pb-8">
        <section className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-5">
          <Link
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              "w-fit",
            )}
            href={`/${locale}/products`}
          >
            <ArrowLeft aria-hidden="true" />
            {copy.detail.back}
          </Link>

          <section className="grid gap-4 rounded-lg border border-primary-border bg-[linear-gradient(135deg,#EEF2FF_0%,#FFFFFF_58%,#ECFEFF_100%)] p-3 shadow-[var(--shadow-xs)] sm:p-4 lg:grid-cols-[360px_1fr]">
            <PartVisual className="min-h-64" variant={product.visual} />
            <div className="grid min-w-0 gap-4">
              <div className="min-w-0 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">{brand.name}</Badge>
                  <Badge variant="outline">{category.name[locale]}</Badge>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                    {product.name[locale]}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {product.description[locale]}
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <InfoTile label={copy.detail.brand} value={brand.name} />
                <InfoTile
                  label={copy.detail.category}
                  value={category.name[locale]}
                />
                <InfoTile
                  label={copy.detail.models}
                  value={product.modelCodes.join(", ")}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-3">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <Boxes className="size-4 text-primary" aria-hidden="true" />
                  {copy.detail.skuList}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {copy.results.count.replace("{count}", String(skus.length))}
                </p>
              </div>
            </div>

            <div className="grid gap-2 md:hidden">
              {skus.map((sku) => (
                <article
                  className="grid gap-2 rounded-lg border border-border bg-card p-3 shadow-[var(--shadow-xs)]"
                  key={sku.id}
                >
                  <div className="flex min-w-0 items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold">{sku.sku}</p>
                      <p className="text-xs text-muted-foreground">
                        {copy.detail.moq}: {sku.moq}
                      </p>
                    </div>
                    <QualityBadge quality={sku.quality} />
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {copy.detail.stock}: {sku.stock}
                      </p>
                      <StockBadge labels={copy.detail} stock={sku.stock} />
                    </div>
                    <p className="text-lg font-semibold">{sku.priceLabel}</p>
                  </div>
                  <AddToCartButton
                    className="h-8"
                    labels={copy.detail}
                    locale={locale}
                    sku={sku}
                  />
                </article>
              ))}
            </div>

            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>{copy.detail.quality}</TableHead>
                    <TableHead>{copy.detail.stock}</TableHead>
                    <TableHead>{copy.detail.price}</TableHead>
                    <TableHead>{copy.detail.moq}</TableHead>
                    <TableHead className="text-right">{copy.detail.add}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skus.map((sku) => (
                    <TableRow key={sku.id}>
                      <TableCell>
                        <div className="font-mono text-xs font-semibold">
                          {sku.sku}
                        </div>
                      </TableCell>
                      <TableCell>
                        <QualityBadge quality={sku.quality} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <StockBadge labels={copy.detail} stock={sku.stock} />
                          <span className="font-mono text-xs text-muted-foreground">
                            {sku.stock}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{sku.priceLabel}</TableCell>
                      <TableCell>{sku.moq}</TableCell>
                      <TableCell className="text-right">
                        <AddToCartButton
                          className="h-8"
                          labels={copy.detail}
                          locale={locale}
                          sku={sku}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          {relatedSkus.length ? (
            <section className="grid gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <PackageCheck className="size-4 text-primary" aria-hidden="true" />
                {copy.detail.related}
              </h2>
              <CatalogProductGrid
                labels={copy.productCard}
                locale={locale}
                skus={relatedSkus}
              />
            </section>
          ) : null}
        </section>
      </main>
      <MobileBottomNav labels={copy.mobileNav} locale={locale} />
    </>
  );
}

function InfoTile({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="min-w-0 rounded-lg border border-primary-border/70 bg-white/80 p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
