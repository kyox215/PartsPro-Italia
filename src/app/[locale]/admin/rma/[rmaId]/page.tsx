import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import { getAdminRmaById } from "@/lib/admin-operations";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

const rmaStatuses = [
  "submitted",
  "waiting_information",
  "approved_return",
  "waiting_receive",
  "testing",
  "approved",
  "rejected",
  "replacement_sent",
  "refund_processing",
  "completed",
];

export default async function AdminRmaDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; rmaId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { locale: rawLocale, rmaId: rawRmaId } = await params;
  const query = (await searchParams) ?? {};
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const rmaId = decodeURIComponent(rawRmaId);
  const auth = await getAuthContext();
  const rma = !auth.configured || auth.isAdmin ? await getAdminRmaById(rmaId) : null;

  if (!rma) {
    notFound();
  }

  const returnTo = localizePath(locale, `/admin/rma/${rma.id}`);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">RMA</Badge>
        <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h1 className="break-all font-mono text-2xl font-bold text-slate-950">
              {rma.id}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Dettaglio post-vendita per verifica tecnica, stato e collegamento ordine."
                : "售后处理详情，用于技术检测、状态流转和关联订单追踪。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={localizePath(locale, "/admin/rma")} variant="secondary">
              {locale === "it" ? "Torna RMA" : "返回 RMA"}
            </ButtonLink>
            <ButtonLink
              href={localizePath(locale, `/admin/orders/${rma.orderId ?? rma.orderNumber}`)}
              variant="secondary"
            >
              {locale === "it" ? "Ordine" : "关联订单"}
            </ButtonLink>
          </div>
        </div>
        <Feedback saved={valueOf(query.saved)} error={valueOf(query.error)} locale={locale} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={locale === "it" ? "Stato" : "状态"} value={rma.status} />
        <MetricCard label={locale === "it" ? "Ordine" : "订单"} value={rma.orderNumber} />
        <MetricCard label="SKU" value={rma.sku} />
        <MetricCard
          label={locale === "it" ? "Quantita" : "数量"}
          value={String(rma.quantity)}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Problema segnalato" : "客户反馈问题"}
          </h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <InfoRow label="Issue" value={rma.issueType} />
            <InfoRow
              label={locale === "it" ? "Test pre-installazione" : "安装前测试"}
              value={formatBoolean(rma.installationTested, locale)}
            />
            <InfoRow
              label={locale === "it" ? "Installato" : "是否已安装"}
              value={formatBoolean(rma.installed, locale)}
            />
            <InfoRow
              label={locale === "it" ? "Creato" : "提交时间"}
              value={new Date(rma.createdAt).toLocaleString(
                locale === "it" ? "it-IT" : "zh-CN",
              )}
            />
          </dl>
          <p className="mt-5 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700">
            {rma.description || (locale === "it" ? "Nessuna descrizione." : "无描述。")}
          </p>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Stato pratica" : "售后状态"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {locale === "it"
              ? "Aggiorna la fase operativa: attesa rientro, testing, sostituzione, rimborso o chiusura."
              : "更新处理阶段：等待退回、检测、换货、退款或完成。"}
          </p>
          <div className="mt-4">
            <StatusSelectForm
              action="/api/admin/rma/status"
              currentStatus={rma.status}
              extraFields={<input type="hidden" name="returnTo" value={returnTo} />}
              id={rma.id}
              locale={locale}
              statuses={rmaStatuses}
            />
          </div>
        </article>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 break-words text-xl font-bold text-slate-950">{value}</p>
    </article>
  );
}

function InfoRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="grid gap-1 rounded-lg bg-slate-50 p-3 sm:grid-cols-[140px_1fr]">
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="break-words text-slate-900">{value}</dd>
    </div>
  );
}

function Feedback({
  saved,
  error,
  locale,
}: Readonly<{ saved?: string; error?: string; locale: Locale }>) {
  if (error) {
    return (
      <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
        {decodeURIComponent(error)}
      </div>
    );
  }

  if (!saved) return null;

  return (
    <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      {saved === "demo"
        ? locale === "it"
          ? "Demo: stato RMA ricevuto."
          : "演示：已接收 RMA 状态。"
        : locale === "it"
          ? "RMA aggiornato."
          : "RMA 已更新。"}
    </div>
  );
}

function formatBoolean(value: boolean | null | undefined, locale: Locale) {
  if (value === true) return locale === "it" ? "Si" : "是";
  if (value === false) return locale === "it" ? "No" : "否";
  return "-";
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
