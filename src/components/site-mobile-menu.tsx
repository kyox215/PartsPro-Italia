"use client";

import Link from "next/link";
import * as React from "react";
import { Menu, Search, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";

export function SiteMobileMenu({
  locale,
  navItems,
  catalogLabel,
}: Readonly<{
  locale: Locale;
  navItems: Array<{ href: string; label: string }>;
  catalogLabel: string;
}>) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
        <div
          className="fixed inset-0 z-[100] flex min-h-[100dvh] flex-col overflow-y-auto bg-white md:hidden"
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex h-14 items-center justify-between gap-3">
              <Link
                href={`/${locale}`}
                onClick={() => setOpen(false)}
                className="flex min-w-0 items-center gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">
                  PP
                </span>
                <span className="truncate text-base font-black text-slate-950">
                  {locale === "it" ? "Menu" : "菜单"}
                </span>
              </Link>
              <button
                type="button"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
                aria-label={locale === "it" ? "Chiudi menu" : "关闭菜单"}
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <nav className="grid gap-2 px-4 py-5">
            <Link
              href={localizePath(locale, "/products")}
              onClick={() => setOpen(false)}
              className="grid min-h-14 grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-black text-slate-950"
            >
              <Search className="h-5 w-5 text-slate-500" />
              <span className="min-w-0 truncate">{catalogLabel}</span>
            </Link>

            {navItems.length > 0 ? (
              <div className="mt-2 grid gap-1 border-t border-slate-100 pt-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-12 items-center rounded-xl px-4 py-3 text-base font-black text-slate-800 hover:bg-slate-50 hover:text-slate-950"
                  >
                    <span className="min-w-0 truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </nav>

          <div className="mt-auto space-y-3 border-t border-slate-100 px-4 py-4">
            <LanguageSwitcher locale={locale} />
            <p className="text-xs font-semibold leading-5 text-slate-500">
              {locale === "it"
                ? "Accedi per vedere prezzi, disponibilita e ordini."
                : "登录后可查看价格、库存和订单记录。"}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
