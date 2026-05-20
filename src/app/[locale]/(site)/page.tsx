import Image from "next/image";
import { ArrowRight, CheckCircle2, Clock3, PackageSearch, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { categories, products } from "@/lib/catalog";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function LocaleHome({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const featuredProducts = products.slice(0, 3);

  return (
    <div>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.05fr_0.95fr] md:py-14 lg:px-8">
          <div className="flex flex-col justify-center">
            <Badge className="w-fit border-blue-200 bg-blue-50 text-blue-700">
              {dictionary.home.eyebrow}
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-bold text-slate-950 sm:text-5xl">
              {dictionary.home.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              {dictionary.home.subtitle}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={localizePath(locale, "/products")}>
                {dictionary.home.primaryCta}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href={localizePath(locale, "/b2b")} variant="secondary">
                {dictionary.home.secondaryCta}
              </ButtonLink>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                [Clock3, dictionary.home.stockPromise],
                [PackageSearch, dictionary.home.searchTitle],
                [ShieldCheck, dictionary.product.installationNotice],
              ].map(([Icon, label]) => (
                <div
                  key={label as string}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700"
                >
                  <Icon className="h-5 w-5 text-blue-600" />
                  <span>{label as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white">
              <Image
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
                alt="Phone repair workstation"
                width={1200}
                height={720}
                priority
                className="h-72 w-full object-cover opacity-90"
              />
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {[
                  ["300-800", "SKU MVP"],
                  ["24/48h", "Italia"],
                  ["B2B", "Tier pricing"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-lg bg-white/10 p-4">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="mt-1 text-xs uppercase text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <CheckCircle2 className="mr-2 inline h-4 w-4" />
              {locale === "it"
                ? "Architettura pronta per GitHub, Vercel, Supabase e Stripe."
                : "架构已按 GitHub、Vercel、Supabase 和 Stripe 部署准备。"}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-700">
              {dictionary.home.categoriesTitle}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              {locale === "it" ? "Catalogo per riparazioni frequenti" : "高频维修配件目录"}
            </h2>
          </div>
          <ButtonLink href={localizePath(locale, "/products")} variant="secondary">
            {dictionary.nav.products}
          </ButtonLink>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {categories.map((category) => (
            <a
              key={category.id}
              href={localizePath(locale, `/products?category=${category.id}`)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-800 transition hover:border-blue-300 hover:text-blue-700 hover:shadow-md"
            >
              {category.label[locale]}
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-700">
            {dictionary.home.featuredTitle}
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-950">
            {locale === "it" ? "Prodotti di esempio gia collegabili" : "可接入数据库的商品样例"}
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.sku}
              product={product}
              locale={locale}
              dictionary={dictionary}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
