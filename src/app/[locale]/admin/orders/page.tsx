import { Banknote, CreditCard, PackageCheck, ReceiptText, Search, TimerReset } from "lucide-react";
import Link from "next/link";
import { OrderSubnav } from "@/components/admin/order-subnav";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminTabs,
  StatusPill,
} from "@/components/admin/admin-ui";
import { formatAdminStatus, type AdminStatusKind } from "@/lib/admin-display";
import { getAdminOrderRows } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { displayOrderNumber, orderRouteId, shortInternalOrderId } from "@/lib/order-number";
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
  const q = valueOf(query.q) ?? "";
  const visibleOrders = filterAdminOrders(orders, filter, q);
  const orderCounts = getOrderFilterCounts(orders);
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);
  const orderStatusLabels = getStatusSelectLabels("order", orderStatuses, locale);
  const paymentQueueCount =
    orderCounts.pending_cash + orderCounts.pending_bank_transfer + orderCounts.pending_card;

  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["pending_payment", locale === "it" ? "Da pagare" : "待付款"],
    ["paid", locale === "it" ? "Pagati" : "已付款"],
    ["preorder", locale === "it" ? "Preorder" : "预购待分配"],
    ["processing", locale === "it" ? "In lavorazione" : "处理中"],
    ["shipped", locale === "it" ? "Spediti" : "已发货"],
    ["completed", locale === "it" ? "Completati" : "已完成"],
    ["refunded", locale === "it" ? "Rimborsati" : "已退款"],
    ["cancelled", locale === "it" ? "Annullati" : "已取消"],
  ].map(([value, label]) => ({
    href: buildOrdersHref(locale, { filter: value === "all" ? "" : value, q }),
    label,
    active: filter === value,
    count: orderCounts[value] ?? 0,
  }));

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Order workspace" : "订单工作台"}
        title={locale === "it" ? "Ordini e incassi" : "订单与付款管理"}
        description={
          locale === "it"
            ? "Cerca, filtra e apri l'ordine con il numero breve. UUID resta solo come ID interno."
            : "先搜索/筛选，再进入订单处理；页面显示短订单号，UUID 仅作为内部 ID。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/orders/payments")}>
            {locale === "it" ? "Pagamenti" : "处理付款"}
          </AdminButtonLink>
        }
      />

      <SystemNotice configured={auth.configured} isAdmin={auth.isAdmin} locale={locale} />
      <Feedback saved={saved} error={error} locale={locale} />
      <OrderSubnav
        active="overview"
        counts={{
          overview: orders.length,
          payments: paymentQueueCount,
          fulfillment: orderCounts.preorder + orderCounts.processing + orderCounts.shipped,
          timeline: orders.reduce((sum, order) => sum + order.timelineEvents.length, 0),
        }}
        locale={locale}
      />

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard icon={Banknote} label={locale === "it" ? "Contanti" : "待收现金"} value={orderCounts.pending_cash} tone="amber" />
        <AdminMetricCard icon={ReceiptText} label={locale === "it" ? "Bonifico" : "待确认转账"} value={orderCounts.pending_bank_transfer} tone="blue" />
        <AdminMetricCard icon={CreditCard} label={locale === "it" ? "Carta" : "Stripe 待支付"} value={orderCounts.pending_card} tone="violet" />
        <AdminMetricCard icon={PackageCheck} label={locale === "it" ? "Preorder" : "待分配预购"} value={orderCounts.preorder} tone="green" />
        <AdminMetricCard icon={TimerReset} label={locale === "it" ? "Lock scade" : "即将过期锁库"} value={orderCounts.expiring} tone="red" />
      </section>

      <AdminPanel
        title={locale === "it" ? "Cerca ordini" : "搜索订单"}
        toolbar={<StatusPill status={`${visibleOrders.length} / ${orders.length}`} tone="blue" />}
      >
        <form
          action={localizePath(locale, "/admin/orders")}
          className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end"
          method="get"
        >
          <input type="hidden" name="filter" value={filter === "all" ? "" : filter} />
          <AdminInput
            defaultValue={q}
            label={locale === "it" ? "Cerca tutto" : "全局搜索"}
            name="q"
            placeholder={
              locale === "it"
                ? "PP-260521-0001, cliente, email, SKU, pagamento..."
                : "短订单号、UUID、客户、邮箱、公司、SKU、付款方式、状态..."
            }
            required={false}
          />
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-black text-white" type="submit">
            {locale === "it" ? "Cerca" : "搜索"}
          </button>
        </form>
      </AdminPanel>

      <AdminTabs items={filterItems} wrap />

      <AdminPanel
        title={locale === "it" ? "Lista ordini" : "订单列表"}
        description={
          locale === "it"
            ? "Tabella compatta per desktop; le schede mobile usano gli stessi campi."
            : "桌面端紧凑表格；手机端使用同字段卡片。"
        }
      >
        {visibleOrders.length ? (
          <AdminDataTable
            minWidth={1040}
            mobileBreakpoint="lg"
            mobileCards={
              <div className="grid gap-2">
                {visibleOrders.map((order) => (
                  <MobileOrderCard key={order.id} locale={locale} order={order} />
                ))}
              </div>
            }
          >
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase text-stone-400">
                <tr className="border-b border-black/5">
                  <th className="px-2 py-1.5">{locale === "it" ? "Ordine" : "订单"}</th>
                  <th className="px-2 py-1.5">{locale === "it" ? "Cliente" : "客户"}</th>
                  <th className="px-2 py-1.5">{locale === "it" ? "Articoli" : "商品"}</th>
                  <th className="px-2 py-1.5">{locale === "it" ? "Pagamento" : "付款"}</th>
                  <th className="px-2 py-1.5">{locale === "it" ? "Importo" : "金额"}</th>
                  <th className="px-2 py-1.5">{locale === "it" ? "Stato" : "状态"}</th>
                  <th className="px-2 py-1.5">{locale === "it" ? "Apri" : "操作"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visibleOrders.map((order) => {
                  const paymentStatus = formatAdminStatus("payment", order.paymentStatus ?? "-", locale);
                  const paymentMethod = formatAdminStatus("paymentMethod", order.paymentMethod, locale);
                  const fulfillmentStatus = formatAdminStatus("fulfillment", order.fulfillmentStatus ?? "-", locale);

                  return (
                    <tr key={order.id} className="align-top hover:bg-stone-50">
                      <td className="w-[160px] px-2 py-2">
                        <Link
                          className="font-mono text-[11px] font-black text-stone-950 hover:text-blue-700"
                          href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)}
                          title={order.id}
                        >
                          {displayOrderNumber(order)}
                        </Link>
                        <p className="mt-0.5 font-mono text-[10px] font-semibold text-stone-400">
                          {shortInternalOrderId(order.id)}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-stone-500">
                          {formatDateTime(order.createdAt, locale)}
                        </p>
                      </td>
                      <td className="w-[190px] px-2 py-2">
                        <p className="truncate font-black text-stone-950">
                          {order.companyName || order.customerName || "-"}
                        </p>
                        <p className="mt-0.5 max-w-[180px] truncate text-[11px] font-medium text-stone-500">
                          {order.email}
                        </p>
                      </td>
                      <td className="px-2 py-2">
                        <OrderItemsSummary order={order} locale={locale} />
                      </td>
                      <td className="w-[150px] px-2 py-2 text-stone-700">
                        <p className="font-black">{paymentMethod.label}</p>
                        <div className="mt-1">
                          <StatusPill status={paymentStatus.label} tone={paymentStatus.tone} />
                        </div>
                      </td>
                      <td className="w-[110px] px-2 py-2 font-black text-stone-950">
                        {formatMoney(order.total, locale)}
                        {order.refundTotal ? (
                          <p className="mt-0.5 text-[11px] font-semibold text-rose-600">
                            - {formatMoney(order.refundTotal, locale)}
                          </p>
                        ) : null}
                      </td>
                      <td className="w-[210px] px-2 py-2">
                        <StatusSelectForm
                          action="/api/admin/orders/status"
                          currentStatus={order.status}
                          id={order.id}
                          locale={locale}
                          statusLabels={orderStatusLabels}
                          statuses={orderStatuses}
                          submitLabel={locale === "it" ? "Salva" : "保存"}
                        />
                        <div className="mt-1">
                          <StatusPill status={fulfillmentStatus.label} tone={fulfillmentStatus.tone} />
                        </div>
                      </td>
                      <td className="w-[74px] px-2 py-2">
                        <AdminButtonLink
                          href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)}
                          variant="secondary"
                        >
                          {locale === "it" ? "Apri" : "查看"}
                        </AdminButtonLink>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </AdminDataTable>
        ) : (
          <AdminEmptyState
            icon={Search}
            title={locale === "it" ? "Nessun ordine trovato" : "没有匹配订单"}
            description={
              locale === "it"
                ? "Modifica ricerca o filtro."
                : "可调整搜索或筛选条件。"
            }
          />
        )}
      </AdminPanel>
    </div>
  );
}

