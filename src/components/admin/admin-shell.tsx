import Link from "next/link";
import { ExternalLink, Home, LogOut } from "lucide-react";
import { AdminBrand } from "@/components/admin/admin-brand";
import { AdminDesktopNav, AdminTopBarClient } from "@/components/admin/admin-shell-client";
import type { AdminNavItem } from "@/components/admin/admin-shell-types";

export type { AdminIcon, AdminNavItem } from "@/components/admin/admin-shell-types";

export function AdminShell({
  children,
  title,
  subtitle,
  navItems,
  locale,
  identityEmail,
  identityRole,
  showSignOut = false,
}: Readonly<{
  children: React.ReactNode;
  title: string;
  subtitle: string;
  navItems: AdminNavItem[];
  locale: "it" | "zh";
  identityEmail?: string;
  identityRole?: string;
  showSignOut?: boolean;
}>) {
  const accountLabel = identityEmail ?? (locale === "it" ? "Demo admin" : "演示管理员");
  const shortName = accountLabel.slice(0, 2).toUpperCase();
  const siteHomeHref = `/${locale}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px]">
        <aside className="hidden w-[248px] shrink-0 border-r border-slate-200 bg-white px-4 py-5 lg:block">
          <div className="sticky top-3 flex h-[calc(100vh-24px)] flex-col">
            <AdminBrand title={title} subtitle={subtitle} />
            <AdminDesktopNav items={navItems} locale={locale} />
            <AdminSiteLink href={siteHomeHref} locale={locale} />
            <AdminIdentity
              accountLabel={accountLabel}
              identityRole={identityRole}
              locale={locale}
              showSignOut={showSignOut}
            />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <AdminTopBarClient
            title={title}
            subtitle={subtitle}
            navItems={navItems}
            locale={locale}
            accountLabel={accountLabel}
            shortName={shortName}
            identityRole={identityRole}
            showSignOut={showSignOut}
            siteHomeHref={siteHomeHref}
          />
          <main className="min-w-0 px-3 py-3 sm:px-4 lg:px-6 lg:py-5">{children}</main>
        </div>
      </div>
    </div>
  );
}

function AdminSiteLink({
  href,
  locale,
}: Readonly<{
  href: string;
  locale: "it" | "zh";
}>) {
  return (
    <Link
      href={href}
      className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-black/5 bg-white px-2 py-2 text-xs text-stone-700 shadow-sm transition-colors hover:border-black/10 hover:text-stone-950"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-stone-100 text-stone-600">
        <ExternalLink className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-black">
          {locale === "it" ? "Torna al sito" : "返回前端首页"}
        </span>
        <span className="mt-0.5 block truncate text-xs font-semibold text-stone-500">
          {locale === "it" ? "Homepage pubblica" : "商城首页"}
        </span>
      </span>
      <Home className="h-4 w-4 text-stone-400" />
    </Link>
  );
}

function AdminIdentity({
  accountLabel,
  identityRole,
  locale,
  showSignOut,
}: Readonly<{
  accountLabel: string;
  identityRole?: string;
  locale: "it" | "zh";
  showSignOut: boolean;
}>) {
  return (
    <div className="mt-2 rounded-lg border border-black/5 bg-white p-2 shadow-sm">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">
        {identityRole ?? (locale === "it" ? "Account" : "账户")}
      </p>
      <p className="mt-1 truncate text-xs font-black text-stone-950">{accountLabel}</p>
      {showSignOut ? (
        <form action="/api/auth/sign-out" method="post" className="mt-3">
          <input type="hidden" name="locale" value={locale} />
          <button
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-stone-950 px-3 text-xs font-black text-white transition-colors hover:bg-stone-800"
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            {locale === "it" ? "Esci" : "退出登录"}
          </button>
        </form>
      ) : null}
    </div>
  );
}
