import { Activity, Search } from "lucide-react";
import { OrderSubnav } from "@/components/admin/order-subnav";
import {
  AdminButtonLink,
  AdminEmptyState,
  AdminInput,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  StatusPill,
} from "@/components/admin/admin-ui";
import { formatAdminStatus } from "@/lib/admin-display";
import { getAdminOrderRows, getAdminOrderTimelineRows, type AdminOrderTimelineRow } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";
import { shortInternalOrderId } from "@/lib/order-number";

export default async function AdminOrderTimelinePage({
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
  const [orders, events] = !auth.configured || auth.isAdmin
    ? await Promise.all([getAdminOrderRows(), getAdminOrderTimelineRows()])
    : [[], []];
  const q = valueOf(query.q) ?? "";
  const rows = filterTimeline(events, q);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Order audit" : "订单记录"}
        title={locale === "it" ? "Timeline ordini" : "订单时间线"}
        description={
          locale === "it"
            ? "Vista unica per pagamenti, lock, spedizioni, refund e notifiche."
            : "集中查看付款、锁库、发货、退款和客户通知等订单操作记录。"
        }
        actions={
          <AdminButtonLink href={localizePath(locale, "/admin/orders")} variant="secondary">
            {locale === "it" ? "Ordini" : "订单总览"}
          </AdminButtonLink>
        }
      />

      <SystemNotice configured={auth.configured} isAdmin={auth.isAdmin} locale={locale} />
      <OrderSubnav
        active="timeline"
        counts={{
          overview: orders.length,
          payments: orders.filter((order) => ["pending_cash", "pending_bank_transfer", "pending_card"].includes(order.paymentStatus ?? "")).length,
          fulfillment: orders.filter((order) => ["awaiting_preorder", "reserved", "picking"].includes(order.fulfillmentStatus ?? "")).length,
          timeline: events.length,
        }}
        locale={locale}
      />

      <AdminPanel title={locale === "it" ? "Cerca timeline" : "搜索时间线"}>
        <form
          action={localizePath(locale, "/admin/orders/timeline")}
          className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end"
          method="get"
        >
          <AdminInput
            defaultValue={q}
            label={locale === "it" ? "Cerca tutto" : "全局搜索"}
            name="q"
            placeholder={locale === "it" ? "Ordine, cliente, evento..." : "订单号、客户、事件标题、内容..."}
            required={false}
          />
          <button className="h-10 rounded-lg bg-stone-950 px-4 text-sm font-black text-white" type="submit">
            {locale === "it" ? "Cerca" : "搜索"}
          </button>
        </form>
      </AdminPanel>

      <AdminPanel
        title={locale === "it" ? "Eventi recenti" : "最近操作记录"}
        toolbar={<StatusPill status={`${rows.length} / ${events.length}`} tone="blue" />}
      >
        {rows.length ? (
          <ol className="grid gap-2">
            {rows.map((event) => (
              <TimelineEventCard key={event.id} event={event} locale={locale} />
            ))}
          </ol>
        ) : (
          <AdminEmptyState
            icon={Search}
            title={locale === "it" ? "Nessun evento trovato" : "没有匹配记录"}
            description={locale === "it" ? "Cambia ricerca." : "可调整搜索条件。"}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function TimelineEventCard({
  event,
  locale,
}: Readonly<{ event: AdminOrderTimelineRow; locale: Locale }>) {
  const status = formatAdminStatus("timelineEvent", event.eventType, locale);
  const orderLabel = event.orderNumber || shortInternalOrderId(event.orderId);
  const orderRoute = event.orderNumber || event.orderId;

  return (
    <li className="rounded-lg border border-black/5 bg-stone-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-stone-500 shadow-sm">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <a
              className="font-mono text-xs font-black text-stone-950 hover:text-blue-700"
              href={localizePath(locale, `/admin/orders/${encodeURIComponent(orderRoute)}`)}
            >
              {orderLabel}
            </a>
            <StatusPill status={status.label} tone={status.tone} />
          </div>
          <p className="mt-2 text-sm font-black text-stone-950">{event.title}</p>
          {event.body ? (
            <p className="mt-1 text-xs font-semibold leading-5 text-stone-600">{event.body}</p>
          ) : null}
          <p className="mt-2 truncate text-xs font-semibold text-stone-500">
            {[event.companyName, event.customerName, event.email].filter(Boolean).join(" / ") || "-"}
          </p>
        </div>
        <p className="shrink-0 text-xs font-semibold text-stone-400">
          {formatDateTime(event.createdAt, locale)}
        </p>
      </div>
    </li>
  );
}

function filterTimeline(events: AdminOrderTimelineRow[], search: string) {
  const query = normalizeSearch(search);
  if (!query) return events;
  return events.filter((event) =>
    normalizeSearch([
      event.orderId,
      event.orderNumber,
      event.companyName,
      event.customerName,
      event.email,
      event.eventType,
      event.title,
      event.body,
    ].filter(Boolean).join(" ")).includes(query),
  );
}

function SystemNotice({ configured, isAdmin, locale }: Readonly<{ configured: boolean; isAdmin: boolean; locale: Locale }>) {
  if (!configured) return <AdminNotice tone="warning">{locale === "it" ? "Demo mode." : "演示模式。"}</AdminNotice>;
  if (!isAdmin) return <AdminNotice tone="danger">{locale === "it" ? "Accesso admin richiesto." : "需要管理员权限。"}</AdminNotice>;
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
