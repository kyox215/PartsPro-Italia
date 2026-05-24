"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";

import { PartVisual } from "@/components/product/part-visual";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { listItemMotion, softPopTransition } from "@/lib/motion";
import { cn } from "@/lib/utils";

import { useCart } from "./cart-provider";

type CartDrawerProps = Readonly<{
  labels: {
    cart: string;
    empty: string;
    subtotal: string;
    checkout: string;
    clear: string;
    increase: string;
    decrease: string;
    remove: string;
  };
  className?: string;
}>;

export function CartDrawer({ labels, className }: CartDrawerProps) {
  const cart = useCart();
  const shouldReduceMotion = useReducedMotion();

  return (
    <Drawer>
      <DrawerTrigger
        aria-label={labels.cart}
        className={cn(
          buttonVariants({ size: "icon-sm", variant: "ghost" }),
          "relative",
          className,
        )}
        type="button"
      >
        <ShoppingCart aria-hidden="true" />
        <AnimatePresence>
          {cart.totalItems ? (
            <motion.span
              animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
              className="absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white"
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.6 }}
              key={cart.totalItems}
              transition={softPopTransition}
            >
              {cart.totalItems}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </DrawerTrigger>
      <DrawerContent side="right">
        <DrawerHeader>
          <DrawerTitle>{labels.cart}</DrawerTitle>
          <DrawerDescription>{cart.totalItems} SKU</DrawerDescription>
        </DrawerHeader>

        <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1">
          {cart.items.length ? (
            <AnimatePresence initial={false}>
              {cart.items.map((item) => (
                <motion.article
                  animate={shouldReduceMotion ? undefined : listItemMotion.animate}
                  className="grid grid-cols-[64px_1fr] gap-3 rounded-lg border border-border bg-surface p-2"
                  exit={shouldReduceMotion ? undefined : listItemMotion.exit}
                  initial={shouldReduceMotion ? undefined : listItemMotion.initial}
                  key={item.sku}
                  layout={!shouldReduceMotion}
                  transition={listItemMotion.transition}
                >
                  <PartVisual className="min-h-16" variant={item.visual} />
                  <div className="min-w-0 space-y-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      <p className="truncate font-mono text-[11px] text-muted-foreground">
                        {item.sku}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="quality">{item.quality}</Badge>
                      <span className="font-semibold">{item.priceLabel}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-md border border-border">
                        <Button
                          aria-label={labels.decrease}
                          onClick={() => cart.decrementItem(item.sku)}
                          size="icon-xs"
                          type="button"
                          variant="ghost"
                        >
                          <Minus aria-hidden="true" />
                        </Button>
                        <motion.span
                          animate={
                            shouldReduceMotion
                              ? undefined
                              : { opacity: 1, scale: [1, 1.12, 1] }
                          }
                          className="w-7 text-center font-mono text-xs"
                          key={item.quantity}
                          transition={{ duration: 0.18 }}
                        >
                          {item.quantity}
                        </motion.span>
                        <Button
                          aria-label={labels.increase}
                          onClick={() => cart.addItem(item)}
                          size="icon-xs"
                          type="button"
                          variant="ghost"
                        >
                          <Plus aria-hidden="true" />
                        </Button>
                      </div>
                      <Button
                        aria-label={labels.remove}
                        onClick={() => cart.removeItem(item.sku)}
                        size="icon-xs"
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              className="flex min-h-44 items-center justify-center rounded-lg border border-dashed border-border bg-surface-muted px-4 text-center text-sm text-muted-foreground"
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
              transition={listItemMotion.transition}
            >
              {labels.empty}
            </motion.div>
          )}
        </div>

        <DrawerFooter>
          <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">{labels.subtotal}</span>
            <strong>€{cart.subtotal.toFixed(2).replace(".", ",")}</strong>
          </div>
          <Button disabled={!cart.items.length} type="button">
            {labels.checkout}
          </Button>
          <Button
            disabled={!cart.items.length}
            onClick={cart.clearCart}
            type="button"
            variant="outline"
          >
            {labels.clear}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
