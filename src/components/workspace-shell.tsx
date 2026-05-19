"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Boxes,
  Building2,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  PackagePlus,
  RotateCcw,
  Settings,
  ShoppingBag,
  UserRound,
  UsersRound,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceIcon =
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

export type WorkspaceNavItem = {
  href: string;
  label: string;
  description?: string;
  icon: WorkspaceIcon;
};

const icons: Record<WorkspaceIcon, LucideIcon> = {
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

export function WorkspaceShell({
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
  navItems: WorkspaceNavItem[];
  locale: "it" | "zh";
  identityEmail?: string;
  identityRole?: string;
  showSignOut?: boolean;
}>) {
  const pathname = usePathname();

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-4">
            <p className="text-xs font-bold uppercase text-blue-700">{title}</p>
            <h1 className="mt-2 text-xl font-bold text-slate-950">{subtitle}</h1>
            {identityEmail ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-3">
                <p className="truncate text-xs font-semibold text-slate-500">
                  {identityRole ?? (locale === "it" ? "Account" : "账户")}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-950">
                  {identityEmail}
                </p>
              </div>
            ) : null}
          </div>

          <details className="border-b border-slate-200 lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-950">
              {locale === "it" ? "Menu area" : "工作台菜单"}
            </summary>
            <WorkspaceNav pathname={pathname} items={navItems} compact />
          </details>

          <div className="hidden lg:block">
            <WorkspaceNav pathname={pathname} items={navItems} />
          </div>

          {showSignOut ? (
            <form
              action="/api/auth/sign-out"
              method="post"
              className="border-t border-slate-200 p-3"
            >
              <input type="hidden" name="locale" value={locale} />
              <button
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 transition hover:border-blue-300 hover:text-blue-700"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                {locale === "it" ? "Esci" : "退出登录"}
              </button>
            </form>
          ) : null}
        </div>
      </aside>

      <section className="min-w-0">{children}</section>
    </div>
  );
}

function WorkspaceNav({
  pathname,
  items,
  compact = false,
}: Readonly<{
  pathname: string;
  items: WorkspaceNavItem[];
  compact?: boolean;
}>) {
  return (
    <nav className={cn("grid gap-1 p-3", compact && "pt-0")}>
      {items.map((item) => {
        const Icon = icons[item.icon];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "grid grid-cols-[auto_1fr] gap-3 rounded-lg px-3 py-2.5 text-sm transition",
              active
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            <Icon className="mt-0.5 h-4 w-4" />
            <span>
              <span className="block font-bold">{item.label}</span>
              {item.description ? (
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-5",
                    active ? "text-slate-300" : "text-slate-500",
                  )}
                >
                  {item.description}
                </span>
              ) : null}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
