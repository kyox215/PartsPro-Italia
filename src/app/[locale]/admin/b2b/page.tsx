import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusSelectForm } from "@/components/admin/status-select-form";
import { getAuthContext } from "@/lib/auth";
import { getAdminB2BApplicationRows } from "@/lib/admin-operations";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

const b2bStatuses = ["pending", "approved", "rejected"];

export default async function AdminB2BPage({
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
  const applications =
    !auth.configured || auth.isAdmin ? await getAdminB2BApplicationRows() : [];
  const saved = valueOf(query.saved);
  const error = valueOf(query.error);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">B2B</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {locale === "it" ? "Revisioni account B2B" : "B2B 开户审核"}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {locale === "it"
            ? "Approva o rifiuta richieste wholesale e prepara assegnazione price group."
            : "审核批发开户注册申请，并准备分配价格组。"}
        </p>
        <Feedback saved={saved} error={error} locale={locale} />
        <div className="mt-5">
          <ButtonLink href={localizePath(locale, "/admin")} variant="secondary">
            {locale === "it" ? "Torna admin" : "返回后台"}
          </ButtonLink>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {applications.map((application) => (
          <article
            key={application.id}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div>
                <p className="text-lg font-bold text-slate-950">
                  {application.companyName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {application.email} / {application.vatNumber}
                </p>
                <p className="mt-2 font-mono text-xs text-slate-500">
                  {application.id}
                </p>
              </div>
              <StatusSelectForm
                action="/api/admin/b2b/status"
                currentStatus={application.status}
                extraFields={
                  <input
                    className="h-9 w-32 rounded-lg border border-slate-300 px-2 text-xs"
                    name="priceGroup"
                    placeholder="b2b_basic"
                  />
                }
                id={application.id}
                locale={locale}
                statuses={b2bStatuses}
              />
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
          ? "Demo: richiesta aggiornata localmente."
          : "演示：已接收审核动作。"
        : locale === "it"
          ? "Richiesta aggiornata."
          : "申请已更新。"}
    </div>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
