import {
  AdminMobileNav,
  AdminSidebar,
} from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import type { AppRole, Dictionary, Locale } from "@/types";

type AdminShellProps = Readonly<{
  children: React.ReactNode;
  copy: Dictionary["admin"];
  email?: string | null;
  locale: Locale;
  role?: AppRole | null;
}>;

export function AdminShell({
  children,
  copy,
  email,
  locale,
  role,
}: AdminShellProps) {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AdminSidebar copy={copy.sidebar} locale={locale} role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar copy={copy} email={email} locale={locale} role={role} />
        <AdminMobileNav copy={copy.sidebar} locale={locale} />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
