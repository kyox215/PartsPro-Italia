"use client";

import * as React from "react";

import type { CatalogVisual } from "@/lib/catalog-data";

export type CartSkuSnapshot = {
  sku: string;
  name: string;
  brand: string;
  quality: string;
  price: number;
  priceLabel: string;
  visual: CatalogVisual;
};

export type CartItem = CartSkuSnapshot & {
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: CartSkuSnapshot) => void;
  decrementItem: (sku: string) => void;
  removeItem: (sku: string) => void;
  clearCart: () => void;
};

const CartContext = React.createContext<CartContextValue | null>(null);
const storageKey = "partspro-cart";

export function CartProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [hasLoadedCart, setHasLoadedCart] = React.useState(false);

  React.useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const rawValue = window.localStorage.getItem(storageKey);

      if (rawValue) {
        try {
          setItems(JSON.parse(rawValue) as CartItem[]);
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }

      setHasLoadedCart(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  React.useEffect(() => {
    if (!hasLoadedCart) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hasLoadedCart, items]);

  const value = React.useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    return {
      items,
      totalItems,
      subtotal,
      addItem(item) {
        setItems((current) => {
          const existingItem = current.find(
            (cartItem) => cartItem.sku === item.sku,
          );

          if (!existingItem) {
            return [...current, { ...item, quantity: 1 }];
          }

          return current.map((cartItem) =>
            cartItem.sku === item.sku
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem,
          );
        });
      },
      decrementItem(sku) {
        setItems((current) =>
          current
            .map((item) =>
              item.sku === sku
                ? { ...item, quantity: Math.max(0, item.quantity - 1) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        );
      },
      removeItem(sku) {
        setItems((current) => current.filter((item) => item.sku !== sku));
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = React.useContext(CartContext);

  if (!value) {
    throw new Error("useCart must be used inside CartProvider.");
  }

  return value;
}
