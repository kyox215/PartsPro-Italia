import {
  Banknote,
  CreditCard,
  type LucideIcon,
  PackageCheck,
  ReceiptText,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import {
  AdminActionRail,
  AdminButtonLink,
  AdminDataTable,
  AdminEmptyState,
  AdminNotice,
  AdminPageHeader,
  AdminPanel,
  AdminTabs,
  AdminWorkspaceGrid,
  StatusPill,
} from "@/components/admin/admin-ui";
import { formatAdminStatus, type AdminStatusKind, type AdminTone } from "@/lib/admin-display";
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
  const orderCounts = getOrderFilterCounts(orders);
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);
  const orderStatusLabels = getStatusSelectLabels("order", orderStatuses, locale);

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
    href: `${localizePath(locale, "/admin/orders")}${value === "all" ? "" : `?filter=${value}`}`,
    label,
    active: filter === value,
    count: orderCounts[value] ?? 0,
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
        className="xl:!grid-cols-[minmax(0,1fr)_244px] 2xl:!grid-cols-[minmax(0,1fr)_260px]"
        rail={
          <AdminActionRail
            title={locale === "it" ? "Stato ordini" : "订单状态"}
            description={locale === "it" ? "Pagamenti e lock" : "付款、锁库、预购"}
          >
            <section className="grid grid-cols-2 gap-1.5 xl:grid-cols-1">
              <CompactOrderMetric
                icon={Banknote}
                label={locale === "it" ? "Contanti" : "待收现金"}
                value={orderCounts.pending_cash}
                tone="amber"
              />
              <CompactOrderMetric
                icon={ReceiptText}
                label={locale === "it" ? "Bonifici" : "待确认转账"}
                value={orderCounts.pending_bank_transfer}
                tone="blue"
              />
              <CompactOrderMetric
                icon={CreditCard}
                label={locale === "it" ? "Stripe pending" : "Stripe 待支付"}
                value={orderCounts.pending_card}
                tone="violet"
              />
              <CompactOrderMetric
                icon={PackageCheck}
                label={locale === "it" ? "Preorder" : "待分配预购"}
                value={orderCounts.preorder}
                tone="green"
              />
              <CompactOrderMetric
                icon={TimerReset}
                label={locale === "it" ? "Lock in scadenza" : "即将过期锁库"}
                value={orderCounts.expiring}
                tone="red"
              />
            </section>
            <AdminPanel title={locale === "it" ? "Filtri rapidi" : "快捷筛选"} contentClassName="flex flex-wrap gap-1.5 p-2">
              {filterItems.map((item) => (
                <Link
                  key={item.href}
                  className={`inline-flex h-7 items-center rounded-full px-2.5 text-xs font-black transition ${
                    item.active
                      ? "bg-stone-950 text-white"
                      : "border border-black/10 bg-white text-stone-700 hover:border-black/20"
                  }`}
                  href={item.href}
                >
                  {item.label} {item.count}
                </Link>
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
              <AdminDataTable minWidth={1040}>
                <table className="w-full text-left text-xs">
                  <thead className="text-[11px] uppercase text-stone-400">
                    <tr className="border-b border-black/5">
                      <th className="px-2 py-1.5">{locale === "it" ? "Ordine" : "订单"}</th>
                      <th className="px-2 py-1.5">{locale === "it" ? "Cliente" : "客户"}</th>
                      <th className="px-2 py-1.5">{locale === "it" ? "Articoli" : "商品"}</th>
                      <th className="px-2 py-1.5">{locale === "it" ? "Pagamento" : "付款"}</th>
                      <th className="px-2 py-1.5">{locale === "it" ? "Importo" : "金额"}</th>
                      <th className="px-2 py-1.5">{locale === "it" ? "Stato" : "状态"}</th>
                      <th className="px-2 py-1.5">{locale === "it" ? "Operazioni" : "操作"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {visibleOrders.map((order) => {
                      const paymentStatus = formatAdminStatus("payment", order.paymentStatus ?? "-", locale);
                      const paymentMethod = formatAdminStatus("paymentMethod", order.paymentMethod, locale);
                      const fulfillmentStatus = formatAdminStatus("fulfillment", order.fulfillmentStatus ?? "-", locale);

                      return (
                      <tr key={order.id} className="align-top hover:bg-stone-50">
                        <td className="w-[150px] px-2 py-2">
                          <p className="font-mono text-[11px] font-black text-stone-900" title={order.id}>
                            {shortOrderId(order.id)}
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
                        <td className="w-[200px] px-2 py-2">
                          <StatusSelectForm
                            action="/api/admin/orders/status"
                            currentStatus={order.status}
                            id={order.id}
                            locale={locale}
                            statusLabels={orderStatusLabels}
                            statuses={orderStatuses}
                            submitLabel={locale === "it" ? "Salva" : "保存"}
                          />
                          {order.fulfillmentStatus ? (
                            <div className="mt-1">
                              <StatusPill status={fulfillmentStatus.label} tone={fulfillmentStatus.tone} />
                            </div>
                          ) : null}
                        </td>
                        <td className="w-[74px] px-2 py-2">
                          <AdminButtonLink
                            href={localizePath(locale, `/admin/orders/${order.id}`)}
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
                    <LocalizedStatusPill kind="order" locale={locale} value={order.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-stone-500">
                    <LocalizedStatusPill kind="payment" locale={locale} value={order.paymentStatus ?? "-"} />
                    <span>{formatMoney(order.total, locale)}</span>
                    {order.refundTotal ? (
                      <span className="text-rose-600">
                        - {formatMoney(order.refundTotal, locale)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-4">
                    <StatusSelectForm
                      action="/api/admin/orders/status"
                      currentStatus={order.status}
                      id={order.id}
                      locale={locale}
                      statusLabels={orderStatusLabels}
                      statuses={orderStatuses}
                      submitLabel={locale === "it" ? "Salva" : "保存"}
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

type AdminOrder = Awaited<ReturnType<typeof getAdminOrderRows>>[number];

const compactMetricToneClasses: Record<AdminTone, string> = {
  default: "bg-stone-50 text-stone-700 ring-black/5",
  slate: "bg-stone-50 text-stone-700 ring-black/5",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  red: "bg-rose-50 text-rose-700 ring-rose-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};

function CompactOrderMetric({
  icon: Icon,
  label,
  value,
  tone,
}: Readonly<{ icon: LucideIcon; label: string; value: number; tone: AdminTone }>) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ring-1 ${compactMetricToneClasses[tone]}`}>
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/70">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-black uppercase tracking-wide opacity-70">
          {label}
        </span>
        <span className="block text-base font-black leading-5">{value}</span>
      </span>
    </div>
  );
}

function OrderItemsSummary({
  order,
  locale,
}: Readonly<{ order: AdminOrder; locale: Locale }>) {
  const visibleItems = order.items.slice(0, 2);
  const hiddenCount = Math.max(order.items.length - visibleItems.length, 0);

  return (
    <div className="max-w-[340px] space-y-0.5">
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

function shortOrderId(value: string) {
  if (value.length <= 14) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
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
  if (filter === "refunded") {
    return orders.filter(
      (order) => order.paymentStatus === "refunded" || (order.refundTotal ?? 0) > 0,
    );
  }
  if (filter === "cancelled") {
    return orders.filter((order) => order.status === "cancelled");
  }
  return orders;
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
    if (order.paymentStatus === "pending_bank_transfer") {
      counts.pending_bank_transfer += 1;
    }
    if (order.paymentStatus === "pending_card") counts.pending_card += 1;
    if (isReservationExpiringSoon(order)) counts.expiring += 1;
  });

  return counts;
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
