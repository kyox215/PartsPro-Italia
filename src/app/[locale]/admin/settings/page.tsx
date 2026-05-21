import {
  ClipboardList,
  PackagePlus,
  Settings,
  ShieldCheck,
  UsersRound,
  Warehouse,
} from "lucide-react";
import {
  AdminButtonLink,
  AdminPageHeader,
  AdminPanel,
} from "@/components/admin/admin-ui";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminSettingsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "zh";
  const sections = [
    {
      icon: ShieldCheck,
      title: locale === "it" ? "Permessi" : "权限设置",
      description: locale === "it" ? "Ruoli, staff e matrice permessi." : "职位、员工与模块权限。",
      href: localizePath(locale, "/admin/settings/permissions"),
    },
    {
      icon: PackagePlus,
      title: locale === "it" ? "Prodotti" : "商品设置",
      description: locale === "it" ? "Import, traduzioni e parametri catalogo." : "导入、中文翻译和商品参数工具。",
      href: localizePath(locale, "/admin/settings/products"),
    },
    {
      icon: Warehouse,
      title: locale === "it" ? "Inventario" : "库存设置",
      description: locale === "it" ? "Aggiustamenti, soglie e arrivi." : "库存调整、阈值和到货工具。",
      href: localizePath(locale, "/admin/settings/inventory"),
    },
    {
      icon: ClipboardList,
      title: locale === "it" ? "Ordini" : "订单设置",
      description: locale === "it" ? "Stati, pagamenti e regole operative." : "订单状态、收款和操作规则。",
      href: localizePath(locale, "/admin/settings/orders"),
    },
    {
      icon: UsersRound,
      title: locale === "it" ? "Clienti" : "客户设置",
      description: locale === "it" ? "CRM, segmenti e audit account." : "CRM、客户分层和账号日志。",
      href: localizePath(locale, "/admin/settings/audit-log"),
    },
    {
      icon: Settings,
      title: locale === "it" ? "Sistema" : "系统健康",
      description: locale === "it" ? "Env, Supabase e controlli database." : "环境变量、Supabase 和数据库检查。",
      href: localizePath(locale, "/admin/system"),
    },
  ];

  return (
    <div className="space-y-3">
      <AdminPageHeader
        eyebrow={locale === "it" ? "Settings center" : "设置中心"}
        title={locale === "it" ? "Impostazioni admin" : "后台设置中心"}
        description={
          locale === "it"
            ? "Configurazioni, strumenti avanzati e permessi sono separati dai flussi operativi."
            : "配置、高级工具和权限集中在这里，业务页面保持干净。"
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sections.map(({ icon: Icon, title, description, href }) => (
          <AdminPanel key={href} title={title} toolbar={<Icon className="h-4 w-4 text-blue-600" />}>
            <p className="min-h-10 text-sm font-semibold leading-5 text-slate-500">{description}</p>
            <div className="mt-3">
              <AdminButtonLink href={href} variant="secondary">
                {locale === "it" ? "Apri" : "打开"}
              </AdminButtonLink>
            </div>
          </AdminPanel>
        ))}
      </div>
    </div>
  );
}
