import { Boxes, CircleDollarSign, ShieldAlert, TicketCheck, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const auth = await getAuthContext();

  const metrics = [
    [Boxes, "SKU", "6"],
    [UsersRound, locale === "it" ? "B2B pending" : "待审核 B2B", "3"],
    [CircleDollarSign, locale === "it" ? "Ordini oggi" : "今日订单", "12"],
    [TicketCheck, "RMA", "2"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <Badge className="border-slate-300 bg-slate-100 text-slate-800">Admin</Badge>
        <h1 className="mt-4 text-3xl font-bold text-slate-950">
          {dictionary.admin.title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          {dictionary.admin.subtitle}
        </p>
        <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
          <ShieldAlert className="mr-2 inline h-4 w-4" />
          {auth.configured && !auth.isAdmin
            ? locale === "it"
              ? "Accesso reale limitato agli admin. In locale puoi vedere la shell, ma le API admin richiedono ruolo admin."
              : "真实后台仅管理员可访问。本地可查看界面，但后台 API 需要 admin 角色。"
            : dictionary.admin.warning}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink href={localizePath(locale, "/admin/products")}>
            {locale === "it" ? "Gestisci prodotti" : "管理商品"}
          </ButtonLink>
          <ButtonLink href="/api/admin/health" variant="secondary">
            API health
          </ButtonLink>
          {!auth.user && auth.configured ? (
            <ButtonLink href={localizePath(locale, "/login")} variant="secondary">
              {locale === "it" ? "Login admin" : "管理员登录"}
            </ButtonLink>
          ) : null}
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(([Icon, label, value]) => (
          <article key={label as string} className="rounded-lg border border-slate-200 bg-white p-5">
            <Icon className="h-6 w-6 text-blue-600" />
            <p className="mt-4 text-sm font-medium text-slate-500">{label as string}</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">{value as string}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Moduli operativi" : "运营模块"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            locale === "it" ? "Prodotti e SKU" : "商品与 SKU",
            locale === "it" ? "Stock e lotti" : "库存与批次",
            locale === "it" ? "Ordini e pagamenti" : "订单与付款",
            locale === "it" ? "Clienti B2B" : "B2B 客户",
            locale === "it" ? "RMA e resi" : "RMA 与退货",
            locale === "it" ? "Contenuti legali" : "法律内容",
          ].map((item) => (
            <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-800">
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
