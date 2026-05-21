import { Search } from "lucide-react";
import Link from "next/link";
import { OrderSubnav } from "@/components/admin/order-subnav";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
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
import { displayOrderNumber, orderRouteId } from "@/lib/order-number";
import { formatMoney } from "@/lib/pricing";

const orderStatuses = [
  "pending_payment",
  "paid",
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
  const filterItems = [
    ["all", locale === "it" ? "Tutti" : "全部"],
    ["pending_payment", locale === "it" ? "Da pagare" : "待付款"],
    ["paid", locale === "it" ? "Pagati" : "已付款"],
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
      />

      <SystemNotice configured={auth.configured} isAdmin={auth.isAdmin} locale={locale} />
      <Feedback saved={saved} error={error} locale={locale} />
      <OrderSubnav
        active="overview"
        counts={{
          overview: orders.length,
          timeline: orders.reduce((sum, order) => sum + order.timelineEvents.length, 0),
        }}
        locale={locale}
      />

      <AdminPanel contentClassName="space-y-2 p-2">
        <form
          action={localizePath(locale, "/admin/orders")}
          className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_auto_auto] lg:items-center"
          method="get"
        >
          <input type="hidden" name="filter" value={filter === "all" ? "" : filter} />
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <span className="sr-only">{locale === "it" ? "Cerca ordini" : "搜索订单"}</span>
            <input
              className="h-10 w-full rounded-lg border border-black/10 bg-white pl-8 pr-3 text-sm font-semibold text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-stone-950 focus:ring-2 focus:ring-stone-950/10"
              defaultValue={q}
              name="q"
              placeholder={
                locale === "it"
                  ? "PP-260521-0001, cliente, email, SKU, tracking, pagamento..."
                  : "短订单号、客户、邮箱、公司、SKU、快递单号、付款方式、状态..."
              }
            />
          </label>
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-black text-white" type="submit">
            {locale === "it" ? "Cerca" : "搜索"}
          </button>
          {q ? (
            <AdminButtonLink
              href={buildOrdersHref(locale, { filter: filter === "all" ? "" : filter })}
              variant="secondary"
            >
              {locale === "it" ? "Reset" : "清空"}
            </AdminButtonLink>
          ) : null}
        </form>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
          <AdminTabs items={filterItems} wrap className="bg-stone-50 shadow-none" />
          <StatusPill status={`${visibleOrders.length} / ${orders.length}`} tone="blue" />
        </div>
      </AdminPanel>

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
                  <th className="px-2 py-1.5">{locale === "it" ? "Tracking" : "快递单号"}</th>
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
                  return (
                    <tr key={order.id} className="align-top hover:bg-stone-50">
                      <td className="w-[160px] px-2 py-2">
                        <Link
                          className="font-mono text-[11px] font-black text-stone-950 hover:text-blue-700"
                          href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)}
                        >
                          {displayOrderNumber(order, locale)}
                        </Link>
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
                        <OrderShipmentSummary order={order} locale={locale} />
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
            {displayOrderNumber(order, locale)}
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
        <OrderShipmentSummary order={order} locale={locale} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
        <LocalizedStatusPill kind="payment" locale={locale} value={order.paymentStatus ?? "-"} />
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

function OrderShipmentSummary({
  order,
  locale,
}: Readonly<{ order: AdminOrder; locale: Locale }>) {
  const trackingNumber = order.trackingNumber?.trim();
  const carrier = order.shippingCarrier?.trim();
  const trackingUrl = order.trackingUrl?.trim();
  const shippedAt = order.shippedAt ? formatDateTime(order.shippedAt, locale) : null;

  return (
    <div className="max-w-[360px] space-y-1">
      {trackingNumber || carrier || trackingUrl ? (
        <>
          <p className="truncate font-mono text-[11px] font-black text-stone-900" title={trackingNumber || trackingUrl || carrier}>
            {trackingNumber || (locale === "it" ? "Link tracking inserito" : "已填写跟踪链接")}
          </p>
          <p className="flex min-w-0 flex-wrap items-center gap-1 text-[10px] font-bold text-stone-500">
            {carrier ? (
              <span className="max-w-[120px] truncate rounded bg-stone-100 px-1.5 py-0.5">
                {carrier}
              </span>
            ) : null}
            {shippedAt ? <span>{shippedAt}</span> : null}
            {trackingUrl ? (
              <a
                className="font-black text-blue-700 hover:text-blue-900"
                href={trackingUrl}
                rel="noreferrer"
                target="_blank"
              >
                {locale === "it" ? "Apri" : "跟踪"}
              </a>
            ) : null}
          </p>
        </>
      ) : (
        <div className="inline-flex flex-col gap-1 rounded-lg bg-amber-50 px-2 py-1 ring-1 ring-amber-100">
          <span className="text-[11px] font-black text-amber-800">
            {locale === "it" ? "Tracking da inserire" : "待填写快递单号"}
          </span>
          <span className="text-[10px] font-bold text-amber-700">
            {locale === "it" ? "Compila nella scheda ordine" : "在订单详情里补录物流"}
          </span>
        </div>
      )}
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
        order.shippingCarrier,
        order.trackingNumber,
        order.trackingUrl,
        order.shipmentNote,
        order.customerNote,
        order.status,
        ...order.items.flatMap((item) => [item.sku, item.name]),
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
