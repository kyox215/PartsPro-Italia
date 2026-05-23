import { defineStore } from 'pinia'
import { buildCartLines, calculateCartSummary } from '@/services/cart.service'
import type { CartItem } from '@/types/cart'

const cartStorageKey = 'partspro.cart'

function readStoredCart() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const rawCart = window.localStorage.getItem(cartStorageKey)
    return rawCart ? (JSON.parse(rawCart) as CartItem[]) : []
  } catch {
    return []
  }
}

function writeStoredCart(items: CartItem[]) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(cartStorageKey, JSON.stringify(items))
  } catch {
    // Browser storage can be unavailable in embedded/private contexts.
  }
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: readStoredCart(),
  }),
  getters: {
    lines: (state) => buildCartLines(state.items),
    summary: (state) => calculateCartSummary(buildCartLines(state.items)),
    itemCount: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    hasBlockingIssues(): boolean {
      return this.lines.some((line) => line.isBelowMoq || line.isOutOfStock)
    },
  },
  actions: {
    addItem(skuCode: string, quantity = 1) {
      const existingItem = this.items.find((item) => item.skuCode === skuCode)

      if (existingItem) {
        existingItem.quantity += quantity
        writeStoredCart(this.items)
        return
      }

      this.items.push({
        skuCode,
        quantity,
      })
      writeStoredCart(this.items)
    },
    updateQuantity(skuCode: string, quantity: number) {
      const existingItem = this.items.find((item) => item.skuCode === skuCode)

      if (!existingItem) {
        return
      }

      existingItem.quantity = Math.max(quantity, 1)
      writeStoredCart(this.items)
    },
    removeItem(skuCode: string) {
      this.items = this.items.filter((item) => item.skuCode !== skuCode)
      writeStoredCart(this.items)
    },
    clearCart() {
      this.items = []
      writeStoredCart(this.items)
    },
  },
})
