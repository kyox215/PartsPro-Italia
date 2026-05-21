import { Banknote, CreditCard, ReceiptText, Search } from "lucide-react";
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

type PaymentQueue = "all" | "cash" | "bank_transfer" | "stripe" | "proof" | "refund";

export default async function AdminOrderPaymentsPage({
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
  const rows = filterPaymentOrders(orders, queue, q);
  const counts = getPaymentCounts(orders);

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Payment queue" : "付款队列"}
        title={locale === "it" ? "Gestione pagamenti" : "付款处理"}
        description={
          locale === "it"
            ? "Conferma contanti, bonifici, carte Stripe e registra prove o rimborsi."
            : "集中处理现金收款、银行转账确认、Stripe 待支付、凭证和退款。"
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
        active="payments"
        counts={{
          overview: orders.length,
          payments: counts.cash + counts.bank_transfer + counts.stripe,
          fulfillment: orders.filter((order) => ["awaiting_preorder", "reserved", "picking"].includes(order.fulfillmentStatus ?? "")).length,
          timeline: orders.reduce((sum, order) => sum + order.timelineEvents.length, 0),
        }}
        locale={locale}
      />

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard icon={Banknote} label={locale === "it" ? "Contanti" : "待收现金"} value={counts.cash} tone="amber" />
        <AdminMetricCard icon={ReceiptText} label={locale === "it" ? "Bonifici" : "待确认转账"} value={counts.bank_transfer} tone="blue" />
        <AdminMetricCard icon={CreditCard} label={locale === "it" ? "Stripe" : "Stripe 待支付"} value={counts.stripe} tone="violet" />
        <AdminMetricCard icon={ReceiptText} label={locale === "it" ? "Rimborsi" : "退款处理"} value={counts.refund} tone="red" />
      </section>

      <AdminPanel title={locale === "it" ? "Cerca pagamenti" : "搜索付款"}>
        <form
          action={localizePath(locale, "/admin/orders/payments")}
          className="grid gap-2 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-end"
          method="get"
        >
          <input type="hidden" name="queue" value={queue === "all" ? "" : queue} />
          <AdminInput
            defaultValue={q}
            label={locale === "it" ? "Cerca tutto" : "全局搜索"}
            name="q"
            placeholder={locale === "it" ? "Ordine, cliente, email, SKU..." : "订单号、客户、邮箱、SKU、付款状态..."}
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
          tab(locale, queue, q, "cash", locale === "it" ? "Contanti" : "现金", counts.cash),
          tab(locale, queue, q, "bank_transfer", locale === "it" ? "Bonifici" : "转账", counts.bank_transfer),
          tab(locale, queue, q, "stripe", "Stripe", counts.stripe),
          tab(locale, queue, q, "proof", locale === "it" ? "Prove" : "付款凭证", counts.proof),
          tab(locale, queue, q, "refund", locale === "it" ? "Rimborsi" : "退款", counts.refund),
        ]}
      />

      <AdminPanel
        title={locale === "it" ? "Ordini da incassare" : "付款处理列表"}
        toolbar={<StatusPill status={`${rows.length} ${locale === "it" ? "ordini" : "订单"}`} tone="blue" />}
      >
        {rows.length ? (
          <div className="grid gap-2 xl:grid-cols-2">
            {rows.map((order) => (
              <PaymentOrderCard key={order.id} locale={locale} order={order} />
            ))}
          </div>
        ) : (
          <AdminEmptyState
            icon={Search}
            title={locale === "it" ? "Nessun pagamento in coda" : "暂无匹配付款"}
            description={locale === "it" ? "Cambia queue o ricerca." : "可切换队列或调整搜索。"}
          />
        )}
      </AdminPanel>
    </div>
  );
}

