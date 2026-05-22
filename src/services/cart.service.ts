import { getProductBySku } from '@/services/products.service'
import type { CartItem, CartLine, CartSummary, CheckoutPayload, CreatedOrder } from '@/types/cart'

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

export async function createOrderFromCart(payload: CheckoutPayload): Promise<CreatedOrder> {
  const lines = buildCartLines(payload.items)
  const hasInvalidLine = lines.some((line) => line.isBelowMoq || line.isOutOfStock)

  if (hasInvalidLine) {
    throw new Error('Carrello non valido: controlla MOQ e disponibilita stock.')
  }

  // Placeholder for Supabase RPC: create_order_from_cart.
  // The order price is recalculated here from product data and must later be recalculated server-side.
  return {
    orderId: `SO-${Date.now()}`,
    status: 'submitted',
    summary: calculateCartSummary(lines),
  }
}
