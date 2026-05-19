"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ locale }: Readonly<{ locale: Locale }>) {
  const pathname = usePathname();
  const withoutLocale = pathname.replace(/^\/(it|zh)/, "") || "/";

  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {locales.map((targetLocale) => (
        <Link
          key={targetLocale}
          href={`/${targetLocale}${withoutLocale === "/" ? "" : withoutLocale}`}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-semibold transition",
            targetLocale === locale
              ? "bg-slate-950 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
          )}
        >
          {targetLocale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