type AdminOrder = Awaited<ReturnType<typeof getAdminOrderRows>>[number];

function MobileOrderCard({ order, locale }: Readonly<{ order: AdminOrder; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-black/5 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-black text-stone-950">
            {displayOrderNumber(order)}
          </p>
          <p className="mt-1 truncate text-sm font-black text-stone-950">
            {order.companyName || order.customerName || "-"}
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-stone-500">
            {order.email}
          </p>
        </div>
        <LocalizedStatusPill kind="order" locale={locale} value={order.status} />
      </div>
      <div className="mt-3">
        <OrderItemsSummary order={order} locale={locale} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
        <LocalizedStatusPill kind="payment" locale={locale} value={order.paymentStatus ?? "-"} />
        <LocalizedStatusPill kind="fulfillment" locale={locale} value={order.fulfillmentStatus ?? "-"} />
        <span>{formatMoney(order.total, locale)}</span>
      </div>
      <div className="mt-3">
        <AdminButtonLink
          href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)}
          variant="secondary"
        >
          {locale === "it" ? "Apri ordine" : "查看订单"}
        </AdminButtonLink>
      </div>
    </article>
  );
}

function OrderItemsSummary({
  order,
  locale,
}: Readonly<{ order: AdminOrder; locale: Locale }>) {
  const visibleItems = order.items.slice(0, 2);
  const hiddenCount = Math.max(order.items.length - visibleItems.length, 0);

  return (
    <div className="max-w-[360px] space-y-0.5">
      {visibleItems.map((item) => {
        const fulfillmentType = formatAdminStatus(
          "fulfillmentType",
          item.fulfillmentType ?? "-",
          locale,
        );
        return (
          <p
            key={`${order.id}-${item.sku}`}
            className="truncate text-[11px] font-semibold text-stone-600"
            title={`${item.sku} x ${item.quantity}`}
          >
            <span className="font-mono font-black text-stone-800">{item.sku}</span>{" "}
            <span>x {item.quantity}</span>
            <span className="mx-1 text-stone-300">·</span>
            <span>{fulfillmentType.label}</span>
            {item.preorderQty ? (
              <span className="text-amber-700">
                {" "}
                {locale === "it" ? "preorder" : "预购"} {item.preorderQty}
              </span>
            ) : null}
          </p>
        );
      })}
      {hiddenCount > 0 ? (
        <p className="text-[11px] font-black text-stone-400">
          +{hiddenCount} {locale === "it" ? "articoli" : "件商品"}
        </p>
      ) : null}
    </div>
  );
}

