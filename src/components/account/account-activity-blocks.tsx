import type { ReactNode } from "react";
import {
  Building2,
  FileText,
  Inbox,
  PackageCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type {
  AccountActivity,
  AccountNotificationRow,
  AccountOrderRow,
} from "@/lib/account-activity";
import type { AccountCompany } from "@/lib/account-company";
import {
  formatAccountRole,
  formatFulfillmentStatus,
  formatFulfillmentType,
  formatOrderStatus,
  formatPaymentMethod,
  formatPaymentStatus,
  getCompanyCompletion,
  statusBadgeClass,
} from "@/lib/account-display";
import type { AuthContext } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { displayOrderNumber, orderRouteId } from "@/lib/order-number";
import { formatMoney } from "@/lib/pricing";

export function AccountMetricCards({
  activity,
  auth,
  locale,
}: Readonly<{
  activity: AccountActivity;
  auth: AuthContext;
  locale: Locale;
}>) {
  const metrics = [
    {
      Icon: PackageCheck,
      label: locale === "it" ? "Ordini" : "我的订单",
      value: String(activity.orderCount),
    },
    {
      Icon: FileText,
      label: locale === "it" ? "Totale ordini" : "历史订单总金额",
      value: formatMoney(activity.totalSpend, locale),
    },
    {
      Icon: Building2,
      label: locale === "it" ? "Profilo" : "账户类型",
      value: formatAccountRole(auth, locale),
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ Icon, label, value }) => (
        <article key={label} className="rounded-lg border border-slate-200 bg-white p-5">
          <Icon className="h-6 w-6 text-blue-600" />
          <h2 className="mt-4 text-sm font-medium text-slate-500">{label}</h2>
          <p className="mt-1 break-words text-2xl font-bold text-slate-950">{value}</p>
        </article>
      ))}
    </div>
  );
}

export function AccountTodoPanel({
  activity,
  company,
  locale,
}: Readonly<{
  activity: AccountActivity;
  company: AccountCompany | null;
  locale: Locale;
}>) {
  const completion = getCompanyCompletion(company);
  const pendingPayments = activity.orders.filter(
    (order) =>
      order.paymentStatus !== "paid" &&
      order.paymentStatus !== "refunded" &&
      order.status !== "cancelled",
  );
  const generatedAtMs = Date.parse(activity.generatedAt);
  const expiringReservations = pendingPayments.filter((order) => {
    if (!order.reservationExpiresAt) return false;
    return Date.parse(order.reservationExpiresAt) - generatedAtMs < 6 * 60 * 60 * 1000;
  });
  const preorderOrders = activity.orders.filter(
    (order) => order.fulfillmentStatus === "awaiting_preorder",
  );
  const shippedOrders = activity.orders.filter((order) => order.status === "shipped");
  const todos = [
    ...pendingPayments.slice(0, 3).map((order) => ({
      key: `payment-${order.id}`,
      title: locale === "it" ? "Pagamento da completare" : "订单等待付款",
      description:
        locale === "it"
          ? `${formatPaymentMethod(order.paymentMethod, locale)} / ${formatMoney(order.total, locale)}`
          : `${formatPaymentMethod(order.paymentMethod, locale)} / ${formatMoney(order.total, locale)}`,
      href: localizePath(locale, `/account/orders/${orderRouteId(order)}`),
      tone: "amber" as const,
    })),
    ...expiringReservations.slice(0, 2).map((order) => ({
      key: `expiry-${order.id}`,
      title: locale === "it" ? "Prenotazione in scadenza" : "库存锁定即将过期",
      description: order.reservationExpiresAt
        ? formatDateTime(order.reservationExpiresAt, locale)
        : "-",
      href: localizePath(locale, `/account/orders/${orderRouteId(order)}`),
      tone: "orange" as const,
    })),
    ...preorderOrders.slice(0, 2).map((order) => ({
      key: `preorder-${order.id}`,
      title: locale === "it" ? "Preorder in attesa" : "预购等待到货",
      description: formatFulfillmentStatus(order.fulfillmentStatus, locale).description,
      href: localizePath(locale, `/account/orders/${orderRouteId(order)}`),
      tone: "blue" as const,
    })),
    ...shippedOrders.slice(0, 2).map((order) => ({
      key: `shipment-${order.id}`,
      title: locale === "it" ? "Tracking disponibile" : "物流可查看",
      description: order.trackingNumber ?? order.shippingCarrier ?? displayOrderNumber(order, locale),
      href: localizePath(locale, `/account/orders/${orderRouteId(order)}`),
      tone: "blue" as const,
    })),
  ];

  if (completion.percent < 100) {
    todos.push({
      key: "company-profile",
      title: locale === "it" ? "Profilo aziendale incompleto" : "公司资料待完善",
      description:
        locale === "it"
          ? `${completion.completed}/${completion.total} campi completati`
          : `${completion.completed}/${completion.total} 个关键字段已完成`,
      href: localizePath(locale, "/account/company"),
      tone: "amber",
    });
  }

  if (!todos.length) {
    return (
      <AccountEmptyState
        icon={<PackageCheck className="h-6 w-6 text-emerald-600" />}
        title={locale === "it" ? "Nessuna azione urgente" : "暂无待处理事项"}
        description={
          locale === "it"
            ? "Pagamenti, preorder e profilo aziendale sono sotto controllo."
            : "付款、预购和公司资料目前没有紧急处理项。"
        }
      />
    );
  }

  return (
    <div className="grid gap-3">
      {todos.map((todo) => (
        <a
          key={todo.key}
          className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
          href={todo.href}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <strong className="text-sm text-slate-950">{todo.title}</strong>
            <Badge className={statusBadgeClass(todo.tone)}>
              {locale === "it" ? "Azione" : "待办"}
            </Badge>
          </div>
          <p className="break-words text-sm leading-6 text-slate-600">
            {todo.description}
          </p>
        </a>
      ))}
    </div>
  );
}

