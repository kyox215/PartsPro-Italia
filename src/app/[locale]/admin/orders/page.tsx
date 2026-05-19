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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.map((order) => (
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
                  <td className="px-4 py-3 text-slate-700">{order.paymentMethod}</td>
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

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
