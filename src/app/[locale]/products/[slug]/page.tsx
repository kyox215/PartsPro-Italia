import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getProductBySlug, products, qualityStyles } from "@/lib/catalog";
import { getDictionary, isLocale, locales, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    products.map((product) => ({ locale, slug: product.slug })),
  );
}

export default async function ProductDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; slug: string }> }>) {
  const { locale: rawLocale, slug } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Image
          src={product.image}
          alt={product.names[locale]}
          width={900}
          height={675}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge className={qualityStyles[product.quality]}>{product.quality}</Badge>
          <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
            {product.stock > 0 ? dictionary.common.inStock : dictionary.common.preorder}
          </Badge>
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {product.names[locale]}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {product.descriptions[locale]}
        </p>

        <dl className="mt-6 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-500">SKU</dt>
            <dd className="mt-1 font-mono text-sm font-bold text-slate-950">
              {product.sku}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">{dictionary.common.moq}</dt>
            <dd className="mt-1 font-bold text-slate-950">{product.moq}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">
              {dictionary.common.retail}
            </dt>
            <dd className="mt-1 text-2xl font-bold text-slate-950">
              {formatMoney(product.retailPrice, locale)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">{dictionary.common.b2b}</dt>
            <dd className="mt-1 text-2xl font-bold text-blue-700">
              {formatMoney(product.b2bPrice, locale)}
            </dd>
          </div>
        </dl>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-bold text-slate-950">{dictionary.product.compatibility}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {product.compatibility.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 className="font-bold text-blue-950">{dictionary.product.tiers}</h2>
            <ul className="mt-3 space-y-2 text-sm text-blue-900">
              {product.tiers.map((tier) => (
                <li key={tier.minQty} className="flex justify-between">
                  <span>{tier.minQty}+ pcs</span>
                  <strong>{formatMoney(tier.unitPrice, locale)}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          <strong>{dictionary.product.installationNotice}: </strong>
          {dictionary.product.installationCopy}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={localizePath(locale, "/cart")} className="flex-1">
            <ShoppingCart className="h-4 w-4" />
            {dictionary.common.addToCart}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/b2b")} variant="secondary">
            {dictionary.common.requestB2b}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
