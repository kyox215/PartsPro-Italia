import { redirect } from "next/navigation";
import {
  AdminShell,
  type AdminNavItem,
} from "@/components/admin/admin-shell";
import { hasAdminPermission, staffRoleLabels, type AdminPermission } from "@/lib/admin-permissions";
import { getAuthContext } from "@/lib/auth";
import { isLocale, type Locale, localizePath } from "@/lib/i18n";

type GuardedAdminNavItem = AdminNavItem & {
  permission?: AdminPermission;
  children?: GuardedAdminNavItem[];
};

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

  if (auth.configured && auth.user && !auth.canAccessAdmin) {
    redirect(localizePath(locale, "/account?error=admin-required"));
  }

  const rawNavItems: GuardedAdminNavItem[] = [
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
      permission: "products:write",
    },
    {
      href: localizePath(locale, "/admin/inventory"),
      label: locale === "it" ? "Inventario" : "库存预购",
      description: locale === "it" ? "Arrivi e ammanchi" : "到货与缺货",
      icon: "warehouse",
      permission: "inventory:write",
    },
    {
      href: localizePath(locale, "/admin/orders"),
      label: locale === "it" ? "Ordini" : "订单付款",
      description: locale === "it" ? "Fulfilment e stati" : "履约与状态",
      icon: "clipboard",
      permission: "orders:write",
    },
    {
      href: localizePath(locale, "/admin/accounts"),
      label: locale === "it" ? "Account" : "账号管理",
      description: locale === "it" ? "Clienti e ruoli" : "客户与权限",
      icon: "users",
      permission: "accounts:read",
      children: [
        {
          href: localizePath(locale, "/admin/accounts/customers"),
          label: locale === "it" ? "Clienti" : "客户管理",
          icon: "users",
          permission: "accounts:read",
        },
        {
          href: localizePath(locale, "/admin/accounts/permissions"),
          label: locale === "it" ? "Permessi" : "权限管理",
          icon: "settings",
          permission: "staff:manage",
        },
        {
          href: localizePath(locale, "/admin/accounts/audit-log"),
          label: locale === "it" ? "Audit log" : "操作日志",
          icon: "activity",
          permission: "audit:read",
        },
      ],
    },
    {
      href: localizePath(locale, "/admin/system"),
      label: locale === "it" ? "Sistema" : "系统状态",
      description: locale === "it" ? "Env e database" : "环境与数据库",
      icon: "settings",
      permission: "system:read",
    },
  ];

  const navItems: GuardedAdminNavItem[] = rawNavItems.map((item) => ({
    ...item,
    children: item.children?.filter((child) => canShowNavItem(auth, child)),
  })).filter((item) => canShowNavItem(auth, item));

  return (
    <AdminShell
      title={locale === "it" ? "Admin" : "管理员后台"}
      subtitle={locale === "it" ? "Pannello operativo" : "运营工作台"}
      navItems={navItems}
      locale={locale}
      identityEmail={auth.user?.email ?? (!auth.configured ? "demo-admin" : undefined)}
      identityRole={getIdentityRoleLabel(auth, locale)}
      showSignOut={Boolean(auth.user)}
    >
      {children}
    </AdminShell>
  );
}

function canShowNavItem(
  auth: Awaited<ReturnType<typeof getAuthContext>>,
  item: GuardedAdminNavItem,
) {
  if (!auth.configured) return true;
  if (!item.permission) return true;
  return hasAdminPermission(auth, item.permission);
}

function getIdentityRoleLabel(
  auth: Awaited<ReturnType<typeof getAuthContext>>,
  locale: Locale,
) {
  if (auth.isAdmin) return locale === "it" ? "Admin owner" : "总管理员";
  if (auth.staffRole) return staffRoleLabels[auth.staffRole][locale];
  return locale === "it" ? "Admin" : "管理员";
}
