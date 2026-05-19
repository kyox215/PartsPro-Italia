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
import {
  getAccountActivity,
  type AccountOrderRow,
  type AccountRmaRow,
} from "@/lib/account-activity";
import { getAuthContext } from "@/lib/auth";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AccountPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const auth = await getAuthContext();
  const activity = await getAccountActivity(auth);
  const orderFeedback = valueOf(query.order);
  const rmaFeedback = valueOf(query.rma);
  const statusFeedback = valueOf(query.status);
  const metrics = [
    {
      Icon: PackageCheck,
      label: locale === "it" ? "Ordini" : "我的订单",
      value: String(activity.orderCount),
    },
    {
      Icon: FileText,
      label: locale === "it" ? "Totale ordini" : "订单金额",
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">Supabase Auth</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {dictionary.account.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.account.subtitle}
        </p>
        <Feedback
          orderId={orderFeedback}
          rmaId={rmaFeedback}
          status={statusFeedback}
          locale={locale}
        />
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {auth.user ? (
            <>
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                {auth.user.email}
              </Badge>
              <form action="/api/auth/sign-out" method="post">
                <input type="hidden" name="locale" value={locale} />
                <button
                  className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-950 hover:border-blue-300 hover:text-blue-700"
                  type="submit"
                >
                  {locale === "it" ? "Esci" : "退出登录"}
                </button>
              </form>
            </>
          ) : (
            <>
              <Badge className="border-orange-200 bg-orange-50 text-orange-700">
                {auth.configured
                  ? locale === "it"
                    ? "Login richiesto"
                    : "需要登录"
                  : locale === "it"
                    ? "Demo senza Supabase"
                    : "未配置 Supabase 的演示模式"}
              </Badge>
              <ButtonLink href={localizePath(locale, "/login")} variant="secondary">
                {locale === "it" ? "Vai al login" : "前往登录"}
              </ButtonLink>
            </>
          )}
          <ButtonLink href={localizePath(locale, "/products")} variant="secondary">
            {locale === "it" ? "Nuovo ordine" : "继续采购"}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/rma")} variant="secondary">
            {locale === "it" ? "Apri RMA" : "提交售后"}
          </ButtonLink>
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ Icon, label, value }) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <Icon className="h-6 w-6 text-blue-600" />
            <h2 className="mt-4 text-sm font-medium text-slate-500">{label}</h2>
            <p className="mt-1 break-words text-2xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {locale === "it" ? "Ordini recenti" : "最近订单"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {locale === "it"
                ? "Righe SKU, pagamento e stato operativo."
                : "查看 SKU 明细、付款方式和订单状态。"}
            </p>
          </div>
          <ButtonLink href={localizePath(locale, "/checkout")} variant="secondary">
            {locale === "it" ? "Checkout" : "去结账"}
          </ButtonLink>
        </div>
        {activity.orders.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activity.orders.map((order) => (
                  <OrderRow key={order.id} order={order} locale={locale} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<PackageCheck className="h-6 w-6 text-blue-600" />}
            title={locale === "it" ? "Nessun ordine" : "暂无订单"}
            description={
              auth.configured && !auth.user
                ? locale === "it"
                  ? "Accedi per vedere gli ordini collegati al tuo account."
                  : "登录后可查看此账户下的订单。"
                : locale === "it"
                  ? "Gli ordini creati da checkout appariranno qui."
                  : "通过结账创建的订单会显示在这里。"
            }
          />
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {locale === "it" ? "Pratiche RMA" : "售后 RMA"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {locale === "it"
                ? "Stato resi, sostituzioni e verifica tecnica."
                : "查看退货、换货和检测处理状态。"}
            </p>
          </div>
          <ButtonLink href={localizePath(locale, "/rma")} variant="secondary">
            {locale === "it" ? "Nuova pratica" : "新建售后"}
          </ButtonLink>
        </div>
        {activity.rmas.length ? (
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {activity.rmas.map((rma) => (
              <RmaCard key={rma.id} rma={rma} locale={locale} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<RotateCcw className="h-6 w-6 text-blue-600" />}
            title={locale === "it" ? "Nessun RMA" : "暂无售后"}
            description={
              locale === "it"
                ? "Le richieste post-vendita collegate al tuo account appariranno qui."
                : "此账户提交的售后申请会显示在这里。"
            }
          />
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-[auto_1fr_auto] md:items-center">
          <UserRound className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="font-bold text-slate-950">
              {locale === "it" ? "Profilo aziendale" : "公司资料"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Dati fattura, indirizzi e price group saranno collegati alla tabella companies."
                : "发票资料、地址和价格组后续会连接到 companies 表。"}
            </p>
          </div>
          <ButtonLink href={localizePath(locale, "/b2b")} variant="secondary">
            {locale === "it" ? "Richiedi B2B" : "申请批发"}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}

function OrderRow({
  order,
  locale,
}: Readonly<{ order: AccountOrderRow; locale: Locale }>) {
  return (
    <tr>
      <td className="px-4 py-3">
        <p className="font-mono text-xs font-bold text-slate-900">{order.id}</p>
        <p className="mt-1 text-xs text-slate-500">
          {new Date(order.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
        </p>
      </td>
      <td className="px-4 py-3">
        <ul className="space-y-1 text-xs text-slate-600">
          {order.items.map((item) => (
            <li key={`${order.id}-${item.sku}`}>
              <span className="font-mono font-semibold text-slate-900">{item.sku}</span>
              {" x "}
              {item.quantity}
            </li>
          ))}
        </ul>
      </td>
      <td className="px-4 py-3 text-slate-700">{order.paymentMethod}</td>
      <td className="px-4 py-3 font-bold text-slate-950">
        {formatMoney(order.total, locale)}
      </td>
      <td className="px-4 py-3">
        <Badge className="border-slate-300 bg-slate-100 text-slate-800">
          {order.status}
        </Badge>
      </td>
    </tr>
  );
}

function RmaCard({
  rma,
  locale,
}: Readonly<{ rma: AccountRmaRow; locale: Locale }>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-mono text-xs font-bold text-slate-900">{rma.id}</p>
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
      <p className="mt-3 text-xs text-slate-500">
        {new Date(rma.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
      </p>
    </article>
  );
}

function EmptyState({
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

function Feedback({
  orderId,
  rmaId,
  status,
  locale,
}: Readonly<{
  orderId?: string;
  rmaId?: string;
  status?: string;
  locale: Locale;
}>) {
  if (!orderId && !rmaId) return null;

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
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

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
