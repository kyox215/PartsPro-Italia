import Link from "next/link";
import { Menu, Search, ShoppingCart } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { Locale, Dictionary } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";

export function SiteHeader({
  locale,
  dictionary,
}: Readonly<{ locale: Locale; dictionary: Dictionary }>) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">
            PP
          </span>
          <span className="hidden text-sm font-bold text-slate-950 sm:block">
            {dictionary.brand as string}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {[
            ["products", dictionary.nav.products],
            ["b2b", dictionary.nav.b2b],
            ["rma", dictionary.nav.rma],
            ["account", dictionary.nav.account],
            ["admin", dictionary.nav.admin],
          ].map(([path, label]) => (
            <Link
              key={path as string}
              href={localizePath(locale, `/${path}`)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {label as string}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={localizePath(locale, "/products")}
            className="hidden h-10 items-center justify-center rounded-lg border border-slate-200 px-3 text-slate-700 transition hover:border-blue-300 hover:text-blue-700 sm:flex"
            aria-label={dictionary.common.search as string}
          >
            <Search className="h-4 w-4" />
          </Link>
          <LanguageSwitcher locale={locale} />
          <ButtonLink
            href={localizePath(locale, "/cart")}
            variant="dark"
            className="h-10 px-3"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{dictionary.nav.cart as string}</span>
          </ButtonLink>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
            aria-label="Menu"
            type="button"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
