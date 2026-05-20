"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export const cartStorageKey = "partspro-cart-v1";

export type StoredCartItem = {
  sku: string;
  quantity: number;
};

export function AddToCartButton({
  sku,
  quantity,
  label,
  addedLabel,
  disabled = false,
  className,
}: Readonly<{
  sku: string;
  quantity: number;
  label: string;
  addedLabel: string;
  disabled?: boolean;
  className?: string;
}>) {
  const [added, setAdded] = useState(false);

  return (
    <button
      className={cn(
        "inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400",
        className,
      )}
      disabled={disabled}
      type="button"
      onClick={() => {
        addCartItem(sku, quantity);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
    >
      <ShoppingCart className="h-4 w-4" />
      {added ? addedLabel : label}
    </button>
  );
}

export function QuantityAddToCart({
  sku,
  minQuantity,
  label,
  addedLabel,
  disabled = false,
}: Readonly<{
  sku: string;
  minQuantity: number;
  label: string;
  addedLabel: string;
  disabled?: boolean;
}>) {
  const [quantity, setQuantity] = useState(minQuantity);

  return (
    <div className="grid gap-3 sm:grid-cols-[132px_1fr]">
      <div className="grid h-11 grid-cols-[36px_1fr_36px] overflow-hidden rounded-lg border border-slate-300 bg-white">
        <button
          aria-label="Decrease quantity"
          className="inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
          disabled={quantity <= minQuantity || disabled}
          type="button"
          onClick={() => setQuantity((value) => Math.max(minQuantity, value - 1))}
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          aria-label="Quantity"
          className="min-w-0 border-x border-slate-200 text-center text-sm font-bold text-slate-950 outline-none"
          min={minQuantity}
          type="number"
          value={quantity}
          disabled={disabled}
          onChange={(event) =>
            setQuantity(Math.max(minQuantity, Number.parseInt(event.target.value, 10) || minQuantity))
          }
        />
        <button
          aria-label="Increase quantity"
          className="inline-flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:text-slate-300"
          disabled={disabled}
          type="button"
          onClick={() => setQuantity((value) => value + 1)}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <AddToCartButton
        sku={sku}
        quantity={quantity}
        label={label}
        addedLabel={addedLabel}
        disabled={disabled}
        className="h-11"
      />
    </div>
  );
}

export function readCartItems(): StoredCartItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(cartStorageKey) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return normalizeStoredItems(parsed);
  } catch {
    return [];
  }
}

export function writeCartItems(items: StoredCartItem[]) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(normalizeStoredItems(items)));
  window.dispatchEvent(new CustomEvent("partspro-cart-updated"));
}

export function addCartItem(sku: string, quantity: number) {
  const items = readCartItems();
  const current = items.find((item) => item.sku === sku);
  if (current) {
    current.quantity += quantity;
  } else {
    items.push({ sku, quantity });
  }
  writeCartItems(items);
}

function normalizeStoredItems(items: Array<{ sku?: unknown; quantity?: unknown }>) {
  const merged = new Map<string, number>();

  items.forEach((item) => {
    const sku = String(item.sku ?? "").trim();
    const quantity = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!sku || quantity <= 0) return;
    merged.set(sku, Math.min((merged.get(sku) ?? 0) + quantity, 99999));
  });

  return [...merged.entries()].map(([sku, quantity]) => ({ sku, quantity }));
}
