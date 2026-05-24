import Link from "next/link";

import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { PartVisual } from "@/components/product/part-visual";
import { QualityBadge } from "@/components/product/quality-badge";
import { StockBadge } from "@/components/product/stock-badge";
import type { CatalogSkuView } from "@/lib/catalog-data";
import type { Locale } from "@/types";

type CatalogProductCardProps = Readonly<{
  sku: CatalogSkuView;
  locale: Locale;
  labels: {
    stock: string;
    model: string;
    add: string;
    addedTitle: string;
    addedDescription: string;
    inStock: string;
    lowStock: string;
    outOfStock: string;
  };
}>;

export function CatalogProductCard({
  sku,
  locale,
  labels,
}: CatalogProductCardProps) {
  return (
    <article className="grid min-w-0 grid-cols-[72px_1fr] gap-2 rounded-lg border border-border bg-card p-2 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-primary-border hover:shadow-[var(--shadow-sm)] sm:grid-cols-1 sm:gap-3 sm:p-3">
      <Link href={`/${locale}/product/${sku.product.slug}`}>
        <PartVisual
          className="min-h-[72px] sm:min-h-32"
          variant={sku.product.visual}
        />
      </Link>
      <div className="grid min-w-0 gap-1.5 sm:gap-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <Link
            className="min-w-0 hover:text-primary"
            href={`/${locale}/product/${sku.product.slug}`}
          >
            <h2 className="truncate text-[13px] font-semibold leading-5 sm:text-sm">
              {sku.product.name[locale]}
            </h2>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {sku.sku}
            </p>
          </Link>
          <QualityBadge quality={sku.quality} />
        </div>

        <div className="hidden min-w-0 flex-wrap gap-1.5 text-[11px] text-muted-foreground sm:flex">
          <span>{sku.brand.name}</span>
          <span>•</span>
          <span className="truncate">
            {labels.model}: {sku.product.modelCodes.join(", ")}
          </span>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] text-muted-foreground">{labels.stock}</p>
            <StockBadge labels={labels} stock={sku.stock} />
          </div>
          <p className="text-sm font-semibold sm:text-base">{sku.priceLabel}</p>
        </div>

        <AddToCartButton
          className="h-8 text-xs sm:h-9 sm:text-sm"
          labels={labels}
          locale={locale}
          sku={sku}
        />
      </div>
    </article>
  );
}
