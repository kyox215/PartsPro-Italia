import type { ReactNode } from "react";
import {
  Building2,
  FileText,
  PackageCheck,
  RotateCcw,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import type {
  AccountActivity,
  AccountOrderRow,
  AccountRmaRow,
} from "@/lib/account-activity";
import type { AuthContext } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
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
      Icon: RotateCcw,
      label: locale === "it" ? "RMA aperti" : "待处理售后",
      value: String(activity.openRmaCount),
    },
    {
      Icon: Building2,
      label: locale === "it" ? "Profilo" : "账户类型",
      value: auth.role ?? (auth.configured ? "retail" : "demo"),
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
                <p className="font-mono text-xs font-bold text-slate-900">{order.id}</p>
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
                          {item.fulfillmentType}
                        </Badge>
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
                <Badge className="border-slate-300 bg-slate-100 text-slate-800">
                  {order.status}
                </Badge>
                {order.fulfillmentStatus ? (
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {order.fulfillmentStatus}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-3">
                <ButtonLink
                  href={localizePath(locale, `/account/orders/${order.id}`)}
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

export function AccountRmaGrid({
  rmas,
  locale,
  emptyDescription,
}: Readonly<{
  rmas: AccountRmaRow[];
  locale: Locale;
  emptyDescription: string;
}>) {
  if (!rmas.length) {
    return (
      <AccountEmptyState
        icon={<RotateCcw className="h-6 w-6 text-blue-600" />}
        title={locale === "it" ? "Nessun RMA" : "暂无售后"}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid gap-4 p-5 md:grid-cols-2">
      {rmas.map((rma) => (
        <article key={rma.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-xs font-bold text-slate-900">
              {rma.rmaNumber ?? rma.id}
            </p>
            <Badge className="border-orange-200 bg-orange-50 text-orange-700">
              {rma.status}
            </Badge>
          </div>
          <h3 className="mt-4 font-bold text-slate-950">
            {rma.orderNumber} / {rma.sku}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {rma.issueType} x {rma.quantity}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {rma.description || (locale === "it" ? "Nessuna descrizione." : "无描述。")}
          </p>
          {rma.resolutionType ? (
            <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-bold text-slate-700">
              {locale === "it" ? "Esito" : "处理结果"}: {rma.resolutionType}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-slate-500">
            {new Date(rma.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
          </p>
          <ButtonLink
            href={localizePath(locale, `/account/rma/${rma.id}`)}
            variant="secondary"
            className="mt-4 h-9 px-3 text-xs"
          >
            {locale === "it" ? "Apri dettaglio" : "查看详情"}
          </ButtonLink>
        </article>
      ))}
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
  rmaId,
  status,
  error,
  locale,
}: Readonly<{
  orderId?: string;
  rmaId?: string;
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

  if (!orderId && !rmaId) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      {orderId
        ? locale === "it"
          ? `Ordine ${orderId} creato. Stato: ${status ?? "pending"}.`
          : `订单 ${orderId} 已创建。状态：${status ?? "pending"}。`
        : null}
      {rmaId
        ? locale === "it"
          ? `RMA ${rmaId} inviato.`
          : `售后 ${rmaId} 已提交。`
        : null}
    </div>
  );
}
