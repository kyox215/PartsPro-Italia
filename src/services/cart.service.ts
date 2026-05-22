import { getProductBySku } from '@/services/products.service'
import type { CartItem, CartLine, CartSummary } from '@/types/cart'

const vatRate = 0.22
const standardShipping = 7.9
const freeShippingThreshold = 250

export function buildCartLines(items: CartItem[]): CartLine[] {
  return items
    .map((item) => {
      const product = getProductBySku(item.skuCode)

      if (!product) {
        return null
      }

      const quantity = Math.max(item.quantity, 1)
      const unitPrice = product.b2bPrice
      const subtotal = unitPrice * quantity

      return {
        product,
        quantity,
        unitPrice,
        subtotal,
        isBelowMoq: quantity < product.moq,
        isOutOfStock: product.stockStatus === 'out_of_stock',
      }
    })
    .filter((line): line is CartLine => Boolean(line))
}

export function calculateCartSummary(lines: CartLine[]): CartSummary {
  const subtotal = lines.reduce((total, line) => total + line.subtotal, 0)
  const vat = subtotal * vatRate
  const shipping = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShipping
  const totalQuantity = lines.reduce((total, line) => total + line.quantity, 0)

  return {
    subtotal,
    vat,
    shipping,
    total: subtotal + vat + shipping,
    totalQuantity,
  }
}
