"use client";

import { ShoppingCart } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HomeProduct } from "@/lib/home-data";
import type { Locale } from "@/types";

import { PartVisual } from "./part-visual";

type ProductCardProps = Readonly<{
  product: HomeProduct;
  locale: Locale;
  labels: {
    stock: string;
    add: string;
  };
  onAdd: (product: HomeProduct) => void;
}>;

export function ProductCard({
  product,
  locale,
  labels,
  onAdd,
}: ProductCardProps) {
  return (
    <article className="group grid min-w-0 grid-cols-[76px_1fr] gap-3 rounded-lg border border-border bg-card p-2.5 text-card-foreground shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-border hover:shadow-[var(--shadow-sm)] sm:grid-cols-1 sm:p-3">
      <PartVisual className="self-start sm:min-h-28" variant={product.visual} />

      <div className="grid min-w-0 gap-2">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold leading-5 sm:text-sm">
              {product.name[locale]}
            </p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {product.sku}
            </p>
          </div>
          <Badge className="shrink-0" variant="quality">
            {product.quality}
          </Badge>
        </div>

        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground">{product.brand}</p>
            <p className="font-semibold text-foreground">{product.price}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">{labels.stock}</p>
            <p className="font-mono text-xs font-semibold text-success">
              {product.stock}
            </p>
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => onAdd(product)}
          size="sm"
          type="button"
        >
          <ShoppingCart aria-hidden="true" />
          {labels.add}
        </Button>
      </div>
    </article>
  );
}
