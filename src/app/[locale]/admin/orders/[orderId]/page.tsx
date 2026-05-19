import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import { getAdminOrderById } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

const orderStatuses = [
  "draft",
  "checkout_created",
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
  "refunded",
];

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; orderId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale, orderId: rawOrderId } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const orderId = decodeURIComponent(rawOrderId);
  const auth = await getAuthContext();
  const order = !auth.configured || auth.isAdmin ? await getAdminOrderById(orderId) : null;

  if (!order) {
    notFound();
  }

  const returnTo = localizePath(locale, `/admin/orders/${order.id}`);
  const stockQty = order.items.reduce((sum, item) => sum + (item.stockQty ?? 0), 0);
  const preorderQty = order.items.reduce(
    (sum, item) => sum + (item.preorderQty ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Ordine" : "订单"}
        </Badge>
        <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <h1 className="break-all font-mono text-2xl font-bold text-slate-950">
              {order.id}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Dettaglio operativo con pagamento, cliente, righe SKU e fulfilment stock/preorder."
                : "后台订单处理详情，包含付款、客户、SKU 明细和现货/预购履约。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={localizePath(locale, "/admin/orders")} variant="secondary">
              {locale === "it" ? "Torna ordini" : "返回订单"}
            </ButtonLink>
            <ButtonLink href={localizePath(locale, "/admin/inventory")} variant="secondary">
              {locale === "it" ? "Inventario" : "库存"}
            </ButtonLink>
          </div>
        </div>
        <Feedback saved={valueOf(query.saved)} error={valueOf(query.error)} locale={locale} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={locale === "it" ? "Stato" : "状态"} value={order.status} />
        <MetricCard
          label={locale === "it" ? "Pagamento" : "付款"}
          value={order.paymentMethod}
        />
        <MetricCard label={locale === "it" ? "Totale" : "总额"} value={formatMoney(order.total, locale)} />
        <MetricCard label={locale === "it" ? "Stock" : "现货履约"} value={String(stockQty)} />
        <MetricCard
          label={locale === "it" ? "Preorder" : "预购履约"}
          value={String(preorderQty)}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Cliente e fattura" : "客户与发票"}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <InfoRow label="Company" value={order.companyName || "-"} />
            <InfoRow label="Customer" value={order.customerName || "-"} />
            <InfoRow label="Email" value={order.email || "-"} />
            <InfoRow label="VAT" value={order.vatNumber || "-"} />
            <InfoRow label="Fiscal code" value={order.fiscalCode || "-"} />
            <InfoRow label="SDI / PEC" value={[order.sdi, order.pec].filter(Boolean).join(" / ") || "-"} />
            <InfoRow label="Shipping" value={order.shippingAddress || "-"} />
          </dl>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Aggiorna stato" : "更新状态"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {locale === "it"
              ? "Lo stato si aggiorna su Supabase quando la service role key e configurata."
              : "配置 service role key 后，这里会直接更新 Supabase 真实订单状态。"}
          </p>
          <div className="mt-4">
            <StatusSelectForm
              action="/api/admin/orders/status"
              currentStatus={order.status}
              extraFields={<input type="hidden" name="returnTo" value={returnTo} />}
              id={order.id}
              locale={locale}
              statuses={orderStatuses}
            />
          </div>
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              {locale === "it" ? "Subtotal" : "小计"}:{" "}
              <strong>{formatMoney(order.subtotal ?? 0, locale)}</strong>
            </p>
            <p className="mt-2">
              IVA/VAT: <strong>{formatMoney(order.vat ?? 0, locale)}</strong>
            </p>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Righe e fulfilment" : "商品与履约"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {new Date(order.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Preorder</th>
                <th className="px-4 py-3">Line total</th>
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
                  <td className="px-4 py-3">{item.stockQty ?? 0}</td>
                  <td className="px-4 py-3">
                    <span>{item.preorderQty ?? 0}</span>
                    {item.preorderQty &&
                    item.preorderLeadTimeMinDays &&
                    item.preorderLeadTimeMaxDays ? (
                      <span className="ml-2 text-xs text-slate-500">
                        {item.preorderLeadTimeMinDays}-{item.preorderLeadTimeMaxDays}d
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-950">
                    {formatMoney(item.unitPrice * item.quantity, locale)}
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

function InfoRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="grid gap-1 rounded-lg bg-slate-50 p-3 sm:grid-cols-[120px_1fr]">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="break-words text-slate-900">{value}</dd>
    </div>
  );
}

function Feedback({
  saved,
  error,
  locale,
}: Readonly<{ saved?: string; error?: string; locale: Locale }>) {
  if (error) {
    return (
      <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {decodeURIComponent(error)}
      </div>
    );
  }

  if (!saved) return null;

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      {saved === "demo"
        ? locale === "it"
          ? "Demo: stato ricevuto, configura Supabase per salvare."
          : "演示：已收到状态，配置 Supabase 后可真实保存。"
        : locale === "it"
          ? "Stato aggiornato."
          : "状态已更新。"}
    </div>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
