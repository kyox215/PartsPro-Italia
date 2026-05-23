export type AdminOrderStatus =
  | 'submitted'
  | 'accepted'
  | 'picking'
  | 'packed'
  | 'shipped'
  | 'completed'

export type PaymentStatus = 'pending' | 'paid' | 'bank_waiting' | 'failed'
export type StockRisk = 'clear' | 'low' | 'split' | 'blocked'

export type AdminOrderLine = {
  skuCode: string
  productName: string
  qualityGrade: string
  quantity: number
  unitPrice: number
  stockStatus: 'available' | 'low_stock' | 'reserved' | 'incoming'
  batchCode: string
  location: string
}

export type AdminOrder = {
  id: string
  orderNo: string
  customerName: string
  customerTier: 'standard' | 'silver' | 'gold'
  status: AdminOrderStatus
  paymentStatus: PaymentStatus
  stockRisk: StockRisk
  totalNet: number
  vat: number
  shipping: number
  createdAt: string
  shippingMethod: string
  fiscal: {
    vatNumber: string
    fiscalCode: string
    sdi: string
    pec: string
  }
  deliveryAddress: string
  customerNote: string
  staffNote: string
  lines: AdminOrderLine[]
}

export type InventoryItem = {
  id: string
  skuCode: string
  productName: string
  brand: string
  model: string
  qualityGrade: string
  batchCode: string
  location: string
  actualQty: number
  lockedQty: number
  availableQty: number
  incomingQty: number
  qcQty: number
  rmaQty: number
  defectiveQty: number
  supplier: string
  lastMovementAt: string
}

export type StockMovementType =
  | 'purchase_in'
  | 'order_lock'
  | 'ship_out'
  | 'rma_in'
  | 'qc_hold'
  | 'adjustment'

export type StockMovement = {
  id: string
  createdAt: string
  type: StockMovementType
  skuCode: string
  batchCode: string
  location: string
  quantity: number
  reference: string
  operator: string
  note: string
}

export type PriceTier = {
  minQty: number
  unitPrice: number
}

export type AdminProductStatus = 'active' | 'draft' | 'hidden' | 'blocked'

export type AdminProduct = {
  id: string
  skuCode: string
  name: string
  brand: string
  model: string
  modelCode: string
  category: string
  qualityGrade: string
  color: string
  frame: 'With Frame' | 'Without Frame' | 'N/A'
  costPrice: number
  retailPrice: number
  b2bPrice: number
  tierPrices: PriceTier[]
  stockQty: number
  location: string
  batchCode: string
  supplier: string
  warrantyDays: number
  weightGram: number
  isBattery: boolean
  isDangerousGoods: boolean
  msdsUrl: string
  un38Url: string
  compatibilityModels: string[]
  alternativeSkus: string[]
  addOnSkus: string[]
  status: AdminProductStatus
  updatedAt: string
}

export type CustomerTier = 'standard' | 'silver' | 'gold'
export type CustomerStatus = 'active' | 'pending' | 'suspended'

export type CustomerAccount = {
  id: string
  companyName: string
  contactName: string
  email: string
  vatNumber: string
  sdi: string
  pec: string
  tier: CustomerTier
  priceGroupId: string
  status: CustomerStatus
  monthlyPurchase: string
  ordersCount: number
  revenue: number
  lastOrderAt: string | null
  creditLimit: number
  paymentTerms: string
}

export type B2BApprovalStatus = 'submitted' | 'approved' | 'rejected'

export type B2BApproval = {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string
  vatNumber: string
  fiscalCode: string
  sdi: string
  pec: string
  companyType: string
  monthlyPurchase: string
  interestedCategories: string[]
  status: B2BApprovalStatus
  submittedAt: string
  requestedPriceGroupId: string
  reviewNote: string
}

export type PriceGroup = {
  id: string
  name: string
  description: string
  customerCount: number
  defaultMarginPercent: number
  paymentTerms: string
  minMonthlyPurchase: string
  visibleCategories: string[]
  tierRules: PriceTier[]
  updatedAt: string
}

export type BatchStatus = 'incoming' | 'qc_hold' | 'released' | 'blocked'

export type AdminBatch = {
  id: string
  batchCode: string
  supplier: string
  purchaseOrder: string
  status: BatchStatus
  qcStatus: 'pending' | 'passed' | 'failed'
  skuCount: number
  receivedAt: string
  warehouseLocation: string
  isBatteryBatch: boolean
  msdsUrl: string
  un38Url: string
  notes: string
}