function LocalizedStatusPill({
  kind,
  value,
  locale,
}: Readonly<{ kind: AdminStatusKind; value: string | null | undefined; locale: Locale }>) {
  const status = formatAdminStatus(kind, value, locale);
  return <StatusPill status={status.label} tone={status.tone} />;
}

function getStatusSelectLabels(
  kind: AdminStatusKind,
  values: string[],
  locale: Locale,
) {
  return Object.fromEntries(
    values.map((value) => [value, formatAdminStatus(kind, value, locale).label]),
  );
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  search: string,
) {
  const query = normalizeSearch(search);
  return orders.filter((order) => {
    if (filter === "pending_payment") {
      if (!["pending_card", "pending_cash", "pending_bank_transfer"].includes(order.paymentStatus ?? "")) return false;
    } else if (filter === "paid") {
      if (order.paymentStatus !== "paid") return false;
    } else if (filter === "preorder") {
      if (order.fulfillmentStatus !== "awaiting_preorder") return false;
    } else if (filter === "processing") {
      if (order.status !== "processing") return false;
    } else if (filter === "shipped") {
      if (order.status !== "shipped") return false;
    } else if (filter === "completed") {
      if (order.status !== "completed") return false;
    } else if (filter === "refunded") {
      if (!(order.paymentStatus === "refunded" || (order.refundTotal ?? 0) > 0)) return false;
    } else if (filter === "cancelled") {
      if (order.status !== "cancelled") return false;
    }

    if (!query) return true;

    const haystack = normalizeSearch(
      [
        order.id,
        order.orderNumber,
        order.companyName,
        order.customerName,
        order.email,
        order.paymentMethod,
        order.paymentStatus,
        order.fulfillmentStatus,
        order.status,
        ...order.items.flatMap((item) => [item.sku, item.name, item.fulfillmentType]),
      ]
        .filter(Boolean)
        .join(" "),
    );
    return haystack.includes(query);
  });
}

