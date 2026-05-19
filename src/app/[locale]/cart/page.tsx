import Image from "next/image";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { products } from "@/lib/catalog";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";
import { calculateLineTotal, formatMoney } from "@/lib/pricing";

export default async function CartPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const cartLines = [
    { product: products[0], quantity: 5 },
    { product: products[1], quantity: 10 },
  ];
  const subtotal = cartLines.reduce(
    (sum, line) => sum + calculateLineTotal(line.product, line.quantity, true).subtotal,
    0,
  );
  const vat = cartLines.reduce(
    (sum, line) => sum + calculateLineTotal(line.product, line.quantity, true).vat,
    0,
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <Badge className="border-blue-200 bg-blue-50 text-blue-700">MVP</Badge>
          <h1 className="mt-4 text-3xl font-bold text-slate-950">
            {dictionary.nav.cart}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {locale === "it"
              ? "Carrello dimostrativo pronto per essere collegato a sessioni Supabase o cookie firmati."
              : "购物车样例已准备好，后续可接 Supabase 会话或签名 Cookie。"}
          </p>

          <div className="mt-6 divide-y divide-slate-200">
            {cartLines.map(({ product, quantity }) => {
              const line = calculateLineTotal(product, quantity, true);

              return (
                <div key={product.sku} className="grid gap-4 py-5 md:grid-cols-[96px_1fr_auto]">
                  <Image
                    src={product.image}
                    alt={product.names[locale]}
                    width={96}
                    height={96}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-bold text-slate-950">{product.names[locale]}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{product.sku}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {dictionary.common.moq}: {product.moq} / {dictionary.common.vat}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 md:flex-col md:items-end">
                    <input
                      aria-label="Quantity"
                      className="h-10 w-20 rounded-lg border border-slate-300 px-3 text-sm"
                      defaultValue={quantity}
                      min={product.moq}
                      type="number"
                    />
                    <strong className="text-slate-950">
                      {formatMoney(line.subtotal, locale)}
                    </strong>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600"
                      type="button"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatMoney(subtotal, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>VAT 22%</dt>
              <dd>{formatMoney(vat, locale)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatMoney(subtotal + vat, locale)}</dd>
            </div>
          </dl>
          <ButtonLink
            href={localizePath(locale, "/checkout")}
            className="mt-5 w-full"
          >
            {dictionary.common.startOrder}
          </ButtonLink>
        </aside>
      </div>
    </div>
  );
}
