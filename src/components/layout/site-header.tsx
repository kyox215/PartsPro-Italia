import Link from "next/link";
import { Package, Search, UserRound } from "lucide-react";

import { CartDrawer } from "@/components/cart/cart-drawer";
import { buttonVariants } from "@/components/ui/button";
import type { Locale } from "@/types";

type SiteHeaderProps = Readonly<{
  locale: Locale;
  labels: {
    categories: string;
    search: string;
    cart: string;
    account: string;
  };
  cartLabels: {
    cart: string;
    empty: string;
    subtotal: string;
    checkout: string;
    clear: string;
    increase: string;
    decrease: string;
    remove: string;
  };
}>;

export function SiteHeader({ locale, labels, cartLabels }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-3 sm:px-5">
        <Link
          className="flex min-w-0 items-center gap-2 font-semibold text-foreground"
          href={`/${locale}`}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Package className="size-5" aria-hidden="true" />
          </span>
          <span className="truncate">PartsPro</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={`/${locale}/products`}
          >
            {labels.categories}
          </Link>
          <Link
            className={buttonVariants({ variant: "ghost" })}
            href={`/${locale}/search`}
          >
            {labels.search}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Link
            aria-label={labels.search}
            className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
            href={`/${locale}/search`}
          >
            <Search aria-hidden="true" />
          </Link>
          <CartDrawer labels={cartLabels} />
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            href={`/${locale}/account`}
          >
            <UserRound aria-hidden="true" />
            <span className="hidden sm:inline">{labels.account}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
