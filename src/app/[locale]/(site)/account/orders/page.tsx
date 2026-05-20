import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  AccountMetricCards,
  AccountOrdersTable,
} from "@/components/account/account-activity-blocks";
import { getAccountActivity } from "@/lib/account-activity";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AccountOrdersPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();
  const activity = await getAccountActivity(auth);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Storico" : "历史记录"}
        </Badge>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              {locale === "it" ? "Ordini" : "历史订单"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {locale === "it"
                ? "Rivedi importi, righe SKU, metodo pagamento e stato di fulfilment collegati al tuo account."
                : "查看当前账户下的订单金额、SKU 明细、付款方式和履约状态。"}
            </p>
          </div>
          <ButtonLink href={localizePath(locale, "/products")} variant="secondary">
            {locale === "it" ? "Nuovo ordine" : "继续采购"}
          </ButtonLink>
        </div>
      </section>

      <AccountMetricCards activity={activity} auth={auth} locale={locale} />

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">
            {locale === "it" ? "Lista ordini" : "订单列表"}
          </h2>
        </div>
        <AccountOrdersTable
          orders={activity.orders}
          locale={locale}
          emptyDescription={
            locale === "it"
              ? "Gli ordini creati da checkout appariranno qui."
              : "通过结账创建的订单会显示在这里。"
          }
        />
      </section>
    </div>
  );
}
