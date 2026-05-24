import Link from "next/link";
import { Grid2X2, Heart, Home, ShoppingCart, UserRound } from "lucide-react";

import type { Locale } from "@/types";

type MobileBottomNavProps = Readonly<{
  locale: Locale;
  labels: {
    home: string;
    categories: string;
    cart: string;
    favorites: string;
    account: string;
  };
}>;

export function MobileBottomNav({ locale, labels }: MobileBottomNavProps) {
  const items = [
    { label: labels.home, href: `/${locale}`, icon: Home, active: true },
    { label: labels.categories, href: `/${locale}/products`, icon: Grid2X2 },
    { label: labels.cart, href: `/${locale}`, icon: ShoppingCart },
    { label: labels.favorites, href: `/${locale}`, icon: Heart },
    { label: labels.account, href: `/${locale}/account`, icon: UserRound },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[45] border-t border-border bg-surface px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(15,23,42,0.04)] md:hidden">
      <div className="mx-auto grid h-14 max-w-md grid-cols-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              className="flex min-w-0 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-primary data-[active=true]:text-primary"
              data-active={item.active ? "true" : undefined}
              href={item.href}
              key={item.label}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
