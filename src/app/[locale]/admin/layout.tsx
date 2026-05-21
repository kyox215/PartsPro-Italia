import { redirect } from "next/navigation";
import {
  AdminShell,
  type AdminNavItem,
} from "@/components/admin/admin-shell";
import { getStaffRoleLabel, hasAdminPermission, type AdminPermission } from "@/lib/admin-permissions";
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
      label: locale === "it" ? "Dashboard" : "总览",
      description: locale === "it" ? "Vendite e task" : "销售与待办",
      icon: "home",
    },
    {
      href: localizePath(locale, "/admin/products"),
      label: locale === "it" ? "Prodotti" : "商品管理",
      description: locale === "it" ? "Catalogo e prezzi" : "目录与价格",
      icon: "package",
      permission: "products:write",
    },
    {
      href: localizePath(locale, "/admin/inventory"),
      label: locale === "it" ? "Inventario" : "库存管理",
      description: locale === "it" ? "Arrivi e ammanchi" : "到货与缺货",
      icon: "warehouse",
      permission: "inventory:write",
      children: [
        {
          href: localizePath(locale, "/admin/inventory"),
          label: locale === "it" ? "Inventario" : "库存总览",
          icon: "warehouse",
          permission: "inventory:write",
        },
        {
          href: localizePath(locale, "/admin/inventory/import"),
          label: locale === "it" ? "Import" : "预到货导入",
          icon: "package",
          permission: "inventory:write",
        },
        {
          href: localizePath(locale, "/admin/inventory/incoming"),
          label: locale === "it" ? "Arrivi" : "到货缺货",
          icon: "clipboard",
          permission: "inventory:write",
        },
        {
          href: localizePath(locale, "/admin/inventory/movements"),
          label: locale === "it" ? "Movimenti" : "库存流水",
          icon: "activity",
          permission: "inventory:write",
        },
      ],
    },
    {
      href: localizePath(locale, "/admin/orders"),
      label: locale === "it" ? "Ordini" : "订单管理",
      description: locale === "it" ? "Stati e logistica" : "状态、收款与物流",
      icon: "clipboard",
      permission: "orders:write",
      children: [
        {
          href: localizePath(locale, "/admin/orders"),
          label: locale === "it" ? "Panoramica" : "订单总览",
          icon: "clipboard",
          permission: "orders:write",
        },
        {
          href: localizePath(locale, "/admin/orders/timeline"),
          label: locale === "it" ? "Timeline" : "订单时间线",
          icon: "activity",
          permission: "orders:write",
        },
      ],
    },
    {
      href: localizePath(locale, "/admin/accounts/customers"),
      label: locale === "it" ? "Clienti" : "客户管理",
      description: locale === "it" ? "CRM e fatturato" : "CRM 与成交",
      icon: "users",
      permission: "accounts:read",
    },
    {
      href: localizePath(locale, "/admin/settings"),
      label: locale === "it" ? "Impostazioni" : "设置",
      description: locale === "it" ? "Permessi e strumenti" : "权限与工具",
      icon: "settings",
      permission: "system:read",
      children: [
        {
          href: localizePath(locale, "/admin/settings/permissions"),
          label: locale === "it" ? "Permessi" : "权限设置",
          icon: "settings",
          permission: "staff:manage",
        },
        {
          href: localizePath(locale, "/admin/settings/products"),
          label: locale === "it" ? "Prodotti" : "商品设置",
          icon: "package",
          permission: "products:write",
        },
        {
          href: localizePath(locale, "/admin/settings/inventory"),
          label: locale === "it" ? "Inventario" : "库存设置",
          icon: "warehouse",
          permission: "inventory:write",
        },
        {
          href: localizePath(locale, "/admin/settings/orders"),
          label: locale === "it" ? "Ordini" : "订单设置",
          icon: "clipboard",
          permission: "orders:write",
        },
        {
          href: localizePath(locale, "/admin/settings/audit-log"),
          label: locale === "it" ? "Audit log" : "操作日志",
          icon: "activity",
          permission: "audit:read",
        },
        {
          href: localizePath(locale, "/admin/system"),
          label: locale === "it" ? "Sistema" : "系统健康",
          icon: "activity",
          permission: "system:read",
        },
      ],
    },
  ];

  const navItems: GuardedAdminNavItem[] = rawNavItems.map((item) => ({
    ...item,
    children: item.children?.filter((child) => canShowNavItem(auth, child)),
  })).filter((item) => canShowNavItem(auth, item));

  return (
    <AdminShell
      title="PartsPro"
      subtitle={locale === "it" ? "Pannello admin" : "管理后台"}
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
  if (auth.staffRole) return getStaffRoleLabel(auth.staffRole, locale);
  return locale === "it" ? "Admin" : "管理员";
}
