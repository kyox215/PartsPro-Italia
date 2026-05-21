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
  PackagePlus,
  Settings,
  ShoppingBag,
  UserRound,
  UsersRound,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import type { WorkspaceIcon, WorkspaceNavItem } from "@/components/workspace-shell-types";
import { cn } from "@/lib/utils";

const icons: Record<WorkspaceIcon, LucideIcon> = {
  activity: Activity,
  boxes: Boxes,
  building: Building2,
  clipboard: ClipboardList,
  file: FileText,
  home: Home,
  package: PackagePlus,
  settings: Settings,
  shopping: ShoppingBag,
  user: UserRound,
  users: UsersRound,
  warehouse: Warehouse,
};

export function WorkspaceNavClient({
  items,
  compact = false,
}: Readonly<{
  items: WorkspaceNavItem[];
  compact?: boolean;
}>) {
  const pathname = usePathname();

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
              "grid min-w-0 grid-cols-[auto_1fr] gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-slate-950 text-white"
                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            <Icon className="mt-0.5 h-4 w-4" />
            <span className="min-w-0">
              <span className="block truncate font-bold">{item.label}</span>
              {item.description ? (
                <span
                  className={cn(
                    "mt-0.5 block truncate text-xs leading-5",
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
