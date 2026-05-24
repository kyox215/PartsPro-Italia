import { Skeleton } from "@/components/ui/skeleton";
import type { CatalogSkuView } from "@/lib/catalog-data";
import type { Locale } from "@/types";

import { CatalogProductCard } from "./catalog-product-card";

type CatalogProductGridProps = Readonly<{
  skus: CatalogSkuView[];
  locale: Locale;
  labels: {
    empty: string;
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

export function CatalogProductGrid({
  skus,
  locale,
  labels,
}: CatalogProductGridProps) {
  if (!skus.length) {
    return (
      <div className="flex min-h-52 items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-muted-foreground">
        {labels.empty}
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
      {skus.map((sku) => (
        <CatalogProductCard
          key={sku.id}
          labels={labels}
          locale={locale}
          sku={sku}
        />
      ))}
    </div>
  );
}

export function CatalogGridSkeleton() {
  return (
    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton className="h-36 rounded-lg" key={index} />
      ))}
    </div>
  );
}
