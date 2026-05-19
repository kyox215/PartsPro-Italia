import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import { getAuthContext } from "@/lib/auth";
import { getAdminRmaRows } from "@/lib/admin-operations";
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

export default async function AdminRmaPage({
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
  const rmas = !auth.configured || auth.isAdmin ? await getAdminRmaRows() : [];
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">RMA</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Gestione RMA" : "RMA 售后管理"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Controlla richieste post-vendita, SKU, quantita, problema e stato."
            : "查看售后申请、SKU、数量、问题类型并更新处理状态。"}
        </p>
        <Feedback saved={saved} error={error} locale={locale} />
        <div className="mt-5">
          <ButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {locale === "it" ? "Torna admin" : "返回后台"}
          </ButtonLink>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {rmas.map((rma) => (
          <article key={rma.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div>
                <p className="text-lg font-bold text-slate-950">
                  {rma.orderNumber} / {rma.sku}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {rma.issueType} x {rma.quantity}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {rma.description || "-"}
                </p>
                <p className="mt-2 font-mono text-xs text-slate-500">{rma.id}</p>
              </div>
              <StatusSelectForm
                action="/api/admin/rma/status"
                currentStatus={rma.status}
                id={rma.id}
                locale={locale}
                statuses={rmaStatuses}
              />
              <ButtonLink
                href={localizePath(locale, `/admin/rma/${rma.id}`)}
                variant="secondary"
                className="h-9 px-3 text-xs"
              >
                {locale === "it" ? "Apri" : "查看"}
              </ButtonLink>
            </div>
          </article>
        ))}
      </section>
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

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
