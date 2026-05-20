import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import { getAuthContext } from "@/lib/auth";
import { getAdminOrderRows } from "@/lib/admin-operations";
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

export default async function AdminOrdersPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const orders = !auth.configured || auth.isAdmin ? await getAdminOrderRows() : [];
  const filter = valueOf(query.filter) ?? "all";
  const visibleOrders = filterAdminOrders(orders, filter);
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Ordini" : "订单"}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Gestione ordini" : "订单管理"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Controlla pagamento, stato ordine e righe SKU. Con Supabase configurato puoi aggiornare lo stato reale."
            : "查看付款、订单状态和 SKU 明细。配置 Supabase 后可更新真实订单状态。"}
        </p>
        <AdminNotice configured={auth.configured} isAdmin={auth.isAdmin} locale={locale} />
        <Feedback saved={saved} error={error} locale={locale} />
        <div className="mt-5">
          <ButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {locale === "it" ? "Torna admin" : "返回后台"}
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <OrderMetric
          label={locale === "it" ? "Contanti da incassare" : "待收现金"}
          value={orders.filter((order) => order.paymentStatus === "pending_cash").length}
        />
        <OrderMetric
          label={locale === "it" ? "Bonifici da confermare" : "待确认转账"}
          value={
            orders.filter((order) => order.paymentStatus === "pending_bank_transfer")
              .length
          }
        />
        <OrderMetric
          label={locale === "it" ? "Stripe pending" : "Stripe 待支付"}
          value={orders.filter((order) => order.paymentStatus === "pending_card").length}
        />
        <OrderMetric
          label={locale === "it" ? "Preorder da allocare" : "待分配预购"}
          value={
            orders.filter((order) => order.fulfillmentStatus === "awaiting_preorder")
              .length
          }
        />
        <OrderMetric
          label={locale === "it" ? "Lock in scadenza" : "即将过期锁库"}
          value={orders.filter(isReservationExpiringSoon).length}
        />
      </section>

      <nav className="flex flex-wrap gap-2">
        {[
          ["all", locale === "it" ? "Tutti" : "全部"],
          ["pending_payment", locale === "it" ? "Da pagare" : "待付款"],
          ["paid", locale === "it" ? "Pagati" : "已付款"],
          ["preorder", locale === "it" ? "Preorder" : "预购待分配"],
          ["processing", locale === "it" ? "In lavorazione" : "处理中"],
          ["shipped", locale === "it" ? "Spediti" : "已发货"],
          ["completed", locale === "it" ? "Completati" : "已完成"],
          ["cancelled", locale === "it" ? "Annullati" : "已取消"],
        ].map(([value, label]) => (
          <ButtonLink
            key={value}
            href={`${localizePath(locale, "/admin/orders")}${value === "all" ? "" : `?filter=${value}`}`}
            variant={filter === value ? "dark" : "secondary"}
            className="h-9 px-3 text-xs"
          >
            {label}
          </ButtonLink>
        ))}
      </nav>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {visibleOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-bold text-slate-900">
                      {order.id}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-950">
                      {order.companyName || order.customerName || "-"}
                    </p>
                    <p className="text-xs text-slate-500">{order.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="space-y-1 text-xs text-slate-600">
                      {order.items.map((item) => (
                        <li key={`${order.id}-${item.sku}`}>
                          {item.sku} x {item.quantity}
                          {item.fulfillmentType ? (
                            <span className="ml-2 text-xs text-slate-500">
                              {item.fulfillmentType}
                              {item.preorderQty ? ` / preorder ${item.preorderQty}` : ""}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <p className="font-semibold">{order.paymentMethod}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {order.paymentStatus ?? "-"}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-950">
                    {formatMoney(order.total, locale)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelectForm
                      action="/api/admin/orders/status"
                      currentStatus={order.status}
                      id={order.id}
                      locale={locale}
                      statuses={orderStatuses}
                    />
                    {order.fulfillmentStatus ? (
                      <p className="mt-2 text-xs font-semibold text-slate-500">
                        {order.fulfillmentStatus}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <ButtonLink
                      href={localizePath(locale, `/admin/orders/${order.id}`)}
                      variant="secondary"
                      className="h-9 px-3 text-xs"
                    >
                      {locale === "it" ? "Apri" : "查看"}
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

function AdminNotice({
  configured,
  isAdmin,
  locale,
}: Readonly<{ configured: boolean; isAdmin: boolean; locale: Locale }>) {
  if (!configured) {
    return (
      <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
        {locale === "it"
          ? "Demo mode: Supabase non configurato, ordini demo."
          : "演示模式：Supabase 未配置，显示 demo 订单。"}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {locale === "it" ? "Accesso admin richiesto." : "需要管理员权限。"}
      </div>
    );
  }

  return null;
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

function OrderMetric({
  label,
  value,
}: Readonly<{ label: string; value: number }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
    </article>
  );
}

function filterAdminOrders(
  orders: Awaited<ReturnType<typeof getAdminOrderRows>>,
  filter: string,
) {
  if (filter === "pending_payment") {
    return orders.filter((order) =>
      ["pending_card", "pending_cash", "pending_bank_transfer"].includes(
        order.paymentStatus ?? "",
      ),
    );
  }
  if (filter === "paid") return orders.filter((order) => order.paymentStatus === "paid");
  if (filter === "preorder") {
    return orders.filter((order) => order.fulfillmentStatus === "awaiting_preorder");
  }
  if (filter === "processing") {
    return orders.filter((order) => order.status === "processing");
  }
  if (filter === "shipped") return orders.filter((order) => order.status === "shipped");
  if (filter === "completed") {
    return orders.filter((order) => order.status === "completed");
  }
  if (filter === "cancelled") {
    return orders.filter((order) => order.status === "cancelled");
  }
  return orders;
}

function isReservationExpiringSoon(
  order: Awaited<ReturnType<typeof getAdminOrderRows>>[number],
) {
  if (!order.reservationExpiresAt || order.releasedAt || order.paymentStatus === "paid") {
    return false;
  }
  return new Date(order.reservationExpiresAt).getTime() <= Date.now() + 6 * 60 * 60 * 1000;
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
