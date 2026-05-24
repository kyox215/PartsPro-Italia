import Link from "next/link";
import { Package, Search, UserRound } from "lucide-react";

import { AdminActionButton } from "@/components/admin/admin-action-button";
import { Input } from "@/components/ui/input";
import type { AppRole, Dictionary, Locale } from "@/types";

type AdminTopbarProps = Readonly<{
  copy: Dictionary["admin"];
  email?: string | null;
  locale: Locale;
  role?: AppRole | null;
}>;

export function AdminTopbar({ copy, email, locale, role }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <div className="flex h-14 min-w-0 items-center gap-2 px-3 sm:px-4">
        <Link
          className="flex min-w-0 items-center gap-2 font-semibold lg:hidden"
          href={`/${locale}/admin`}
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate">PartsPro</span>
        </Link>

        <div className="relative ml-auto hidden w-full max-w-sm md:block lg:ml-0">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="h-8 pl-9" placeholder={copy.topbar.search} />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <AdminActionButton action="export" labels={copy.table}>
            {copy.topbar.export}
          </AdminActionButton>
          <AdminActionButton action="sync" labels={copy.table} variant="soft">
            {copy.topbar.sync}
          </AdminActionButton>
          <Link
            className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 text-xs shadow-[var(--shadow-xs)] sm:flex"
            href={`/${locale}/account`}
          >
            <UserRound className="size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate font-medium">{email ?? "admin"}</span>
              <span className="block truncate font-mono text-[10px] text-muted-foreground">
                {role ?? "role"}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
