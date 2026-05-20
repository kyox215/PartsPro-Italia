import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { Banknote, CreditCard, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  checkoutCartCookieName,
  decodeCheckoutCart,
} from "@/lib/checkout-cart-cookie";
import { loadCheckoutLines } from "@/lib/checkout-lines";
import { getDictionary, isLocale, type Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";
import { hasStripeConfig } from "@/lib/stripe";

export default async function CheckoutPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const cookieStore = await cookies();
  const selectedItems = itemsFromSearchParams(query);
  const checkoutItems = selectedItems.length
    ? selectedItems
    : decodeCheckoutCart(cookieStore.get(checkoutCartCookieName)?.value);
  const checkout = await loadCheckoutLines({ locale, items: checkoutItems });
  const error = valueOf(query.error);
  const cartLines = checkout.lines;
  const stripeReady = hasStripeConfig();
  const itemsJson = JSON.stringify(
    cartLines.map((line) => ({ sku: line.sku, quantity: line.quantity })),
  );
  const subtotal = cartLines.reduce((sum, line) => sum + line.subtotal, 0);
  const vat = cartLines.reduce((sum, line) => sum + line.vat, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Checkout</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {dictionary.checkout.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.checkout.subtitle}
        </p>

        {error ? (
          <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        {checkout.requiresLogin ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {locale === "it"
              ? "Accedi per vedere prezzi e creare preordini."
              : "请先登录，才能查看价格并创建预购订单。"}
            <ButtonLink
              href={`${localizePath(locale, "/login")}?next=${encodeURIComponent(localizePath(locale, "/checkout"))}`}
              className="mt-4 w-fit"
            >
              {locale === "it" ? "Login" : "登录"}
            </ButtonLink>
          </div>
        ) : null}

        {!checkout.requiresLogin && cartLines.length === 0 ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
            {locale === "it"
              ? "Il carrello checkout e vuoto. Torna al catalogo e aggiungi SKU."
              : "当前没有可结账商品。请返回商品目录加入商品。"}
            <ButtonLink href={localizePath(locale, "/products")} className="mt-4 w-fit">
              {locale === "it" ? "Catalogo" : "商品目录"}
            </ButtonLink>
          </div>
        ) : null}

        {!checkout.requiresLogin && cartLines.length > 0 ? (
        <form className="mt-8 grid gap-6" action="/api/orders" method="post">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="itemsJson" value={itemsJson} />
          <Fieldset title={dictionary.checkout.customer as string}>
            <Input name="email" label="Email" type="email" />
            <Input name="name" label={locale === "it" ? "Nome" : "姓名"} />
            <Input name="phone" label={locale === "it" ? "Telefono" : "电话"} />
            <Input name="whatsapp" label="WhatsApp" />
          </Fieldset>

          <Fieldset title={dictionary.checkout.company as string}>
            <Input name="companyName" label={locale === "it" ? "Ragione sociale" : "公司名称"} />
            <Input name="vatNumber" label="P.IVA" />
            <Input name="fiscalCode" label="Codice Fiscale" />
            <Input name="sdi" label="SDI" />
            <Input name="pec" label="PEC" />
            <Input name="shippingAddress" label={locale === "it" ? "Indirizzo spedizione" : "收货地址"} />
          </Fieldset>

          <Fieldset title={dictionary.checkout.payment as string}>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">
              <input
                name="paymentMethod"
                type="radio"
                value="stripe"
                defaultChecked={stripeReady}
                disabled={!stripeReady}
              />
              <CreditCard className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">
                {dictionary.checkout.stripe}
                {!stripeReady ? (
                  <span className="ml-2 text-xs text-slate-500">
                    {locale === "it" ? "non configurato" : "未配置"}
                  </span>
                ) : null}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">
              <input
                name="paymentMethod"
                type="radio"
                value="cash"
                defaultChecked={!stripeReady}
              />
              <Banknote className="h-5 w-5 text-orange-600" />
              <span className="font-semibold">
                {locale === "it" ? "Contanti alla consegna/ritiro" : "现金支付（到店/送货）"}
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-4">
              <input name="paymentMethod" type="radio" value="bank_transfer" />
              <Landmark className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">{dictionary.checkout.bank}</span>
            </label>
          </Fieldset>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-bold text-slate-950">
              {locale === "it" ? "Riepilogo ordine" : "订单摘要"}
            </h2>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              {cartLines.map((line) => (
                <div key={line.sku} className="grid gap-1 border-b border-slate-200 pb-2 last:border-b-0">
                  <div className="flex justify-between gap-4">
                    <span className="font-semibold text-slate-900">
                      {line.displayName} x {line.quantity}
                    </span>
                    <strong>{formatMoney(line.subtotal, locale)}</strong>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {line.quality ? (
                      <CheckoutMetaPill className="bg-blue-50 text-blue-700">
                        {line.quality}
                      </CheckoutMetaPill>
                    ) : null}
                    <CheckoutMetaPill className="bg-white font-mono text-slate-600">
                      {line.sku}
                    </CheckoutMetaPill>
                    <CheckoutMetaPill className="bg-white text-slate-700">
                      MOQ {line.moq}
                    </CheckoutMetaPill>
                    <CheckoutMetaPill className="bg-emerald-50 text-emerald-700">
                      {checkoutFulfillmentLabel(line, locale)}
                    </CheckoutMetaPill>
                  </div>
                </div>
              ))}
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span>VAT</span>
                <strong>{formatMoney(vat, locale)}</strong>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-950">
                <span>Total</span>
                <strong>{formatMoney(subtotal + vat, locale)}</strong>
              </div>
            </div>
          </section>

          <button
            className="h-12 rounded-lg border border-blue-600 bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700"
            type="submit"
          >
            {dictionary.common.submit}
          </button>
        </form>
        ) : null}
      </section>
    </div>
  );
}

function Fieldset({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <fieldset className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
      <legend className="px-2 text-sm font-bold text-slate-950">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckoutMetaPill({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <span className={`rounded-md px-2 py-1 font-semibold ${className ?? ""}`}>
      {children}
    </span>
  );
}

function checkoutFulfillmentLabel(
  line: {
    fulfillmentType: "stock" | "preorder" | "mixed";
    preorderLeadTimeMinDays: number;
    preorderLeadTimeMaxDays: number;
  },
  locale: Locale,
) {
  if (line.fulfillmentType === "stock") {
    return locale === "it" ? "Da stock disponibile" : "现货发货";
  }

  if (line.fulfillmentType === "preorder") {
    return locale === "it"
      ? `Preordine ${line.preorderLeadTimeMinDays}-${line.preorderLeadTimeMaxDays} giorni`
      : `预购 ${line.preorderLeadTimeMinDays}-${line.preorderLeadTimeMaxDays} 天到货`;
  }

  return locale === "it" ? "Stock + preordine" : "现货 + 预购";
}

function itemsFromSearchParams(searchParams: Record<string, string | string[] | undefined>) {
  const sku = valueOf(searchParams.sku);
  const qty = Math.max(1, Number.parseInt(valueOf(searchParams.qty), 10) || 1);

  if (!sku) return [];
  return [{ sku, quantity: qty }];
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : (value ?? "");
}

function Input({
  name,
  label,
  type = "text",
}: Readonly<{ name: string; label: string; type?: string }>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        name={name}
        type={type}
      />
    </label>
  );
}
