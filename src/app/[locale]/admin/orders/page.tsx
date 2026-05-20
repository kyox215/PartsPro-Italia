import {
  Banknote,
  CreditCard,
  PackageCheck,
  ReceiptText,
  TimerReset,
} from "lucide-react";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminTabs,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { getAdminOrderRows } from "@/lib/admin-operations";
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

  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["pending_payment", locale === "it" ? "Da pagare" : "待付款"],
    ["paid", locale === "it" ? "Pagati" : "已付款"],
    ["preorder", locale === "it" ? "Preorder" : "预购待分配"],
    ["processing", locale === "it" ? "In lavorazione" : "处理中"],
    ["shipped", locale === "it" ? "Spediti" : "已发货"],
    ["completed", locale === "it" ? "Completati" : "已完成"],
    ["cancelled", locale === "it" ? "Annullati" : "已取消"],
  ].map(([value, label]) => ({
    href: `${localizePath(locale, "/admin/orders")}${value === "all" ? "" : `?filter=${value}`}`,
    label,
    active: filter === value,
    count: filterAdminOrders(orders, value).length,
  }));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Income components" : "收入与履约"}
        title={locale === "it" ? "Gestione ordini" : "订单管理"}
        description={
          locale === "it"
            ? "Controlla pagamento, stato ordine e righe SKU. Le azioni restano collegate agli endpoint admin esistenti."
            : "查看付款、订单状态和 SKU 明细。操作仍连接现有后台接口。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {locale === "it" ? "Torna admin" : "返回后台"}
          </AdminButtonLink>
        }
      />

      <SystemNotice configured={auth.configured} isAdmin={auth.isAdmin} locale={locale} />
      <Feedback saved={saved} error={error} locale={locale} />

      <AdminWorkspaceGrid
        rail={
          <AdminActionRail
            title={locale === "it" ? "Stato ordini" : "订单状态"}
            description={locale === "it" ? "Pagamenti e lock" : "付款、锁库、预购"}
          >
            <section className="grid gap-2">
              <AdminMetricCard
                icon={Banknote}
                label={locale === "it" ? "Contanti" : "待收现金"}
                value={orders.filter((order) => order.paymentStatus === "pending_cash").length}
                tone="amber"
              />
              <AdminMetricCard
                icon={ReceiptText}
                label={locale === "it" ? "Bonifici" : "待确认转账"}
                value={
                  orders.filter((order) => order.paymentStatus === "pending_bank_transfer")
                    .length
                }
                tone="blue"
              />
              <AdminMetricCard
                icon={CreditCard}
                label={locale === "it" ? "Stripe pending" : "Stripe 待支付"}
                value={orders.filter((order) => order.paymentStatus === "pending_card").length}
                tone="violet"
              />
              <AdminMetricCard
                icon={PackageCheck}
                label={locale === "it" ? "Preorder" : "待分配预购"}
                value={
                  orders.filter((order) => order.fulfillmentStatus === "awaiting_preorder")
                    .length
                }
                tone="green"
              />
              <AdminMetricCard
                icon={TimerReset}
                label={locale === "it" ? "Lock in scadenza" : "即将过期锁库"}
                value={orders.filter(isReservationExpiringSoon).length}
                tone="red"
              />
            </section>
            <AdminPanel title={locale === "it" ? "Filtri rapidi" : "快捷筛选"} contentClassName="grid gap-2 p-2">
              {filterItems.slice(0, 5).map((item) => (
                <AdminButtonLink key={item.href} href={item.href} variant={item.active ? "primary" : "secondary"}>
                  {item.label} ({item.count})
                </AdminButtonLink>
              ))}
            </AdminPanel>
          </AdminActionRail>
        }
      >
        <AdminTabs items={filterItems} />

        <AdminPanel
          title={locale === "it" ? "Ordini" : "订单列表"}
          description={
            locale === "it"
              ? "Tabella operativa compatta; su mobile resta in schede."
              : "紧凑运营表；手机仍为卡片。"
          }
        >
        {visibleOrders.length ? (
          <>
            <div className="hidden lg:block">
              <AdminDataTable minWidth={980}>
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-stone-400">
                    <tr className="border-b border-black/5">
                      <th className="px-2.5 py-2">Order</th>
                      <th className="px-2.5 py-2">Customer</th>
                      <th className="px-2.5 py-2">Items</th>
                      <th className="px-2.5 py-2">Payment</th>
                      <th className="px-2.5 py-2">Total</th>
                      <th className="px-2.5 py-2">Status</th>
                      <th className="px-2.5 py-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {visibleOrders.map((order) => (
                      <tr key={order.id} className="align-top hover:bg-stone-50">
                        <td className="px-2.5 py-2.5">
                          <p className="font-mono text-xs font-black text-stone-900">
                            {order.id}
                          </p>
                          <p className="mt-1 text-xs font-medium text-stone-500">
                            {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-2.5 py-2.5">
                          <p className="font-black text-stone-950">
                            {order.companyName || order.customerName || "-"}
                          </p>
                          <p className="mt-1 max-w-[220px] truncate text-xs font-medium text-stone-500">
                            {order.email}
                          </p>
                        </td>
                        <td className="px-2.5 py-2.5">
                          <ul className="space-y-1 text-xs font-semibold text-stone-600">
                            {order.items.map((item) => (
                              <li key={`${order.id}-${item.sku}`}>
                                {item.sku} x {item.quantity}
                                {item.fulfillmentType ? (
                                  <span className="ml-2 text-stone-400">
                                    {item.fulfillmentType}
                                    {item.preorderQty ? ` / preorder ${item.preorderQty}` : ""}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-2.5 py-2.5 text-stone-700">
                          <p className="font-black">{order.paymentMethod}</p>
                          <div className="mt-2">
                            <StatusPill status={order.paymentStatus ?? "-"} />
                          </div>
                        </td>
                        <td className="px-2.5 py-2.5 font-black text-stone-950">
                          {formatMoney(order.total, locale)}
                        </td>
                        <td className="px-2.5 py-2.5">
                          <StatusSelectForm
                            action="/api/admin/orders/status"
                            currentStatus={order.status}
                            id={order.id}
                            locale={locale}
                            statuses={orderStatuses}
                          />
                          {order.fulfillmentStatus ? (
                            <p className="mt-2 text-xs font-black text-stone-500">
                              {order.fulfillmentStatus}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-2.5 py-2.5">
                          <AdminButtonLink
                            href={localizePath(locale, `/admin/orders/${order.id}`)}
                            variant="secondary"
                          >
                            {locale === "it" ? "Apri" : "查看"}
                          </AdminButtonLink>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </AdminDataTable>
            </div>

            <div className="grid gap-3 lg:hidden">
              {visibleOrders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-lg border border-black/5 bg-stone-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-black text-stone-900">
                        {order.id}
                      </p>
                      <p className="mt-1 truncate text-sm font-black text-stone-950">
                        {order.companyName || order.customerName || "-"}
                      </p>
                      <p className="mt-1 truncate text-xs font-medium text-stone-500">
                        {order.email}
                      </p>
                    </div>
                    <StatusPill status={order.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
                    <StatusPill status={order.paymentStatus ?? "-"} />
                    <span>{formatMoney(order.total, locale)}</span>
                  </div>
                  <div className="mt-4">
                    <StatusSelectForm
                      action="/api/admin/orders/status"
                      currentStatus={order.status}
                      id={order.id}
                      locale={locale}
                      statuses={orderStatuses}
                    />
                  </div>
                  <div className="mt-3">
                    <AdminButtonLink
                      href={localizePath(locale, `/admin/orders/${order.id}`)}
                      variant="secondary"
                    >
                      {locale === "it" ? "Apri" : "查看"}
                    </AdminButtonLink>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <AdminEmptyState
            icon={ReceiptText}
            title={locale === "it" ? "Nessun ordine trovato" : "没有匹配订单"}
            description={
              locale === "it"
                ? "Modifica filtro o attendi nuovi checkout."
                : "可调整筛选，或等待新的结账订单。"
            }
          />
        )}
        </AdminPanel>
      </AdminWorkspaceGrid>
    </div>
  );
}

function SystemNotice({
  configured,
  isAdmin,
  locale,
}: Readonly<{ configured: boolean; isAdmin: boolean; locale: Locale }>) {
  if (!configured) {
    return (
      <AdminNotice tone="warning">
        {locale === "it"
          ? "Demo mode: Supabase non configurato, ordini demo."
          : "演示模式：Supabase 未配置，显示 demo 订单。"}
      </AdminNotice>
    );
  }

  if (!isAdmin) {
    return (
      <AdminNotice tone="danger">
        {locale === "it" ? "Accesso admin richiesto." : "需要管理员权限。"}
      </AdminNotice>
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
    return <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice>;
  }

  if (!saved) return null;

  return (
    <AdminNotice tone="success">
      {saved === "demo"
        ? locale === "it"
          ? "Demo: stato ricevuto, configura Supabase per salvare."
          : "演示：已收到状态，配置 Supabase 后可真实保存。"
        : locale === "it"
          ? "Stato aggiornato."
          : "状态已更新。"}
    </AdminNotice>
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
