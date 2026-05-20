import Link from "next/link";
import Image from "next/image";
import { PackageCheck, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  getCategoryLabel,
  getProductStatus,
  qualityStyles,
  type Product,
} from "@/lib/catalog";
import type { Dictionary, Locale } from "@/lib/i18n";
import { localizePath } from "@/lib/i18n";
import { formatMoney } from "@/lib/pricing";

const statusClass = {
  in_stock: "text-emerald-700 bg-emerald-50 border-emerald-200",
  low_stock: "text-orange-700 bg-orange-50 border-orange-200",
  out_of_stock: "text-rose-700 bg-rose-50 border-rose-200",
  incoming: "text-violet-700 bg-violet-50 border-violet-200",
};

export function ProductCard({
  product,
  locale,
  dictionary,
}: Readonly<{
  product: Product;
  locale: Locale;
  dictionary: Dictionary;
}>) {
  const status = getProductStatus(product);
  const statusLabel = {
    in_stock: dictionary.common.inStock,
    low_stock: dictionary.common.lowStock,
    out_of_stock: dictionary.common.outOfStock,
    incoming: dictionary.common.preorder,
  }[status] as string;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/70">
      <Link
        href={localizePath(locale, `/products/${product.slug}`)}
        className="relative block aspect-[4/3] overflow-hidden bg-slate-100"
      >
        <Image
          src={product.image}
          alt={product.names[locale]}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge className={qualityStyles[product.quality]}>{product.quality}</Badge>
          <Badge className={statusClass[status]}>{statusLabel}</Badge>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase text-slate-500">
            {product.brand} / {getCategoryLabel(product.category, locale)}
          </p>
          <Link
            href={localizePath(locale, `/products/${product.slug}`)}
            className="line-clamp-2 text-base font-bold text-slate-950 hover:text-blue-700"
          >
            {product.names[locale]}
          </Link>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
            {product.descriptions[locale]}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
          <div>
            <dt className="text-xs text-slate-500">SKU</dt>
            <dd className="font-mono text-xs font-semibold text-slate-800">
              {product.sku}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{dictionary.common.moq as string}</dt>
            <dd className="font-semibold text-slate-800">{product.moq}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-xs text-slate-500">
              {dictionary.common.retail as string}
            </dt>
            <dd className="font-semibold text-slate-950">
              {formatMoney(product.retailPrice, locale)}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex gap-2">
          <ButtonLink
            href={localizePath(locale, `/products/${product.slug}`)}
            variant="secondary"
            className="flex-1"
          >
            <PackageCheck className="h-4 w-4" />
            {dictionary.common.viewProduct as string}
          </ButtonLink>
          <ButtonLink href={localizePath(locale, "/cart")} className="px-3">
            <ShoppingCart className="h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}
