import { redirect } from "next/navigation";
import { getAdminNavItems, type AdminNavItem } from "@/admin/config/nav";
import { hasAdminPermissionCode } from "@/admin/config/permissions";
import { AdminApp } from "@/admin/ui/admin-app";
import { AdminShellClient } from "@/admin/ui/admin-shell-client";
import { getStaffRoleLabel } from "@/lib/admin-permissions";
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

  if (auth.configured && auth.user && !auth.canAccessAdmin) {
    redirect(localizePath(locale, "/account?error=admin-required"));
  }

  const navItems = filterNavItems(getAdminNavItems(locale), auth);

  return (
    <AdminApp locale={locale}>
      <AdminShellClient
        title="PartsPro"
        subtitle={locale === "it" ? "Pannello admin" : "管理后台"}
        navItems={navItems}
        locale={locale}
        identityEmail={auth.user?.email ?? (!auth.configured ? "demo-admin" : undefined)}
        identityRole={getIdentityRoleLabel(auth, locale)}
        showSignOut={Boolean(auth.user)}
      >
        {children}
      </AdminShellClient>
    </AdminApp>
  );
}

function filterNavItems(
  items: AdminNavItem[],
  auth: Awaited<ReturnType<typeof getAuthContext>>,
): AdminNavItem[] {
  return items
    .map((item) => ({
      ...item,
      children: item.children ? filterNavItems(item.children, auth) : undefined,
    }))
    .filter((item) => {
      if (!auth.configured) return true;
      if (item.children?.length) return true;
      if (!item.permission) return true;
      return hasAdminPermissionCode(auth, item.permission);
    });
}

function getIdentityRoleLabel(
  auth: Awaited<ReturnType<typeof getAuthContext>>,
  locale: Locale,
) {
  if (auth.isAdmin) return locale === "it" ? "Admin owner" : "总管理员";
  if (auth.staffRole) return getStaffRoleLabel(auth.staffRole, locale);
  return locale === "it" ? "Admin" : "管理员";
}
