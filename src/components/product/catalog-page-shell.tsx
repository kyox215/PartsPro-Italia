import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { CatalogFilterPanel } from "@/components/search/catalog-filter-panel";
import { CatalogSearchForm } from "@/components/search/catalog-search-form";
import { catalogCategories, catalogSkus } from "@/lib/catalog-data";
import { cn } from "@/lib/utils";
import type { Dictionary, Locale } from "@/types";

import { CatalogProductGrid } from "./catalog-product-grid";

type CatalogPageShellProps = Readonly<{
  locale: Locale;
  copy: Dictionary["catalog"];
  title: string;
  description: string;
  skus: typeof catalogSkus;
  basePath: string;
  query?: string;
  selectedCategory?: string;
  selectedBrand?: string;
  selectedQuality?: string;
}>;

export function CatalogPageShell({
  locale,
  copy,
  title,
  description,
  skus,
  basePath,
  query,
  selectedCategory,
  selectedBrand,
  selectedQuality,
}: CatalogPageShellProps) {
  return (
    <>
      <SiteHeader
        cartLabels={copy.cart}
        labels={copy.header}
        locale={locale}
      />
      <main className="min-w-0 flex-1 bg-background pb-20 text-foreground md:pb-8">
        <section className="mx-auto grid w-full max-w-7xl gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4">
          <div className="rounded-lg border border-primary-border bg-[linear-gradient(135deg,#EEF2FF_0%,#FFFFFF_56%,#ECFEFF_100%)] p-3 shadow-[var(--shadow-xs)] sm:p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_460px] lg:items-end">
              <div className="min-w-0 space-y-2">
                <h1 className="text-xl font-semibold tracking-normal sm:text-3xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6">
                  {description}
                </p>
              </div>
              <CatalogSearchForm
                action={`/${locale}/search`}
                className="sticky top-16 z-30"
                defaultValue={query}
                labels={copy.search}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <CatalogFilterPanel
              basePath={basePath}
              className="hidden lg:grid"
              labels={copy.filters}
              locale={locale}
              selectedBrand={selectedBrand}
              selectedCategory={selectedCategory}
              selectedQuality={selectedQuality}
            />
            <section className="grid min-w-0 gap-3">
              <MobileFilterChips
                basePath={basePath}
                labels={copy.filters}
                locale={locale}
                selectedCategory={selectedCategory}
                selectedQuality={selectedQuality}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  {copy.results.count.replace("{count}", String(skus.length))}
                </p>
              </div>
              <CatalogProductGrid labels={copy.productCard} locale={locale} skus={skus} />
            </section>
          </div>
        </section>
      </main>
      <MobileBottomNav labels={copy.mobileNav} locale={locale} />
    </>
  );
}

function MobileFilterChips({
  basePath,
  labels,
  locale,
  selectedCategory,
  selectedQuality,
}: Readonly<{
  basePath: string;
  labels: Dictionary["catalog"]["filters"];
  locale: Locale;
  selectedCategory?: string;
  selectedQuality?: string;
}>) {
  return (
    <div className="-mx-3 grid gap-2 overflow-x-auto px-3 pb-1 lg:hidden">
      <div className="flex min-w-max items-center gap-1.5">
        <Link
          className={cn(
            "rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-xs)]",
            !selectedCategory && "border-primary-border bg-primary-soft text-primary",
          )}
          href={basePath}
        >
          {labels.all}
        </Link>
        {catalogCategories.map((category) => (
          <Link
            className={cn(
              "rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-xs)]",
              selectedCategory === category.slug &&
                "border-primary-border bg-primary-soft text-primary",
            )}
            href={`/${locale}/category/${category.slug}`}
            key={category.slug}
          >
            {category.name[locale]}
          </Link>
        ))}
        {(["A+", "A", "B"] as const).map((quality) => (
          <Link href={withQuality(basePath, quality)} key={quality}>
            <Badge variant={selectedQuality === quality ? "quality" : "outline"}>
              {quality}
            </Badge>
          </Link>
        ))}
      </div>
    </div>
  );
}

function withQuality(path: string, quality: string) {
  const [pathname = path, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("quality", quality);

  return `${pathname}?${params.toString()}`;
}