function getOrderFilterCounts(orders: Awaited<ReturnType<typeof getAdminOrderRows>>) {
  const counts: Record<string, number> = {
    all: orders.length,
    pending_payment: 0,
    paid: 0,
    preorder: 0,
    processing: 0,
    shipped: 0,
    completed: 0,
    refunded: 0,
    cancelled: 0,
    pending_cash: 0,
    pending_bank_transfer: 0,
    pending_card: 0,
    expiring: 0,
  };

  orders.forEach((order) => {
    if (
      ["pending_card", "pending_cash", "pending_bank_transfer"].includes(
        order.paymentStatus ?? "",
      )
    ) {
      counts.pending_payment += 1;
    }
    if (order.paymentStatus === "paid") counts.paid += 1;
    if (order.fulfillmentStatus === "awaiting_preorder") counts.preorder += 1;
    if (order.status === "processing") counts.processing += 1;
    if (order.status === "shipped") counts.shipped += 1;
    if (order.status === "completed") counts.completed += 1;
    if (order.paymentStatus === "refunded" || (order.refundTotal ?? 0) > 0) {
      counts.refunded += 1;
    }
    if (order.status === "cancelled") counts.cancelled += 1;
    if (order.paymentStatus === "pending_cash") counts.pending_cash += 1;
    if (order.paymentStatus === "pending_bank_transfer") counts.pending_bank_transfer += 1;
    if (order.paymentStatus === "pending_card") counts.pending_card += 1;
    if (isReservationExpiringSoon(order)) counts.expiring += 1;
  });

  return counts;
}

function isReservationExpiringSoon(order: AdminOrder) {
  if (!order.reservationExpiresAt || order.releasedAt || order.paymentStatus === "paid") {
    return false;
  }
  return new Date(order.reservationExpiresAt).getTime() <= Date.now() + 6 * 60 * 60 * 1000;
}

function buildOrdersHref(locale: Locale, state: { filter?: string; q?: string }) {
  const params = new URLSearchParams();
  if (state.filter) params.set("filter", state.filter);
  if (state.q) params.set("q", state.q);
  const query = params.toString();
  return `${localizePath(locale, "/admin/orders")}${query ? `?${query}` : ""}`;
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
