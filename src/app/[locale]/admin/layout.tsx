import { redirect } from "next/navigation";
import {
  AdminShell,
  type AdminNavItem,
} from "@/components/admin/admin-shell";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

export default async function AdminLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale: rawLocale } = await params;
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "it";
  const auth = await getAuthContext();

  if (auth.configured && !auth.user) {
    redirect(
      localizePath(
        locale,
        `/login?next=${encodeURIComponent(localizePath(locale, "/admin"))}`,
      ),
    );
  }

  if (auth.configured && auth.user && !auth.isAdmin) {
    redirect(localizePath(locale, "/account?error=admin-required"));
  }

  const navItems: AdminNavItem[] = [
    {
      href: localizePath(locale, "/admin"),
      label: locale === "it" ? "Dashboard" : "后台总览",
      description: locale === "it" ? "Metriche operative" : "运营指标",
      icon: "home",
    },
    {
      href: localizePath(locale, "/admin/products"),
      label: locale === "it" ? "Prodotti" : "商品 SKU",
      description: locale === "it" ? "Catalogo e prezzi" : "目录与价格",
      icon: "package",
    },
    {
      href: localizePath(locale, "/admin/inventory"),
      label: locale === "it" ? "Inventario" : "库存预购",
      description: locale === "it" ? "Arrivi e ammanchi" : "到货与缺货",
      icon: "warehouse",
    },
    {
      href: localizePath(locale, "/admin/orders"),
      label: locale === "it" ? "Ordini" : "订单付款",
      description: locale === "it" ? "Fulfilment e stati" : "履约与状态",
      icon: "clipboard",
    },
    {
      href: localizePath(locale, "/admin/b2b"),
      label: locale === "it" ? "Clienti B2B" : "B2B 审核",
      description: locale === "it" ? "Account wholesale" : "批发账户",
      icon: "users",
    },
    {
      href: localizePath(locale, "/admin/rma"),
      label: locale === "it" ? "RMA e resi" : "RMA 退货",
      description: locale === "it" ? "Post-vendita" : "售后处理",
      icon: "rma",
    },
    {
      href: localizePath(locale, "/admin/system"),
      label: locale === "it" ? "Sistema" : "系统状态",
      description: locale === "it" ? "Env e database" : "环境与数据库",
      icon: "settings",
    },
  ];

  return (
    <AdminShell
      title={locale === "it" ? "Admin" : "管理员后台"}
      subtitle={locale === "it" ? "Pannello operativo" : "运营工作台"}
      navItems={navItems}
      locale={locale}
      identityEmail={auth.user?.email ?? (!auth.configured ? "demo-admin" : undefined)}
      identityRole={locale === "it" ? "Admin" : "管理员"}
      showSignOut={Boolean(auth.user)}
    >
      {children}
    </AdminShell>
  );
}
