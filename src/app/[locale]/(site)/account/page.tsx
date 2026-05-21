import { FileText, ShoppingBag, type LucideIcon } from "lucide-react";
import {
  AccountFeedback,
  AccountMetricCards,
  AccountNotificationsPanel,
  AccountProfileCta,
  AccountTodoPanel,
} from "@/components/account/account-activity-blocks";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAccountActivity } from "@/lib/account-activity";
import { getAccountCompany } from "@/lib/account-company";
import { getAuthContext } from "@/lib/auth";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";

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
  const { company } = await getAccountCompany(auth);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-blue-200 bg-blue-50 text-blue-700">
          {locale === "it" ? "Account" : "账户"}
        </Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {dictionary.account.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.account.subtitle}
        </p>
        <div className="mt-5">
          <AccountFeedback
            orderId={valueOf(query.order)}
            status={valueOf(query.status)}
            error={valueOf(query.error)}
            locale={locale}
          />
        </div>
      </section>

      <AccountMetricCards activity={activity} auth={auth} locale={locale} />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">
              {locale === "it" ? "Azioni aperte" : "待处理事项"}
            </h2>
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
              {locale === "it" ? "Workspace" : "工作台"}
            </Badge>
          </div>
          <AccountTodoPanel activity={activity} company={company} locale={locale} />
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-950">
              {locale === "it" ? "Notifiche" : "通知中心"}
            </h2>
            {activity.unreadNotificationCount ? (
              <Badge className="border-blue-200 bg-blue-50 text-blue-700">
                {activity.unreadNotificationCount}
              </Badge>
            ) : null}
          </div>
          <AccountNotificationsPanel
            notifications={activity.notifications}
            locale={locale}
          />
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ActionCard
          Icon={ShoppingBag}
          title={locale === "it" ? "Storico ordini" : "历史订单"}
          description={
            locale === "it"
              ? "Consulta pagamenti, righe SKU, fulfilment e importi."
              : "查看付款、SKU 明细、履约方式和历史金额。"
          }
          href={localizePath(locale, "/account/orders")}
          cta={locale === "it" ? "Apri ordini" : "查看订单"}
        />
        <ActionCard
          Icon={FileText}
          title={locale === "it" ? "Nuovo ordine" : "继续采购"}
          description={
            locale === "it"
              ? "Torna al catalogo per acquistare stock o preordinare articoli in arrivo."
              : "回到商品目录，采购现货或预购在途商品。"
          }
          href={localizePath(locale, "/products")}
          cta={locale === "it" ? "Catalogo" : "商品目录"}
        />
      </section>

      <AccountProfileCta locale={locale} />
    </div>
  );
}

function ActionCard({
  Icon,
  title,
  description,
  href,
  cta,
}: Readonly<{
  Icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
}>) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5">
      <Icon className="h-6 w-6 text-blue-600" />
      <h2 className="mt-4 font-bold text-slate-950">{title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
      <ButtonLink href={href} variant="secondary" className="mt-4 h-10">
        {cta}
      </ButtonLink>
    </article>
  );
}

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
