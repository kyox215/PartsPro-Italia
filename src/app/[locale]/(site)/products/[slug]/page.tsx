import Image from "next/image";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, Lock } from "lucide-react";
import { QuantityAddToCart } from "@/components/cart/add-to-cart-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { products } from "@/lib/catalog";
import { loadCatalogItemBySlug } from "@/lib/catalog-page";
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
  const detail = await loadCatalogItemBySlug(locale, slug);

  if (!detail) {
    notFound();
  }

  const { item } = detail;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <ProductMedia name={item.name} image={item.image} />

      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-slate-200 bg-slate-50 text-slate-700">
            {item.quality}
          </Badge>
          {detail.isPriceVisible ? (
            <StockBadge
              available={item.availableStock ?? 0}
              incoming={item.incomingAvailable ?? item.incomingQty ?? 0}
              leadMax={item.preorderLeadTimeMaxDays ?? 14}
              leadMin={item.preorderLeadTimeMinDays ?? 7}
              locale={locale}
            />
          ) : (
            <Badge className="border-amber-200 bg-amber-50 text-amber-700">
              {locale === "it" ? "Login per prezzo" : "登录查看价格"}
            </Badge>
          )}
        </div>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">{item.name}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>

        <dl className="mt-6 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-slate-500">SKU</dt>
            <dd className="mt-1 font-mono text-sm font-bold text-slate-950">
              {item.sku}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">{dictionary.common.moq}</dt>
            <dd className="mt-1 font-bold text-slate-950">{item.moq}</dd>
          </div>
          {detail.isPriceVisible ? (
            <>
              <div>
                <dt className="text-xs uppercase text-slate-500">
                  {dictionary.common.retail}
                </dt>
                <dd className="mt-1 text-2xl font-bold text-slate-950">
                  {formatMoney(item.retailPrice ?? 0, locale)}
                </dd>
              </div>
              {detail.isB2BPriceVisible ? (
                <div>
                  <dt className="text-xs uppercase text-slate-500">
                    {dictionary.common.b2b}
                  </dt>
                  <dd className="mt-1 text-2xl font-bold text-blue-700">
                    {formatMoney(item.b2bPrice ?? 0, locale)}
                  </dd>
                </div>
              ) : null}
            </>
          ) : (
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase text-slate-500">
                {locale === "it" ? "Prezzo e stock" : "价格与库存"}
              </dt>
              <dd className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-900">
                <Lock className="mr-2 inline h-4 w-4" />
                {locale === "it"
                  ? "Accedi per vedere prezzi e disponibilita."
                  : "登录后查看价格和库存。"}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-4">
            <h2 className="font-bold text-slate-950">{dictionary.product.compatibility}</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(item.compatibility.length > 0 ? item.compatibility : [item.model]).map(
                (value) => (
                  <li key={value} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {value}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 className="font-bold text-blue-950">
              {locale === "it" ? "Parametri" : "商品参数"}
            </h2>
            {detail.attributes.length > 0 ? (
              <dl className="mt-3 space-y-2 text-sm text-blue-950">
                {detail.attributes.map((attribute) => (
                  <div key={`${attribute.key}-${attribute.value}`} className="flex justify-between gap-3">
                    <dt className="text-blue-800">{attribute.label}</dt>
                    <dd className="font-bold">{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-blue-900">
                {locale === "it" ? "Parametri non ancora assegnati." : "暂未设置参数。"}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm leading-6 text-orange-900">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          <strong>{dictionary.product.installationNotice}: </strong>
          {dictionary.product.installationCopy}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <QuantityAddToCart
              sku={item.sku}
              minQuantity={item.moq}
              label={
                detail.isPriceVisible && (item.availableStock ?? 0) <= 0
                  ? locale === "it"
                    ? "Preordina"
                    : "预购"
                  : (dictionary.common.addToCart as string)
              }
              addedLabel={locale === "it" ? "Aggiunto" : "已加入购物车"}
              disabled={
                detail.isPriceVisible &&
                (item.availableStock ?? 0) <= 0 &&
                (item.incomingAvailable ?? item.incomingQty ?? 0) <= 0
              }
            />
            {!detail.isPriceVisible ? (
              <p className="mt-2 text-xs font-semibold text-amber-700">
                <Lock className="mr-1 inline h-3.5 w-3.5" />
                {locale === "it"
                  ? "Puoi aggiungere al carrello; il checkout richiede login."
                  : "可先加入购物车；结账时需要登录。"}
              </p>
            ) : null}
          </div>
          <ButtonLink href={localizePath(locale, "/account/company")} variant="secondary">
            {dictionary.common.accountProfile as string}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function ProductMedia({
  name,
  image,
}: Readonly<{ name: string; image: string | null }>) {
  if (image?.startsWith("https://images.unsplash.com/")) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Image
          src={image}
          alt={name}
          width={900}
          height={675}
          className="aspect-[4/3] w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-slate-200 bg-slate-100 p-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-white text-2xl font-bold text-slate-400">
          SKU
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">{name}</p>
      </div>
    </div>
  );
}

function StockBadge({
  available,
  incoming,
  leadMin,
  leadMax,
  locale,
}: Readonly<{
  available: number;
  incoming: number;
  leadMin: number;
  leadMax: number;
  locale: Locale;
}>) {
  if (available > 0) {
    return (
      <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
        {locale === "it" ? "Disponibile" : "有现货"} {available}
      </Badge>
    );
  }

  if (incoming > 0) {
    return (
      <Badge className="border-violet-200 bg-violet-50 text-violet-700">
        {locale === "it" ? "Preordine" : "预购"} {leadMin}-{leadMax}{" "}
        {locale === "it" ? "gg" : "天"}
      </Badge>
    );
  }

  return (
    <Badge className="border-rose-200 bg-rose-50 text-rose-700">
      {locale === "it" ? "Esaurito" : "缺货"}
    </Badge>
  );
}
