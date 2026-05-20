import { Badge } from "@/components/ui/badge";
import { CartClient } from "@/components/cart/cart-client";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function CartPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-6 border-b border-slate-200 pb-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {dictionary.nav.cart as string}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Carrello acquisti" : "采购购物车"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Aggiungi SKU anche senza login; il checkout richiede accesso e ricalcola prezzi, MOQ e disponibilita lato server."
            : "游客也可以先加购；结账时必须登录，系统会重新校验价格、起订量和可售/可预购数量。"}
        </p>
      </section>

      <CartClient locale={locale} productsHref={localizePath(locale, "/products")} />
    </div>
  );
}
