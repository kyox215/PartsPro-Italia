import { Boxes, PackageCheck, Search, Truck } from "lucide-react";
import { AdminCsrfField } from "@/components/admin/admin-csrf-field";
import { OrderSubnav } from "@/components/admin/order-subnav";
import {
  AdminButtonLink,
  AdminEmptyState,
  AdminInput,
  AdminMetricCard,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminTabs,
  StatusPill,
} from "@/components/admin/admin-ui";
import { formatAdminStatus } from "@/lib/admin-display";
import { getAdminOrderRows, type AdminOrderRow } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { displayOrderNumber, orderRouteId } from "@/lib/order-number";
import { formatMoney } from "@/lib/pricing";

type FulfillmentQueue = "all" | "reserved" | "awaiting_preorder" | "picking" | "shipped" | "completed" | "cancelled";

export default async function AdminOrderFulfillmentPage({
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
  const queue = normalizeQueue(valueOf(query.queue));
  const q = valueOf(query.q) ?? "";
  const rows = filterFulfillmentOrders(orders, queue, q);
  const counts = getFulfillmentCounts(orders);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Fulfillment queue" : "履约队列"}
        title={locale === "it" ? "Preparazione e consegna" : "履约处理"}
        description={
          locale === "it"
            ? "Gestisci picking, preorder, spedizione, ritiro e completamento."
            : "集中处理备货、预购分配、发货、自提完成和订单完成。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/orders")} variant="secondary">
            {locale === "it" ? "Ordini" : "订单总览"}
          </AdminButtonLink>
        }
      />

      <SystemNotice configured={auth.configured} isAdmin={auth.isAdmin} locale={locale} />
      <Feedback query={query} locale={locale} />
      <OrderSubnav
        active="fulfillment"
        counts={{
          overview: orders.length,
          payments: orders.filter((order) => ["pending_cash", "pending_bank_transfer", "pending_card"].includes(order.paymentStatus ?? "")).length,
          fulfillment: counts.reserved + counts.awaiting_preorder + counts.picking,
          timeline: orders.reduce((sum, order) => sum + order.timelineEvents.length, 0),
        }}
        locale={locale}
      />

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={Boxes} label={locale === "it" ? "Da preparare" : "待备货"} value={counts.reserved} tone="blue" />
        <AdminMetricCard icon={PackageCheck} label={locale === "it" ? "Preorder" : "预购待分配"} value={counts.awaiting_preorder} tone="amber" />
        <AdminMetricCard icon={Truck} label={locale === "it" ? "In corso" : "备货中"} value={counts.picking} tone="violet" />
        <AdminMetricCard icon={Truck} label={locale === "it" ? "Spediti" : "已发货"} value={counts.shipped} tone="green" />
      </section>

      <AdminPanel title={locale === "it" ? "Cerca fulfillment" : "搜索履约"}>
        <form
          action={localizePath(locale, "/admin/orders/fulfillment")}
          className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end"
          method="get"
        >
          <input type="hidden" name="queue" value={queue === "all" ? "" : queue} />
          <AdminInput
            defaultValue={q}
            label={locale === "it" ? "Cerca tutto" : "全局搜索"}
            name="q"
            placeholder={locale === "it" ? "Ordine, cliente, email, SKU..." : "订单号、客户、邮箱、SKU、履约状态..."}
            required={false}
          />
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-black text-white" type="submit">
            {locale === "it" ? "Cerca" : "搜索"}
          </button>
        </form>
      </AdminPanel>

      <AdminTabs
        wrap
        items={[
          tab(locale, queue, q, "all", locale === "it" ? "Tutti" : "全部", orders.length),
          tab(locale, queue, q, "reserved", locale === "it" ? "Da preparare" : "待备货", counts.reserved),
          tab(locale, queue, q, "awaiting_preorder", locale === "it" ? "Preorder" : "预购待分配", counts.awaiting_preorder),
          tab(locale, queue, q, "picking", locale === "it" ? "Picking" : "备货中", counts.picking),
          tab(locale, queue, q, "shipped", locale === "it" ? "Spediti" : "已发货", counts.shipped),
          tab(locale, queue, q, "completed", locale === "it" ? "Completati" : "已完成", counts.completed),
          tab(locale, queue, q, "cancelled", locale === "it" ? "Annullati" : "已取消", counts.cancelled),
        ]}
      />

      <AdminPanel
        title={locale === "it" ? "Ordini da evadere" : "履约处理列表"}
        toolbar={<StatusPill status={`${rows.length} ${locale === "it" ? "ordini" : "订单"}`} tone="blue" />}
      >
        {rows.length ? (
          <div className="grid gap-2 xl:grid-cols-2">
            {rows.map((order) => (
              <FulfillmentOrderCard key={order.id} locale={locale} order={order} />
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={Search}
            title={locale === "it" ? "Nessun ordine in coda" : "暂无匹配履约订单"}
            description={locale === "it" ? "Cambia queue o ricerca." : "可切换队列或调整搜索。"}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function FulfillmentOrderCard({ order, locale }: Readonly<{ order: AdminOrderRow; locale: Locale }>) {
  const fulfillmentStatus = formatAdminStatus("fulfillment", order.fulfillmentStatus ?? "-", locale);
  const paymentStatus = formatAdminStatus("payment", order.paymentStatus ?? "-", locale);
  const returnTo = localizePath(locale, "/admin/orders/fulfillment");
  const stockQty = order.items.reduce((sum, item) => sum + (item.stockQty ?? 0), 0);
  const preorderQty = order.items.reduce((sum, item) => sum + (item.preorderQty ?? 0), 0);

  return (
    <article className="rounded-lg border border-black/5 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            className="font-mono text-xs font-black text-stone-950 hover:text-blue-700"
            href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)}
          >
            {displayOrderNumber(order, locale)}
          </a>
          <p className="mt-1 truncate text-sm font-black text-stone-950">
            {order.companyName || order.customerName || "-"}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-stone-500">{order.email}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-stone-950">{formatMoney(order.total, locale)}</p>
          <p className="mt-1 text-[11px] font-semibold text-stone-500">{formatDateTime(order.createdAt, locale)}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusPill status={paymentStatus.label} tone={paymentStatus.tone} />
        <StatusPill status={fulfillmentStatus.label} tone={fulfillmentStatus.tone} />
        <StatusPill status={`${locale === "it" ? "Stock" : "现货"} ${stockQty}`} tone="slate" />
        {preorderQty ? <StatusPill status={`${locale === "it" ? "Preorder" : "预购"} ${preorderQty}`} tone="amber" /> : null}
      </div>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
        <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="start_picking">
          {locale === "it" ? "Inizia picking" : "开始备货"}
        </ActionForm>
        {preorderQty > 0 ? (
          <ActionForm action="/api/admin/orders/allocate-preorders" id={order.id} locale={locale} returnTo={returnTo}>
            {locale === "it" ? "Alloca preorder" : "分配预购"}
          </ActionForm>
        ) : null}
        <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="mark_shipped">
          {locale === "it" ? "Segna spedito" : "标记发货"}
        </ActionForm>
        <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="mark_picked_up">
          {locale === "it" ? "Ritiro" : "已自提"}
        </ActionForm>
        <ActionForm action="/api/admin/orders/fulfillment" id={order.id} locale={locale} returnTo={returnTo} value="complete">
          {locale === "it" ? "Completa" : "完成订单"}
        </ActionForm>
        <AdminButtonLink href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)} variant="secondary">
          {locale === "it" ? "Dettagli" : "详情"}
        </AdminButtonLink>
      </div>
    </article>
  );
}

function ActionForm({
  action,
  id,
  locale,
  returnTo,
  value,
  children,
}: Readonly<{
  action: string;
  id: string;
  locale: Locale;
  returnTo: string;
  value?: string;
  children: React.ReactNode;
}>) {
  return (
    <form action={action} method="post">
      <AdminCsrfField />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      {value ? <input type="hidden" name="action" value={value} /> : null}
      <button className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
        {children}
      </button>
    </form>
  );
}

function filterFulfillmentOrders(orders: AdminOrderRow[], queue: FulfillmentQueue, search: string) {
  const query = normalizeSearch(search);
  return orders.filter((order) => {
    if (queue !== "all" && order.fulfillmentStatus !== queue) return false;
    if (!query) return true;
    return normalizeSearch([
      order.id,
      order.orderNumber,
      order.companyName,
      order.customerName,
      order.email,
      order.fulfillmentStatus,
      order.status,
      ...order.items.flatMap((item) => [item.sku, item.name, item.fulfillmentType]),
    ].filter(Boolean).join(" ")).includes(query);
  });
}

function getFulfillmentCounts(orders: AdminOrderRow[]) {
  return {
    reserved: orders.filter((order) => order.fulfillmentStatus === "reserved").length,
    awaiting_preorder: orders.filter((order) => order.fulfillmentStatus === "awaiting_preorder").length,
    picking: orders.filter((order) => order.fulfillmentStatus === "picking").length,
    shipped: orders.filter((order) => order.fulfillmentStatus === "shipped").length,
    completed: orders.filter((order) => order.fulfillmentStatus === "completed").length,
    cancelled: orders.filter((order) => order.fulfillmentStatus === "cancelled").length,
  };
}

function tab(locale: Locale, current: FulfillmentQueue, q: string, value: FulfillmentQueue, label: string, count: number) {
  const params = new URLSearchParams();
  if (value !== "all") params.set("queue", value);
  if (q) params.set("q", q);
  const query = params.toString();
  return {
    href: `${localizePath(locale, "/admin/orders/fulfillment")}${query ? `?${query}` : ""}`,
    label,
    count,
    active: current === value,
  };
}

function normalizeQueue(value?: string): FulfillmentQueue {
  return ["reserved", "awaiting_preorder", "picking", "shipped", "completed", "cancelled"].includes(value ?? "")
    ? (value as FulfillmentQueue)
    : "all";
}

function SystemNotice({ configured, isAdmin, locale }: Readonly<{ configured: boolean; isAdmin: boolean; locale: Locale }>) {
  if (!configured) return <AdminNotice tone="warning">{locale === "it" ? "Demo mode." : "演示模式。"}</AdminNotice>;
  if (!isAdmin) return <AdminNotice tone="danger">{locale === "it" ? "Accesso admin richiesto." : "需要管理员权限。"}</AdminNotice>;
  return null;
}

function Feedback({ query, locale }: Readonly<{ query: Record<string, string | string[] | undefined>; locale: Locale }>) {
  const error = valueOf(query.error);
  const saved = valueOf(query.saved);
  if (error) return <AdminNotice tone="danger">{decodeURIComponent(error)}</AdminNotice>;
  if (saved) return <AdminNotice tone="success">{locale === "it" ? "Fulfillment aggiornato." : "履约状态已更新。"}</AdminNotice>;
  return null;
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
