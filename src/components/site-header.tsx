import Link from "next/link";
import { ShoppingCart, UserRound } from "lucide-react";
import { SiteMobileMenu } from "@/components/site-mobile-menu";
import type { AuthContext } from "@/lib/auth";
import type { Locale, Dictionary } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";

export function SiteHeader({
  locale,
  dictionary,
  auth,
}: Readonly<{ locale: Locale; dictionary: Dictionary; auth: AuthContext }>) {
  const navItems: Array<[string, string]> = [
    ["products", dictionary.nav.products as string],
  ];
  const accountHref = auth.user
    ? localizePath(locale, "/account")
    : localizePath(locale, "/login");

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <SiteMobileMenu
            locale={locale}
            navItems={navItems
              .filter(([path]) => path !== "products")
              .map(([path, label]) => ({
                href: localizePath(locale, `/${path}`),
                label,
              }))}
            catalogLabel={dictionary.nav.products as string}
          />
          <Link href={`/${locale}`} className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-sm font-black text-white">
              PP
            </span>
            <span className="hidden truncate text-sm font-bold text-slate-950 sm:block">
              {dictionary.brand as string}
            </span>
          </Link>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {navItems.map(([path, label]) => (
            <Link
              key={path}
              href={localizePath(locale, `/${path}`)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href={accountHref}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-sm font-bold text-slate-800 transition hover:border-blue-300 hover:text-blue-700 sm:px-3"
            aria-label={dictionary.nav.account as string}
          >
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">{dictionary.nav.account as string}</span>
          </Link>
          <Link
            href={localizePath(locale, "/cart")}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-950 bg-slate-950 px-2.5 text-sm font-bold text-white transition hover:bg-slate-800 sm:px-3"
            aria-label={dictionary.nav.cart as string}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{dictionary.nav.cart as string}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
