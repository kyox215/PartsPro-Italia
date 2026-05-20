import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccountOrderById } from "@/lib/account-activity";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AccountOrderDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; orderId: string }> }>) {
  const { locale: rawLocale, orderId: rawOrderId } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const orderId = decodeURIComponent(rawOrderId);
  const auth = await getAuthContext();
  const order = await getAccountOrderById(auth, orderId);

  if (!order) {
    notFound();
  }

  const stockQty = order.items.reduce((sum, item) => sum + (item.stockQty ?? 0), 0);
  const preorderQty = order.items.reduce(
    (sum, item) => sum + (item.preorderQty ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Dettaglio ordine" : "订单详情"}
        </Badge>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h1 className="break-all font-mono text-2xl font-bold text-slate-950">
              {order.id}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Riepilogo ordine, pagamento, righe SKU e quantita divise tra stock e preorder."
                : "查看订单付款、SKU 明细，以及现货/预购履约拆分。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={localizePath(locale, "/account/orders")} variant="secondary">
              {locale === "it" ? "Torna ordini" : "返回订单"}
            </ButtonLink>
            <ButtonLink href={localizePath(locale, "/products")} variant="secondary">
              {locale === "it" ? "Riordina" : "继续采购"}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={locale === "it" ? "Stato" : "订单状态"} value={order.status} />
        <MetricCard
          label={locale === "it" ? "Pagamento" : "付款方式"}
          value={`${order.paymentMethod} / ${order.paymentStatus ?? "-"}`}
        />
        <MetricCard label={locale === "it" ? "Totale" : "订单总额"} value={formatMoney(order.total, locale)} />
        <MetricCard
          label={locale === "it" ? "Fulfilment" : "履约拆分"}
          value={`${stockQty} stock / ${preorderQty} preorder / ${order.fulfillmentStatus ?? "-"}`}
        />
      </section>

      {order.reservationExpiresAt && order.paymentStatus !== "paid" ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {locale === "it" ? "Stock riservato fino a" : "库存锁定到"}{" "}
          <strong>
            {new Date(order.reservationExpiresAt).toLocaleString(
              locale === "it" ? "it-IT" : "zh-CN",
            )}
          </strong>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Righe ordine" : "订单商品"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {new Date(order.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Fulfillment</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">RMA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items.map((item) => (
                <tr key={`${order.id}-${item.sku}`}>
                  <td className="px-4 py-3 font-mono text-xs font-bold text-slate-900">
                    {item.sku}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.name}</td>
                  <td className="px-4 py-3 font-semibold text-slate-950">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="border-slate-300 bg-slate-100 text-slate-800">
                        {item.fulfillmentType ?? "stock"}
                      </Badge>
                      {item.stockQty ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          stock {item.stockQty}
                        </Badge>
                      ) : null}
                      {item.preorderQty ? (
                        <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                          preorder {item.preorderQty}
                          {item.preorderLeadTimeMinDays && item.preorderLeadTimeMaxDays
                            ? ` / ${item.preorderLeadTimeMinDays}-${item.preorderLeadTimeMaxDays}d`
                            : ""}
                        </Badge>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-950">
                    {formatMoney(item.unitPrice * item.quantity, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <ButtonLink
                      href={`${localizePath(locale, "/rma")}?orderNumber=${encodeURIComponent(order.id)}&sku=${encodeURIComponent(item.sku)}&quantity=${item.quantity}`}
                      variant="secondary"
                      className="h-9 px-3 text-xs"
                    >
                      {locale === "it" ? "Apri RMA" : "申请售后"}
                    </ButtonLink>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-bold text-slate-950">{value}</p>
    </article>
  );
}
