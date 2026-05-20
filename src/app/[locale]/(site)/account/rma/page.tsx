import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  AccountMetricCards,
  AccountRmaGrid,
} from "@/components/account/account-activity-blocks";
import { getAccountActivity } from "@/lib/account-activity";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AccountRmaPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const activity = await getAccountActivity(auth);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-orange-200 bg-orange-50 text-orange-700">
          {locale === "it" ? "Post-vendita" : "售后"}
        </Badge>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              {locale === "it" ? "RMA e resi" : "退货 / RMA 管理"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Controlla pratiche aperte, prodotti coinvolti e stato di verifica tecnica."
                : "查看当前账户提交的售后、退货、换货和检测处理状态。"}
            </p>
          </div>
          <ButtonLink href={localizePath(locale, "/rma")} variant="secondary">
            {locale === "it" ? "Nuova pratica" : "新建售后"}
          </ButtonLink>
        </div>
      </section>

      <AccountMetricCards activity={activity} auth={auth} locale={locale} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Pratiche collegate al tuo account" : "我的售后记录"}
          </h2>
        </div>
        <AccountRmaGrid
          rmas={activity.rmas}
          locale={locale}
          emptyDescription={
            locale === "it"
              ? "Le richieste post-vendita collegate al tuo account appariranno qui."
              : "此账户提交的售后申请会显示在这里。"
          }
        />
      </section>
    </div>
  );
}
