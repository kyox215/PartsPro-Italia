import type { StaffPermission, UserRole } from '@/types/auth'

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
export type AdminProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'incoming'
export type AdminProductVatMode = 'IVA esclusa' | 'IVA inclusa'

export type AdminProduct = {
  id: string
  skuCode: string
  name: string
  brand: string
  model: string
  modelCode: string
  modelCodes: string[]
  category: string
  qualityGrade: string
  color: string
  frame: 'With Frame' | 'Without Frame' | 'N/A'
  stockStatus: AdminProductStockStatus
  moq: number
  costPrice: number
  retailPrice: number
  b2bPrice: number
  vatMode: AdminProductVatMode
  tierPrices: PriceTier[]
  stockQty: number
  location: string
  batchCode: string
  supplier: string
  warrantyDays: number
  weightGram: number
  imagePath: string
  imageAlt: string
  galleryImagePaths: string[]
  isBattery: boolean
  isDangerousGoods: boolean
  msdsUrl: string
  un38Url: string
  compatibility: Array<{
    model: string
    code: string
    note: string
  }>
  compatibilityModels: string[]
  alternativeSkus: string[]
  addOnSkus: string[]
  highlights: string[]
  status: AdminProductStatus
  archivedAt: string | null
  archivedBy: string
  archiveReason: string
  updatedAt: string
}

export type AdminProductPatch = Partial<Omit<AdminProduct, 'id' | 'updatedAt'>>

export type ProductImportPreview = {
  rowNumber: number
  product: AdminProductPatch
  errors: string[]
  warnings: string[]
}

export type ProductImportResult = {
  created: number
  updated: number
  skipped: number
  errors: Array<{
    rowNumber: number
    message: string
  }>
}

export type CustomerTier = 'standard' | 'silver' | 'gold'
export type CustomerStatus = 'active' | 'pending' | 'suspended'

export type CustomerAccount = {
  id: string
  userId: string
  companyName: string
  contactName: string
  email: string
  phone: string
  vatNumber: string
  fiscalCode: string
  sdi: string
  pec: string
  registeredAddress: string
  billingAddress: string
  shippingAddress: string
  tier: CustomerTier
  priceGroupId: string
  status: CustomerStatus
  monthlyPurchase: string
  ordersCount: number
  revenue: number
  lastOrderAt: string | null
  creditLimit: number
  paymentTerms: string
  adminNote: string
  profileCompletedAt: string | null
  archivedAt: string | null
  archivedBy: string
  archiveReason: string
  createdAt: string
  updatedAt: string
}

export type CustomerAccountPatch = Partial<
  Pick<
    CustomerAccount,
    | 'companyName'
    | 'contactName'
    | 'email'
    | 'phone'
    | 'vatNumber'
    | 'fiscalCode'
    | 'sdi'
    | 'pec'
    | 'registeredAddress'
    | 'billingAddress'
    | 'shippingAddress'
    | 'status'
    | 'tier'
    | 'priceGroupId'
    | 'monthlyPurchase'
    | 'creditLimit'
    | 'paymentTerms'
    | 'adminNote'
  >
>

export type CustomerRmaCase = {
  id: string
  userId: string
  orderNo: string
  skuCode: string
  status: string
  problemType: string
  description: string
  quantity: number
  requestedResolution: string
  createdAt: string
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
  registeredAddress: string
  shippingAddress: string
  monthlyPurchase: string
  interestedCategories: string[]
  paymentNeeds: string[]
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

export type AdminStaffRole = Exclude<UserRole, 'guest'>

export type AdminStaffProfile = {
  id: string
  email: string
  role: AdminStaffRole
  permissions: StaffPermission[]
  staffEnabled: boolean
  staffEnabledBy: string
  staffEnabledAt: string | null
  customerCompanyName: string
  createdAt: string
  updatedAt: string
}

export type AuditEntityType =
  | 'product'
  | 'customer'
  | 'b2b_approval'
  | 'price_group'
  | 'inventory'
  | 'order'
  | 'staff_profile'

export type AuditLog = {
  id: string
  actorId: string
  actorEmail: string
  entityType: AuditEntityType
  entityId: string
  action: string
  summary: string
  metadata: Record<string, unknown>
  createdAt: string
}

export type CustomerDetailMetrics = {
  ordersCount: number
  revenue: number
  averageOrderValue: number
  lastOrderAt: string | null
  openOrdersCount: number
  pendingPaymentAmount: number
  rmaCount: number
}

export type CustomerDetail = {
  profile: CustomerAccount
  metrics: CustomerDetailMetrics
  orders: AdminOrder[]
  rmas: CustomerRmaCase[]
  b2bApplications: B2BApproval[]
  auditLogs: AuditLog[]
  priceGroup: PriceGroup | null
}

export type CustomerOrderFilters = {
  status?: AdminOrderStatus | 'all'
  paymentStatus?: PaymentStatus | 'all'
  limit?: number
}

export type CustomerTimelineItem = {
  id: string
  type: 'audit' | 'order' | 'rma'
  title: string
  description: string
  amount?: number
  status?: string
  source?: 'audit' | 'order' | 'rma'
  targetRoute?: string
  createdAt: string
}
