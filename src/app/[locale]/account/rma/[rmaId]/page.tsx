import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccountRmaById } from "@/lib/account-activity";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AccountRmaDetailPage({
  params,
}: Readonly<{ params: Promise<{ locale: string; rmaId: string }> }>) {
  const { locale: rawLocale, rmaId: rawRmaId } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const rmaId = decodeURIComponent(rawRmaId);
  const auth = await getAuthContext();
  const rma = await getAccountRmaById(auth, rmaId);

  if (!rma) {
    notFound();
  }

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
                ? "Stato pratica, SKU coinvolto e descrizione del problema inviati al team post-vendita."
                : "查看售后状态、关联 SKU 和提交给售后团队的问题描述。"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href={localizePath(locale, "/account/rma")} variant="secondary">
              {locale === "it" ? "Torna RMA" : "返回售后"}
            </ButtonLink>
            <ButtonLink
              href={`${localizePath(locale, "/rma")}?orderNumber=${encodeURIComponent(rma.orderNumber)}&sku=${encodeURIComponent(rma.sku)}&quantity=${rma.quantity}`}
              variant="secondary"
            >
              {locale === "it" ? "Nuova pratica" : "再次申请"}
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={locale === "it" ? "Stato" : "处理状态"} value={rma.status} />
        <MetricCard label={locale === "it" ? "Ordine" : "关联订单"} value={rma.orderNumber} />
        <MetricCard label="SKU" value={rma.sku} />
        <MetricCard
          label={locale === "it" ? "Problema" : "问题类型"}
          value={`${rma.issueType} x ${rma.quantity}`}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Descrizione" : "问题描述"}
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
          {rma.description || (locale === "it" ? "Nessuna descrizione." : "无描述。")}
        </p>
        <p className="mt-5 text-xs text-slate-500">
          {new Date(rma.createdAt).toLocaleString(locale === "it" ? "it-IT" : "zh-CN")}
        </p>
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