export function AccountNotificationsPanel({
  notifications,
  locale,
}: Readonly<{
  notifications: AccountNotificationRow[];
  locale: Locale;
}>) {
  if (!notifications.length) {
    return (
      <AccountEmptyState
        icon={<Inbox className="h-6 w-6 text-blue-600" />}
        title={locale === "it" ? "Nessuna notifica" : "暂无通知"}
        description={
          locale === "it"
            ? "Aggiornamenti su pagamenti, spedizioni e rimborsi appariranno qui."
            : "付款、物流和退款的更新会显示在这里。"
        }
      />
    );
  }

  return (
    <div className="grid gap-3">
      <form action="/api/account/notifications/read" method="post" className="flex justify-end">
        <input type="hidden" name="locale" value={locale} />
        <button
          className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:border-blue-300 hover:text-blue-700"
          type="submit"
        >
          {locale === "it" ? "Segna lette" : "全部标记已读"}
        </button>
      </form>
      {notifications.map((notification) => (
        <article
          key={notification.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-950">{notification.subject}</h3>
            <Badge
              className={
                notification.readAt
                  ? "border-slate-300 bg-slate-100 text-slate-700"
                  : "border-blue-200 bg-blue-50 text-blue-700"
              }
            >
              {notification.readAt
                ? locale === "it"
                  ? "Letta"
                  : "已读"
                : locale === "it"
                  ? "Nuova"
                  : "新通知"}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {notification.body}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{formatDateTime(notification.createdAt, locale)}</span>
            {notification.orderId ? (
              <ButtonLink
                href={localizePath(locale, `/account/orders/${notification.orderId}`)}
                variant="secondary"
                className="h-8 px-2 text-xs"
              >
                {locale === "it" ? "Ordine" : "查看订单"}
              </ButtonLink>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function AccountOrdersTable({
  orders,
  locale,
  emptyDescription,
}: Readonly<{
  orders: AccountOrderRow[];
  locale: Locale;
  emptyDescription: string;
}>) {
  if (!orders.length) {
    return (
      <AccountEmptyState
        icon={<PackageCheck className="h-6 w-6 text-blue-600" />}
        title={locale === "it" ? "Nessun ordine" : "暂无订单"}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Payment</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Detail</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3">
                <p className="font-mono text-xs font-bold text-slate-900">{displayOrderNumber(order, locale)}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(order.createdAt).toLocaleString(
                    locale === "it" ? "it-IT" : "zh-CN",
                  )}
                </p>
              </td>
              <td className="px-4 py-3">
                <ul className="space-y-2 text-xs text-slate-600">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.sku}`} className="leading-5">
                      <span className="font-mono font-semibold text-slate-900">
                        {item.sku}
                      </span>
                      {" x "}
                      {item.quantity}
                      {item.fulfillmentType ? (
                        <Badge className="ml-2 border-blue-200 bg-blue-50 text-blue-700">
                          {formatFulfillmentType(item.fulfillmentType, locale)}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </td>
              <td className="px-4 py-3 text-slate-700">
                <p className="font-semibold">
                  {formatPaymentMethod(order.paymentMethod, locale)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatPaymentStatus(order.paymentStatus, locale).label}
                </p>
              </td>
              <td className="px-4 py-3 font-bold text-slate-950">
                {formatMoney(order.total, locale)}
              </td>
              <td className="px-4 py-3">
                <Badge className={statusBadgeClass(formatOrderStatus(order.status, locale).tone)}>
                  {formatOrderStatus(order.status, locale).label}
                </Badge>
                {order.fulfillmentStatus ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {formatFulfillmentStatus(order.fulfillmentStatus, locale).label}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <ButtonLink
                  href={localizePath(locale, `/account/orders/${orderRouteId(order)}`)}
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
  );
}

export function AccountProfileCta({ locale }: Readonly<{ locale: Locale }>) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
        <UserRound className="h-6 w-6 text-blue-600" />
        <div>
          <h2 className="font-bold text-slate-950">
            {locale === "it" ? "Profilo aziendale" : "公司资料"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {locale === "it"
              ? "Aggiorna dati fattura, indirizzi e contatti. Stato e price group restano gestiti dagli admin."
              : "维护发票资料、地址和联系人。审核状态和价格组由后台管理员管理。"}
          </p>
        </div>
        <ButtonLink href={localizePath(locale, "/account/company")} variant="secondary">
          {locale === "it" ? "Modifica profilo" : "编辑资料"}
        </ButtonLink>
      </div>
    </section>
  );
}

export function AccountEmptyState({
  icon,
  title,
  description,
}: Readonly<{
  icon: ReactNode;
  title: string;
  description: string;
}>) {
  return (
    <div className="grid place-items-center px-5 py-10 text-center">
      {icon}
      <h3 className="mt-3 font-bold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function AccountFeedback({
  orderId,
  status,
  error,
  locale,
}: Readonly<{
  orderId?: string;
  status?: string;
  error?: string;
  locale: Locale;
}>) {
  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {decodeURIComponent(error)}
      </div>
    );
  }

  if (!orderId) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      {orderId
        ? locale === "it"
          ? `Ordine ${orderId} creato. Stato: ${formatPaymentStatus(status, locale).label}.`
          : `订单 ${orderId} 已创建。状态：${formatPaymentStatus(status, locale).label}。`
        : null}
    </div>
  );
}

function formatDateTime(value: string, locale: Locale) {
  return new Date(value).toLocaleString(locale === "it" ? "it-IT" : "zh-CN");
}
