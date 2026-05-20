import { AdminTabs } from "@/components/admin/admin-ui";
import { hasAdminPermission, type AdminPermission } from "@/lib/admin-permissions";
import type { AuthContext } from "@/lib/auth";
import { type Locale, localizePath } from "@/lib/i18n";

type AccountTab = {
  key: string;
  href: string;
  label: string;
  permission: AdminPermission;
  count?: number | string;
};

export function AccountManagementTabs({
  auth,
  locale,
  active,
  counts,
}: Readonly<{
  auth: AuthContext;
  locale: Locale;
  active: "overview" | "customers" | "permissions" | "audit";
  counts?: Partial<Record<"customers" | "staff" | "audit", number | string>>;
}>) {
  const tabs: AccountTab[] = [
    {
      key: "overview",
      href: localizePath(locale, "/admin/accounts"),
      label: locale === "it" ? "Panoramica" : "总览",
      permission: "accounts:read",
    },
    {
      key: "customers",
      href: localizePath(locale, "/admin/accounts/customers"),
      label: locale === "it" ? "Clienti" : "客户管理",
      permission: "accounts:read",
      count: counts?.customers,
    },
    {
      key: "permissions",
      href: localizePath(locale, "/admin/accounts/permissions"),
      label: locale === "it" ? "Permessi" : "权限管理",
      permission: "staff:manage",
      count: counts?.staff,
    },
    {
      key: "audit",
      href: localizePath(locale, "/admin/accounts/audit-log"),
      label: locale === "it" ? "Audit" : "操作日志",
      permission: "audit:read",
      count: counts?.audit,
    },
  ];

  return (
    <AdminTabs
      wrap
      items={tabs
        .filter((tab) => hasAdminPermission(auth, tab.permission))
        .map((tab) => ({
          href: tab.href,
          label: tab.label,
          active: tab.key === active,
          count: tab.count,
        }))}
    />
  );
}
