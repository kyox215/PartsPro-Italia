"use client";

import { toast } from "@/components/ui/toast";
import { ProductCard } from "@/components/product/product-card";
import type { HomeProduct } from "@/lib/home-data";
import type { Locale } from "@/types";

type ProductShelfProps = Readonly<{
  products: HomeProduct[];
  locale: Locale;
  labels: {
    stock: string;
    add: string;
    toastTitle: string;
    toastDescription: string;
  };
}>;

export function ProductShelf({ products, locale, labels }: ProductShelfProps) {
  function addProduct(product: HomeProduct) {
    toast({
      variant: "success",
      title: labels.toastTitle,
      description: `${product.sku} ${labels.toastDescription}`,
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          labels={labels}
          locale={locale}
          onAdd={addProduct}
          product={product}
        />
      ))}
    </div>
  );
}