function PaymentOrderCard({ order, locale }: Readonly<{ order: AdminOrderRow; locale: Locale }>) {
  const paymentStatus = formatAdminStatus("payment", order.paymentStatus ?? "-", locale);
  const paymentMethod = formatAdminStatus("paymentMethod", order.paymentMethod, locale);
  const returnTo = localizePath(locale, `/admin/orders/payments`);

  return (
    <article className="rounded-lg border border-black/5 bg-stone-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            className="font-mono text-xs font-black text-stone-950 hover:text-blue-700"
            href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)}
          >
            {displayOrderNumber(order)}
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
        <StatusPill status={paymentMethod.label} tone={paymentMethod.tone} />
        <StatusPill status={paymentStatus.label} tone={paymentStatus.tone} />
        {order.paymentRecords.some((record) => record.proofUrl) ? (
          <StatusPill status={locale === "it" ? "Prova caricata" : "已上传凭证"} tone="blue" />
        ) : null}
        {(order.refundTotal ?? 0) > 0 ? (
          <StatusPill status={locale === "it" ? "Rimborso" : "有退款"} tone="red" />
        ) : null}
      </div>
      <div className="mt-3 grid gap-1.5 sm:grid-cols-3">
        {order.paymentMethod === "cash" && order.paymentStatus === "pending_cash" ? (
          <ActionForm action="/api/admin/orders/payment" id={order.id} locale={locale} returnTo={returnTo} value="confirm_cash">
            {locale === "it" ? "Conferma contanti" : "确认现金"}
          </ActionForm>
        ) : null}
        {order.paymentMethod === "bank_transfer" && order.paymentStatus === "pending_bank_transfer" ? (
          <ActionForm action="/api/admin/orders/payment" id={order.id} locale={locale} returnTo={returnTo} value="confirm_bank_transfer">
            {locale === "it" ? "Conferma bonifico" : "确认转账"}
          </ActionForm>
        ) : null}
        <AdminButtonLink href={localizePath(locale, `/admin/orders/${orderRouteId(order)}`)} variant="secondary">
          {locale === "it" ? "Apri dettagli" : "打开详情"}
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
  value: string;
  children: React.ReactNode;
}>) {
  return (
    <form action={action} method="post">
      <AdminCsrfField />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <input type="hidden" name="action" value={value} />
      <button className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-stone-950 px-3 text-xs font-black text-white" type="submit">
        {children}
      </button>
    </form>
  );
}

function filterPaymentOrders(orders: AdminOrderRow[], queue: PaymentQueue, search: string) {
  const query = normalizeSearch(search);
  return orders.filter((order) => {
    if (queue === "cash" && order.paymentStatus !== "pending_cash") return false;
    if (queue === "bank_transfer" && order.paymentStatus !== "pending_bank_transfer") return false;
    if (queue === "stripe" && order.paymentStatus !== "pending_card") return false;
    if (queue === "proof" && !order.paymentRecords.some((record) => record.proofUrl)) return false;
    if (queue === "refund" && !(order.paymentStatus === "refunded" || (order.refundTotal ?? 0) > 0 || order.refunds.length > 0)) return false;
    if (!query) return true;
    return normalizeSearch([
      order.id,
      order.orderNumber,
      order.companyName,
      order.customerName,
      order.email,
      order.paymentMethod,
      order.paymentStatus,
      ...order.items.flatMap((item) => [item.sku, item.name]),
    ].filter(Boolean).join(" ")).includes(query);
  });
}

function getPaymentCounts(orders: AdminOrderRow[]) {
  return {
    cash: orders.filter((order) => order.paymentStatus === "pending_cash").length,
    bank_transfer: orders.filter((order) => order.paymentStatus === "pending_bank_transfer").length,
    stripe: orders.filter((order) => order.paymentStatus === "pending_card").length,
    proof: orders.filter((order) => order.paymentRecords.some((record) => record.proofUrl)).length,
    refund: orders.filter((order) => order.paymentStatus === "refunded" || (order.refundTotal ?? 0) > 0 || order.refunds.length > 0).length,
  };
}

function tab(locale: Locale, current: PaymentQueue, q: string, value: PaymentQueue, label: string, count: number) {
  const params = new URLSearchParams();
  if (value !== "all") params.set("queue", value);
  if (q) params.set("q", q);
  const query = params.toString();
  return {
    href: `${localizePath(locale, "/admin/orders/payments")}${query ? `?${query}` : ""}`,
    label,
    count,
    active: current === value,
  };
}

function normalizeQueue(value?: string): PaymentQueue {
  return ["cash", "bank_transfer", "stripe", "proof", "refund"].includes(value ?? "")
    ? (value as PaymentQueue)
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
  if (saved) return <AdminNotice tone="success">{locale === "it" ? "Pagamento aggiornato." : "付款状态已更新。"}</AdminNotice>;
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
