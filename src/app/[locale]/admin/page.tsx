import {
  Activity,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  PackagePlus,
  ShieldAlert,
  TicketCheck,
  type LucideIcon,
  UsersRound,
  Warehouse,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getAuthContext } from "@/lib/auth";
import { getAdminDashboardMetrics } from "@/lib/admin-operations";
import { getDictionary, isLocale, type Locale, localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

export default async function AdminPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const dictionary = getDictionary(locale);
  const auth = await getAuthContext();
  const dashboard =
    !auth.configured || auth.isAdmin
      ? await getAdminDashboardMetrics()
      : {
          orderCount: 0,
          pendingB2BCount: 0,
          openRmaCount: 0,
          revenueTotal: 0,
        };

  const metrics: Array<{ Icon: LucideIcon; label: string; value: string }> = [
    {
      Icon: CircleDollarSign,
      label: locale === "it" ? "Fatturato ordini" : "订单总额",
      value: formatMoney(dashboard.revenueTotal, locale),
    },
    {
      Icon: Boxes,
      label: locale === "it" ? "Ordini" : "订单",
      value: String(dashboard.orderCount),
    },
    {
      Icon: UsersRound,
      label: locale === "it" ? "B2B pending" : "待审核 B2B",
      value: String(dashboard.pendingB2BCount),
    },
    {
      Icon: TicketCheck,
      label: locale === "it" ? "RMA aperti" : "待处理 RMA",
      value: String(dashboard.openRmaCount),
    },
  ];

  const modules: Array<{
    Icon: LucideIcon;
    title: string;
    description: string;
    href: string;
  }> = [
    {
      Icon: PackagePlus,
      title: locale === "it" ? "Prodotti e SKU" : "商品与 SKU",
      description:
        locale === "it"
          ? "Crea SKU, prezzi B2B e stock iniziale."
          : "创建 SKU、B2B 价格和初始库存。",
      href: localizePath(locale, "/admin/products"),
    },
    {
      Icon: Warehouse,
      title: locale === "it" ? "Inventario e preordini" : "库存与预购",
      description:
        locale === "it"
          ? "Importa ordini fornitore e conferma arrivi."
          : "导入上游订货单并确认到货/缺货。",
      href: localizePath(locale, "/admin/inventory"),
    },
    {
      Icon: ClipboardList,
      title: locale === "it" ? "Ordini e pagamenti" : "订单与付款",
      description:
        locale === "it"
          ? "Controlla righe, bonifico, Stripe e fulfilment."
          : "查看明细、转账、Stripe 和发货状态。",
      href: localizePath(locale, "/admin/orders"),
    },
    {
      Icon: UsersRound,
      title: locale === "it" ? "Clienti B2B" : "B2B 客户",
      description:
        locale === "it"
          ? "Approva account wholesale e price group."
          : "审核批发账户并分配价格组。",
      href: localizePath(locale, "/admin/b2b"),
    },
    {
      Icon: TicketCheck,
      title: locale === "it" ? "RMA e resi" : "RMA 与退货",
      description:
        locale === "it"
          ? "Gestisci resi, sostituzioni e rimborsi."
          : "管理退货、换货和退款。",
      href: localizePath(locale, "/admin/rma"),
    },
    {
      Icon: Activity,
      title: locale === "it" ? "Sistema" : "系统状态",
      description:
        locale === "it"
          ? "Controlla env, Supabase, Stripe e database."
          : "检查环境变量、Supabase、Stripe 和数据库。",
      href: localizePath(locale, "/admin/system"),
    },
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
          <ButtonLink href={localizePath(locale, "/admin/inventory")} variant="secondary">
            {locale === "it" ? "Inventario" : "库存"}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/admin/orders")} variant="secondary">
            {locale === "it" ? "Ordini" : "订单"}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/admin/b2b")} variant="secondary">
            {locale === "it" ? "Revisioni B2B" : "B2B 审核"}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/admin/rma")} variant="secondary">
            RMA
          </ButtonLink>
          <ButtonLink href="/api/admin/health" variant="secondary">
            API health
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/admin/system")} variant="secondary">
            {locale === "it" ? "Sistema" : "系统状态"}
          </ButtonLink>
          {!auth.user && auth.configured ? (
            <ButtonLink href={localizePath(locale, "/login")} variant="secondary">
              {locale === "it" ? "Login admin" : "管理员登录"}
            </ButtonLink>
          ) : null}
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ Icon, label, value }) => (
          <article key={label} className="rounded-lg border border-slate-200 bg-white p-5">
            <Icon className="h-6 w-6 text-blue-600" />
            <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-bold text-slate-950">{value}</p>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-bold text-slate-950">
          {locale === "it" ? "Moduli operativi" : "运营模块"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {modules.map(({ Icon, title, description, href }) => (
            <a
              key={title}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
              href={href}
            >
              <Icon className="h-5 w-5 text-blue-600" />
              <p className="mt-3 font-bold text-slate-950">{title}</p>
              <p className="mt-1 leading-5">{description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
