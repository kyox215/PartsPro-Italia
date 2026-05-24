"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { AppRole, Dictionary, Locale } from "@/types";

type AdminSidebarProps = Readonly<{
  copy: Dictionary["admin"]["sidebar"];
  locale: Locale;
  role?: AppRole | null;
}>;

const navItems = [
  { key: "dashboard", href: "/admin", icon: LayoutDashboard },
  { key: "products", href: "/admin/products", icon: Boxes },
  { key: "orders", href: "/admin/orders", icon: ShoppingBag },
  { key: "customers", href: "/admin/customers", icon: Users },
  { key: "inventory", href: "/admin/inventory", icon: ClipboardList },
] as const;

export function AdminSidebar({ copy, locale, role }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar p-3 text-sidebar-foreground lg:block">
      <div className="sticky top-0 grid gap-4">
        <Link
          className="flex items-center gap-2 rounded-lg px-2 py-2 font-semibold"
          href={`/${locale}/admin`}
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Package className="size-5" aria-hidden="true" />
          </span>
          PartsPro
        </Link>

        <nav className="grid gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const href = `/${locale}${item.href}`;
            const active =
              item.href === "/admin"
                ? pathname === href
                : pathname.startsWith(href);

            return (
              <Link
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active &&
                    "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                )}
                href={href}
                key={item.key}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{copy[item.key]}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-lg border border-sidebar-border bg-surface-muted p-3 text-xs">
          <p className="text-muted-foreground">{copy.role}</p>
          <p className="mt-1 font-mono font-semibold">{role ?? "unknown"}</p>
        </div>
      </div>
    </aside>
  );
}

export function AdminMobileNav({ copy, locale }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const href = `/${locale}${item.href}`;
        const active =
          item.href === "/admin" ? pathname === href : pathname.startsWith(href);

        return (
          <Link
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-primary-soft hover:text-secondary-foreground",
              active && "bg-primary-soft font-medium text-secondary-foreground",
            )}
            href={href}
            key={item.key}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {copy[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
