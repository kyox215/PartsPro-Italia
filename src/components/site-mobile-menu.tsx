"use client";

import Link from "next/link";
import * as React from "react";
import { Menu, Search, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";

export function SiteMobileMenu({
  locale,
  navItems,
  searchLabel,
}: Readonly<{
  locale: Locale;
  navItems: Array<{ href: string; label: string }>;
  searchLabel: string;
}>) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
        aria-label={locale === "it" ? "Apri menu" : "打开菜单"}
        aria-expanded={open}
        type="button"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/30"
            aria-label={locale === "it" ? "Chiudi menu" : "关闭菜单"}
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-[min(88vw,320px)] flex-col bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <span className="text-sm font-black text-slate-950">
                {locale === "it" ? "Menu" : "菜单"}
              </span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
                aria-label={locale === "it" ? "Chiudi menu" : "关闭菜单"}
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="grid gap-1 py-3">
              <Link
                href={localizePath(locale, "/products")}
                onClick={() => setOpen(false)}
                className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 text-sm font-bold text-slate-900"
              >
                <Search className="h-4 w-4 text-slate-500" />
                <span>{searchLabel}</span>
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      ) : null}
    </>
  );
}
