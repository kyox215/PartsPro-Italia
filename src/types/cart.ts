import type { Product } from '@/types/product'

export type CartItem = {
  skuCode: string
  quantity: number
}

export type CartLine = {
  product: Product
  quantity: number
  unitPrice: number
  subtotal: number
  isBelowMoq: boolean
  isOutOfStock: boolean
}

export type CartSummary = {
  subtotal: number
  vat: number
  shipping: number
  total: number
  totalQuantity: number
}

export type CheckoutPayload = {
  items: CartItem[]
  billing: {
    companyName: string
    vatNumber: string
    fiscalCode: string
    sdi: string
    pec: string
    address: string
  }
  shipping: {
    contactName: string
    phone: string
    address: string
    method: string
  }
  paymentMethod: 'stripe' | 'paypal' | 'bank_transfer'
  customerNote: string
}

export type CreatedOrder = {
  orderId: string
  orderNo: string
  status: 'submitted'
  summary: CartSummary
}
