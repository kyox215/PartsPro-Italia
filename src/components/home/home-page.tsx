import Link from "next/link";
import {
  Battery,
  Cable,
  Camera,
  MonitorSmartphone,
  PlugZap,
  ShieldCheck,
  Truck,
  Wrench,
} from "lucide-react";

import { B2BCta } from "@/components/b2b/b2b-cta";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteHeader } from "@/components/layout/site-header";
import { PartVisual } from "@/components/product/part-visual";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  homeBrands,
  homeCategories,
  homeMetrics,
  homeProducts,
  type HomeCategory,
} from "@/lib/home-data";
import { cn } from "@/lib/utils";
import type { Dictionary, Locale } from "@/types";

import { ProductShelf } from "./product-shelf";
import { SearchBar } from "../search/search-bar";

type HomePageProps = Readonly<{
  locale: Locale;
  copy: Dictionary["home"];
}>;

const categoryIcons: Record<HomeCategory["icon"], typeof MonitorSmartphone> = {
  battery: Battery,
  cable: Cable,
  camera: Camera,
  port: PlugZap,
  screen: MonitorSmartphone,
  tool: Wrench,
};

export function HomePage({ locale, copy }: HomePageProps) {
  return (
    <>
      <SiteHeader cartLabels={copy.cart} labels={copy.header} locale={locale} />
      <main className="min-w-0 flex-1 bg-background pb-20 text-foreground md:pb-0">
        <section className="mx-auto grid w-full max-w-7xl gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[280px_1fr]">
          <aside className="hidden rounded-lg border border-border bg-surface p-2 shadow-[var(--shadow-xs)] lg:block">
            <p className="px-2 py-2 text-xs font-semibold uppercase text-muted-foreground">
              {copy.categories.title}
            </p>
            <div className="grid gap-1">
              {homeCategories.map((category) => {
                const Icon = categoryIcons[category.icon];
                return (
                  <Link
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-primary-soft hover:text-secondary-foreground"
                    href={`/${locale}/category/${category.slug}`}
                    key={category.id}
                  >
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">
                      {category.name[locale]}
                    </span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {category.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </aside>

          <div className="grid min-w-0 gap-4">
            <Hero locale={locale} copy={copy} />
            <CategoryStrip copy={copy.categories} locale={locale} />
          </div>
        </section>

        <section
          className="mx-auto grid w-full max-w-7xl gap-4 px-3 pb-5 sm:px-5"
          id="products"
        >
          <SectionHeader
            action={copy.products.viewAll}
            actionHref={`/${locale}/products`}
            description={copy.products.description}
            title={copy.products.title}
          />
          <ProductShelf
            labels={copy.products}
            locale={locale}
            products={homeProducts}
          />
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-4 px-3 pb-5 sm:px-5">
          <B2BCta copy={copy.b2b} locale={locale} />
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-4 px-3 pb-8 sm:px-5">
          <SectionHeader
            action={copy.brands.viewAll}
            actionHref={`/${locale}/products`}
            description={copy.brands.description}
            title={copy.brands.title}
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {homeBrands.map((brand) => (
              <Link
                className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-3 py-3 text-sm font-semibold shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-primary-border hover:shadow-[var(--shadow-sm)]"
                href={`/${locale}/brand/${brand.id}`}
                key={brand.id}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: brand.accent }}
                />
                <span className="truncate">{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <MobileBottomNav labels={copy.mobileNav} locale={locale} />
    </>
  );
}

function Hero({ locale, copy }: HomePageProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-primary-border bg-[linear-gradient(135deg,#EEF2FF_0%,#FFFFFF_50%,#E0F2FE_100%)] shadow-[var(--shadow-xs)]">
      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1fr_330px] lg:items-center">
        <div className="min-w-0 space-y-4">
          <Badge variant="info">{copy.hero.eyebrow}</Badge>
          <div className="space-y-2">
            <h1 className="max-w-2xl text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {copy.hero.title}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
              {copy.hero.description}
            </p>
          </div>

          <SearchBar
            action={`/${locale}/search`}
            buttonLabel={copy.search.button}
            cameraLabel={copy.search.camera}
            clearLabel={copy.search.clear}
            placeholder={copy.search.placeholder}
            toastDescription={copy.search.toastDescription}
            toastTitle={copy.search.toastTitle}
          />

          <div className="flex flex-wrap gap-2">
            <Link
              className={cn(buttonVariants(), "min-w-32")}
              href={`/${locale}/products`}
            >
              {copy.hero.primary}
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={`/${locale}/register`}
            >
              {copy.hero.secondary}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_0.8fr] gap-3">
          <PartVisual className="min-h-36" variant="screen" />
          <div className="grid gap-3">
            <PartVisual className="min-h-16" variant="battery" />
            <PartVisual className="min-h-16" variant="port" />
          </div>
        </div>
      </div>

      <div className="grid border-t border-primary-border/70 bg-white/70 sm:grid-cols-3">
        {homeMetrics.map((metric) => (
          <div
            className="flex items-center gap-3 border-t border-primary-border/50 px-4 py-3 first:border-t-0 sm:border-t-0 sm:border-l sm:first:border-l-0"
            key={metric.id}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              {metric.id === "sku" ? (
                <ShieldCheck className="size-4" aria-hidden="true" />
              ) : (
                <Truck className="size-4" aria-hidden="true" />
              )}
            </span>
            <span className="min-w-0">
              <strong className="block text-base leading-5">
                {metric.value}
              </strong>
              <span className="block truncate text-xs text-muted-foreground">
                {metric.label[locale]}
              </span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CategoryStrip({
  copy,
  locale,
}: Readonly<{
  copy: Dictionary["home"]["categories"];
  locale: Locale;
}>) {
  return (
    <section className="grid gap-3" id="categories">
      <SectionHeader
        action={copy.viewAll}
        actionHref={`/${locale}/products`}
        title={copy.title}
      />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {homeCategories.map((category) => {
          const Icon = categoryIcons[category.icon];
          return (
            <Link
              className="flex min-w-0 flex-col items-center gap-2 rounded-lg border border-border bg-surface p-2 text-center text-xs font-medium shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-primary-border hover:bg-primary-soft"
              href={`/${locale}/category/${category.slug}`}
              key={category.id}
            >
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="w-full truncate">{category.name[locale]}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function SectionHeader({
  action,
  actionHref,
  description,
  title,
}: Readonly<{
  action?: string;
  actionHref?: string;
  description?: string;
  title: string;
}>) {
  return (
    <div className="flex min-w-0 items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold tracking-normal text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          className="shrink-0 text-sm font-medium text-primary hover:underline"
          href={actionHref ?? "#products"}
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
