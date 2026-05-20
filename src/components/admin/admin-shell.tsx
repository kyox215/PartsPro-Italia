"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  Bell,
  Boxes,
  Building2,
  ClipboardList,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  Menu,
  MessageCircle,
  PackagePlus,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  UserRound,
  UsersRound,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminIcon =
  | "activity"
  | "boxes"
  | "building"
  | "clipboard"
  | "file"
  | "home"
  | "package"
  | "rma"
  | "settings"
  | "shopping"
  | "user"
  | "users"
  | "warehouse";

export type AdminNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: AdminIcon;
  badge?: string | number;
  children?: AdminNavItem[];
};

const icons: Record<AdminIcon, LucideIcon> = {
  activity: Activity,
  boxes: Boxes,
  building: Building2,
  clipboard: ClipboardList,
  file: FileText,
  home: Home,
  package: PackagePlus,
  rma: RotateCcw,
  settings: Settings,
  shopping: ShoppingBag,
  user: UserRound,
  users: UsersRound,
  warehouse: Warehouse,
};

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
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountLabel = identityEmail ?? (locale === "it" ? "Demo admin" : "演示管理员");
  const shortName = accountLabel.slice(0, 2).toUpperCase();
  const siteHomeHref = `/${locale}`;

  return (
    <div className="min-h-screen bg-[#eeeeec] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px]">
        <aside className="hidden w-[252px] shrink-0 border-r border-black/5 bg-[#f8f8f6] px-3 py-3 lg:block">
          <div className="sticky top-3 flex h-[calc(100vh-24px)] flex-col">
            <AdminBrand title={title} subtitle={subtitle} />
            <AdminNav pathname={pathname} items={navItems} locale={locale} />
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
          <header className="sticky top-0 z-20 border-b border-black/5 bg-[#eeeeec]/90 px-3 py-2 backdrop-blur sm:px-4 lg:px-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-stone-900 shadow-sm transition hover:border-black/20 lg:hidden"
                aria-label={locale === "it" ? "Apri menu" : "打开菜单"}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden min-w-0 flex-1 items-center rounded-lg border border-black/5 bg-white px-2.5 py-1.5 shadow-sm md:flex">
                <Search className="h-4 w-4 shrink-0 text-stone-400" />
                <input
                  className="h-6 min-w-0 flex-1 border-0 bg-transparent px-2.5 text-sm font-medium text-stone-900 outline-none placeholder:text-stone-400"
                  placeholder={
                    locale === "it"
                      ? "Cerca ordini, SKU, clienti..."
                      : "搜索订单、SKU、客户..."
                  }
                  aria-label={locale === "it" ? "Cerca" : "搜索"}
                />
                <span className="rounded-md bg-stone-100 px-2 py-1 text-xs font-bold text-stone-500">
                  ⌘K
                </span>
              </div>

              <div className="min-w-0 flex-1 md:hidden">
                <p className="truncate text-sm font-bold text-stone-950">{subtitle}</p>
                <p className="truncate text-xs font-semibold text-stone-500">{title}</p>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <Link
                  href={siteHomeHref}
                  className="hidden h-9 items-center gap-1.5 rounded-lg border border-black/5 bg-white px-2.5 text-xs font-black text-stone-700 shadow-sm transition hover:border-black/10 hover:text-stone-950 md:inline-flex"
                  title={locale === "it" ? "Torna al sito" : "返回前端首页"}
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden xl:inline">
                    {locale === "it" ? "Sito" : "前端首页"}
                  </span>
                </Link>
                <IconButton
                  label={locale === "it" ? "Messaggi" : "消息"}
                  icon={MessageCircle}
                />
                <IconButton label={locale === "it" ? "Notifiche" : "通知"} icon={Bell} />
                <div className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-black/5 bg-white px-2 shadow-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-stone-950 text-[10px] font-black text-white">
                    {shortName}
                  </span>
                  <span className="hidden max-w-[160px] truncate text-xs font-bold text-stone-800 sm:block">
                    {accountLabel}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="px-3 py-3 sm:px-4 lg:px-5 lg:py-4">{children}</main>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-stone-950/30"
            onClick={() => setMobileOpen(false)}
            aria-label={locale === "it" ? "Chiudi menu" : "关闭菜单"}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,300px)] flex-col bg-[#f8f8f6] px-3 py-3 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <AdminBrand title={title} subtitle={subtitle} compact />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-black/10 bg-white text-stone-900"
                aria-label={locale === "it" ? "Chiudi menu" : "关闭菜单"}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNav
              pathname={pathname}
              items={navItems}
              locale={locale}
              onNavigate={() => setMobileOpen(false)}
            />
            <AdminSiteLink
              href={siteHomeHref}
              locale={locale}
              onNavigate={() => setMobileOpen(false)}
            />
            <AdminIdentity
              accountLabel={accountLabel}
              identityRole={identityRole}
              locale={locale}
              showSignOut={showSignOut}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function AdminSiteLink({
  href,
  locale,
  onNavigate,
}: Readonly<{
  href: string;
  locale: "it" | "zh";
  onNavigate?: () => void;
}>) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-black/5 bg-white px-2 py-2 text-xs text-stone-700 shadow-sm transition hover:border-black/10 hover:text-stone-950"
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

function AdminBrand({
  title,
  subtitle,
  compact = false,
}: Readonly<{
  title: string;
  subtitle: string;
  compact?: boolean;
}>) {
  return (
    <div className={cn("flex items-center gap-2", compact ? "pb-0" : "pb-3")}>
      <div className="grid h-9 w-9 shrink-0 grid-cols-2 gap-1 rounded-lg bg-stone-950 p-1.5">
        <span className="rounded-sm bg-white" />
        <span className="rounded-sm bg-emerald-400" />
        <span className="rounded-sm bg-sky-400" />
        <span className="rounded-sm bg-amber-300" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-black uppercase tracking-wide text-stone-500">
          {title}
        </p>
        <h1 className="truncate text-base font-black text-stone-950">{subtitle}</h1>
      </div>
    </div>
  );
}

function AdminNav({
  pathname,
  items,
  locale,
  onNavigate,
}: Readonly<{
  pathname: string;
  items: AdminNavItem[];
  locale: "it" | "zh";
  onNavigate?: () => void;
}>) {
  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto py-1">
      <p className="mb-1 px-2 text-[10px] font-black uppercase tracking-wide text-stone-400">
        {locale === "it" ? "Workspace" : "工作区"}
      </p>
      {items.map((item) => (
        <AdminNavLink
          key={item.href}
          item={item}
          pathname={pathname}
          locale={locale}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

function AdminNavLink({
  item,
  pathname,
  locale,
  onNavigate,
}: Readonly<{
  item: AdminNavItem;
  pathname: string;
  locale: "it" | "zh";
  onNavigate?: () => void;
}>) {
  const Icon = icons[item.icon];
  const isRootAdmin = item.href.endsWith(`/${locale}/admin`);
  const active = pathname === item.href || (!isRootAdmin && pathname.startsWith(`${item.href}/`));

  return (
    <div>
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg px-2 py-2 text-xs transition",
          active
            ? "bg-stone-950 text-white shadow-sm"
            : "text-stone-700 hover:bg-white hover:text-stone-950",
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md",
            active ? "bg-white/12 text-white" : "bg-white text-stone-500",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-black">{item.label}</span>
          {item.description ? (
            <span
              className={cn(
                "mt-0.5 block truncate text-xs font-semibold",
                active ? "text-stone-300" : "text-stone-500",
              )}
            >
              {item.description}
            </span>
          ) : null}
        </span>
        {item.badge ? (
          <span
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-black",
              active ? "bg-white text-stone-950" : "bg-stone-200 text-stone-700",
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>
      {item.children?.length && active ? (
        <div className="ml-12 mt-1 grid gap-1 border-l border-black/10 pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onNavigate}
              className="rounded-md px-2 py-1.5 text-xs font-bold text-stone-500 hover:bg-white hover:text-stone-950"
            >
              {child.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
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
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-black/10 bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
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

function IconButton({
  label,
  icon: Icon,
}: Readonly<{
  label: string;
  icon: LucideIcon;
}>) {
  return (
    <button
      type="button"
      className="hidden h-9 w-9 items-center justify-center rounded-lg border border-black/5 bg-white text-stone-600 shadow-sm transition hover:border-black/10 hover:text-stone-950 sm:inline-flex"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
