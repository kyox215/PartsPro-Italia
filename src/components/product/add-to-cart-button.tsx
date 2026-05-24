"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { CatalogSkuView } from "@/lib/catalog-data";
import { motionTimings, softPopTransition } from "@/lib/motion";
import type { Locale } from "@/types";

import { useCart, type CartSkuSnapshot } from "../cart/cart-provider";

type AddToCartButtonProps = Readonly<{
  sku: CatalogSkuView;
  locale: Locale;
  labels: {
    add: string;
    addedTitle: string;
    addedDescription: string;
  };
  className?: string;
}>;

export function AddToCartButton({
  sku,
  locale,
  labels,
  className,
}: AddToCartButtonProps) {
  const cart = useCart();
  const shouldReduceMotion = useReducedMotion();
  const [isBurstVisible, setIsBurstVisible] = React.useState(false);
  const burstTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (burstTimeoutRef.current) {
        window.clearTimeout(burstTimeoutRef.current);
      }
    };
  }, []);

  function addToCart() {
    const snapshot: CartSkuSnapshot = {
      sku: sku.sku,
      name: sku.product.name[locale],
      brand: sku.brand.name,
      quality: sku.quality,
      price: sku.price,
      priceLabel: sku.priceLabel,
      visual: sku.product.visual,
    };

    cart.addItem(snapshot);
    setIsBurstVisible(true);
    if (burstTimeoutRef.current) {
      window.clearTimeout(burstTimeoutRef.current);
    }
    burstTimeoutRef.current = window.setTimeout(() => {
      setIsBurstVisible(false);
    }, 520);

    toast({
      variant: "success",
      title: labels.addedTitle,
      description: `${sku.sku} ${labels.addedDescription}`,
    });
  }

  return (
    <motion.div
      className="relative inline-flex w-full"
      transition={softPopTransition}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
    >
      <Button className={className} onClick={addToCart} type="button">
        <ShoppingCart aria-hidden="true" />
        {labels.add}
      </Button>
      <AnimatePresence>
        {!shouldReduceMotion && isBurstVisible ? (
          <motion.span
            animate={{ opacity: 1, scale: 1, y: -8 }}
            className="pointer-events-none absolute -top-2 right-2 flex size-6 items-center justify-center rounded-full bg-success text-white shadow-[var(--shadow-sm)]"
            exit={{ opacity: 0, scale: 0.7, y: -14 }}
            initial={{ opacity: 0, scale: 0.6, y: 0 }}
            transition={{ duration: motionTimings.slow, ease: "easeOut" }}
          >
            <Check className="size-3.5" aria-hidden="true" />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}
