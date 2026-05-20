"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  cartStorageKey,
  readCartItems,
  writeCartItems,
  type StoredCartItem,
} from "@/components/cart/add-to-cart-button";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";
import { cn } from "@/lib/utils";

type QuoteLine = {
  sku: string;
  slug: string | null;
  name: string;
  displayName: string;
  quality: string;
  quantity: number;
  moq: number;
  unitPrice: number | null;
  subtotal: number | null;
  vat: number | null;
  total: number | null;
  availableStock: number | null;
  incomingAvailable: number | null;
  fulfillmentType: "stock" | "preorder" | "mixed" | "unknown";
  preorderLeadTimeMinDays: number;
  preorderLeadTimeMaxDays: number;
  canOrder: boolean;
  errors: string[];
};

type QuoteResult = {
  lines: QuoteLine[];
  missingSkus: string[];
  subtotal: number;
  vat: number;
  total: number;
  requiresLogin: boolean;
  isPriceVisible: boolean;
  isB2BPriceVisible: boolean;
  isSupabaseBacked: boolean;
};

export function CartClient({
  locale,
  productsHref,
}: Readonly<{
  locale: Locale;
  productsHref: string;
}>) {
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshQuote = useCallback(
    async (nextItems: StoredCartItem[]) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/cart/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale, items: nextItems }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Unable to quote cart");
        setQuote(payload as QuoteResult);
      } catch (quoteError) {
        setError(
          quoteError instanceof Error ? quoteError.message : "Unable to quote cart",
        );
        setQuote(null);
      } finally {
        setIsLoading(false);
      }
    },
    [locale],
  );

  useEffect(() => {
    const load = () => {
      const storedItems = readCartItems();
      setItems(storedItems);
      void refreshQuote(storedItems);
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("partspro-cart-updated", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("partspro-cart-updated", load);
    };
  }, [refreshQuote]);

  const lineErrors = useMemo(
    () => quote?.lines.flatMap((line) => line.errors) ?? [],
    [quote],
  );
  const canCheckout = items.length > 0 && lineErrors.length === 0 && !isLoading;

  function updateQuantity(sku: string, quantity: number) {
    const nextItems = items.map((item) =>
      item.sku === sku ? { ...item, quantity: Math.max(1, quantity) } : item,
    );
    setItems(nextItems);
    writeCartItems(nextItems);
    void refreshQuote(nextItems);
  }

  function removeItem(sku: string) {
    const nextItems = items.filter((item) => item.sku !== sku);
    setItems(nextItems);
    writeCartItems(nextItems);
    void refreshQuote(nextItems);
  }

  async function checkout() {
    if (!canCheckout) return;
    setIsCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, items }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to checkout");
      window.location.href = payload.redirectTo;
    } catch (checkoutError) {
      setError(
        checkoutError instanceof Error ? checkoutError.message : "Unable to checkout",
      );
      setIsCheckingOut(false);
    }
  }

  if (isLoading && !quote) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-600" />
        {locale === "it" ? "Caricamento carrello..." : "正在加载购物车..."}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-2xl font-bold text-slate-950">
          {locale === "it" ? "Carrello vuoto" : "购物车为空"}
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          {locale === "it"
            ? "Aggiungi SKU dal catalogo per preparare un ordine."
            : "从商品目录加入 SKU 后，就可以在这里统一结账。"}
        </p>
        <Link
          href={productsHref}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700"
        >
          {locale === "it" ? "Sfoglia catalogo" : "继续采购"}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              {locale === "it" ? "Carrello" : "购物车"}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {locale === "it"
                ? "Quantita e disponibilita vengono ricalcolate dal server prima dell'ordine."
                : "数量、价格和库存会在服务器端重新计算后再创建订单。"}
            </p>
          </div>
          <button
            className="h-9 rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-700 hover:border-rose-300 hover:text-rose-700"
            type="button"
            onClick={() => {
              setItems([]);
              window.localStorage.removeItem(cartStorageKey);
              void refreshQuote([]);
            }}
          >
            {locale === "it" ? "Svuota" : "清空"}
          </button>
        </div>

        {error ? <ErrorBox message={error} /> : null}
        {lineErrors.length > 0 ? <ErrorBox message={lineErrors.join(" / ")} /> : null}
        {quote?.missingSkus.length ? (
          <ErrorBox
            message={`${locale === "it" ? "SKU non trovati" : "未找到 SKU"}: ${quote.missingSkus.join(", ")}`}
          />
        ) : null}

        <div className="mt-5 divide-y divide-slate-200">
          {(quote?.lines ?? []).map((line) => (
            <div key={line.sku} className="grid gap-3 py-4 md:grid-cols-[1fr_auto]">
              <div className="min-w-0">
                <Link
                  href={line.slug ? `/${locale}/products/${line.slug}` : productsHref}
                  className="line-clamp-2 font-bold text-slate-950 hover:text-blue-700"
                >
                  {line.displayName}
                </Link>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  {line.quality ? (
                    <CartMetaPill className="bg-blue-50 text-blue-700">
                      {line.quality}
                    </CartMetaPill>
                  ) : null}
                  <CartMetaPill className="bg-slate-100 font-mono text-slate-600">
                    {line.sku}
                  </CartMetaPill>
                  <CartMetaPill className="bg-slate-100 text-slate-700">
                    MOQ {line.moq}
                  </CartMetaPill>
                  <FulfillmentPill line={line} locale={locale} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                <input
                  aria-label="Quantity"
                  className={cn(
                    "h-10 w-24 rounded-lg border px-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100",
                    line.errors.length > 0 ? "border-rose-300" : "border-slate-300",
                  )}
                  min={line.moq}
                  type="number"
                  value={line.quantity}
                  onChange={(event) =>
                    updateQuantity(line.sku, Number.parseInt(event.target.value, 10) || 1)
                  }
                />
                <div className="min-w-28 text-right">
                  {quote?.isPriceVisible ? (
                    <>
                      <p className="text-xs text-slate-500">
                        {line.unitPrice !== null
                          ? formatMoney(line.unitPrice, locale)
                          : "-"}
                      </p>
                      <p className="font-bold text-slate-950">
                        {line.subtotal !== null
                          ? formatMoney(line.subtotal, locale)
                          : "-"}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-amber-700">
                      {locale === "it" ? "Login per prezzo" : "登录查看价格"}
                    </p>
                  )}
                </div>
                <button
                  aria-label="Remove"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600"
                  type="button"
                  onClick={() => removeItem(line.sku)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Riepilogo" : "订单摘要"}
        </h2>
        {quote?.isPriceVisible ? (
          <dl className="mt-5 space-y-3 text-sm">
            <SummaryRow label={locale === "it" ? "Subtotal" : "小计"} value={formatMoney(quote.subtotal, locale)} />
            <SummaryRow label="VAT 22%" value={formatMoney(quote.vat, locale)} />
            <SummaryRow
              label={locale === "it" ? "Totale" : "合计"}
              value={formatMoney(quote.total, locale)}
              strong
            />
          </dl>
        ) : (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
            {locale === "it"
              ? "I prezzi vengono mostrati dopo il login."
              : "登录后会按账户类型显示最终价格。"}
          </div>
        )}

        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          type="button"
          disabled={!canCheckout || isCheckingOut}
          onClick={checkout}
        >
          {isCheckingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : null}
          {locale === "it" ? "Vai al checkout" : "去结账"}
        </button>
        <Link
          href={productsHref}
          className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-900 hover:border-blue-300 hover:text-blue-700"
        >
          {locale === "it" ? "Continua acquisti" : "继续采购"}
        </Link>
      </aside>
    </div>
  );
}

function FulfillmentPill({
  line,
  locale,
}: Readonly<{ line: QuoteLine; locale: Locale }>) {
  if (line.fulfillmentType === "unknown") {
    return (
      <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">
        {locale === "it" ? "Verifica dopo login" : "登录后校验库存"}
      </span>
    );
  }

  if (line.fulfillmentType === "stock") {
    return (
      <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
        {locale === "it" ? "Stock" : "现货"}
      </span>
    );
  }

  if (line.fulfillmentType === "preorder") {
    return (
      <span className="rounded-md bg-violet-50 px-2 py-1 font-semibold text-violet-700">
        {locale === "it"
          ? `Preordine ${line.preorderLeadTimeMinDays}-${line.preorderLeadTimeMaxDays} gg`
          : `预购 ${line.preorderLeadTimeMinDays}-${line.preorderLeadTimeMaxDays} 天`}
      </span>
    );
  }

  return (
    <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">
      {locale === "it" ? "Stock + preorder" : "现货 + 预购"}
    </span>
  );
}

function CartMetaPill({
  children,
  className,
}: Readonly<{ children: ReactNode; className?: string }>) {
  return (
    <span className={cn("rounded-md px-2 py-1 font-semibold", className)}>
      {children}
    </span>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: Readonly<{ label: string; value: string; strong?: boolean }>) {
  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        strong && "border-t border-slate-200 pt-3 text-base font-bold text-slate-950",
      )}
    >
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function ErrorBox({ message }: Readonly<{ message: string }>) {
  return (
    <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
      <AlertTriangle className="mr-2 inline h-4 w-4" />
      {message}
    </div>
  );
}
