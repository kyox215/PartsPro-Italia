import type {
  AdminBatch,
  AdminOrder,
  AdminOrderStatus,
  AdminProduct,
  AdminProductPatch,
  AdminStaffProfile,
  AdminStaffRole,
  AuditLog,
  B2BApproval,
  B2BApprovalStatus,
  CustomerAccount,
  CustomerAccountPatch,
  CustomerDetail,
  CustomerOrderFilters,
  CustomerRmaCase,
  CustomerTimelineItem,
  CustomerTier,
  InventoryItem,
  PriceGroup,
  ProductImportPreview,
  ProductImportResult,
  StockMovement,
  StockMovementType,
} from '@/types/admin'
import type { StaffPermission } from '@/types/auth'
import { shouldUseSupabaseData, supabase } from '@/lib/supabase'
import { hasDemoAuthProfile, readDemoAuthProfile } from '@/services/demo-auth.service'
import {
  defaultPermissionsForRole,
  normalizeStaffPermissions,
  profileHasPermission,
  resolveStaffPermissions,
  staffPermissionLabels,
  staffRoles,
} from '@/types/auth'

type AdminProductRow = {
  id: string
  sku_code: string
  name: string
  brand: string
  model: string
  model_code: string
  model_codes: string[] | null
  category: string
  quality_grade: string
  color: string
  frame: AdminProduct['frame']
  stock_status: AdminProduct['stockStatus']
  moq: number
  cost_price: number
  retail_price: number
  b2b_price: number
  vat_mode: AdminProduct['vatMode']
  tier_prices: AdminProduct['tierPrices'] | null
  stock_qty: number
  location: string
  batch_code: string
  supplier: string
  warranty_days: number
  weight_gram: number
  image_path: string | null
  image_alt: string | null
  gallery_image_paths: string[] | null
  is_battery: boolean
  is_dangerous_goods: boolean
  msds_url: string
  un38_url: string
  compatibility: AdminProduct['compatibility'] | null
  compatibility_models: string[] | null
  alternative_skus: string[] | null
  add_on_skus: string[] | null
  highlights: string[] | null
  status: AdminProduct['status']
  archived_at: string | null
  archived_by: string | null
  archive_reason: string | null
  updated_at: string
}

type CustomerRow = {
  id: string
  user_id: string | null
  company_name: string | null
  contact_name: string | null
  email: string
  phone: string | null
  vat_number: string | null
  fiscal_code: string | null
  sdi: string | null
  pec: string | null
  registered_address: string | null
  billing_address: string | null
  shipping_address: string | null
  tier: CustomerAccount['tier']
  price_group_id: string | null
  status: CustomerAccount['status']
  monthly_purchase: string | null
  orders_count: number
  revenue: number
  last_order_at: string | null
  credit_limit: number
  payment_terms: string | null
  admin_note: string | null
  profile_completed_at: string | null
  archived_at: string | null
  archived_by: string | null
  archive_reason: string | null
  created_at: string
  updated_at: string
}

type AuditLogRow = {
  id: string
  actor_id: string | null
  actor_email: string | null
  entity_type: AuditLog['entityType']
  entity_id: string
  action: string
  summary: string
  metadata: Record<string, unknown> | null
  created_at: string
}

type CustomerTimelineOrderRow = {
  id: string
  order_no: string
  customer_name?: string
  customer_tier?: AdminOrder['customerTier']
  status: AdminOrderStatus
  payment_status?: AdminOrder['paymentStatus']
  stock_risk?: AdminOrder['stockRisk']
  total_net: number
  vat?: number
  shipping?: number
  shipping_method?: string
  fiscal?: Record<string, unknown> | null
  delivery_address?: string
  customer_note?: string
  staff_note?: string
  created_at: string
  order_lines?: CustomerOrderLineRow[] | null
}

type CustomerOrderLineRow = {
  id: string
  sku_code: string
  product_name: string
  quality_grade: string
  quantity: number
  unit_price: number
  stock_status: AdminOrder['lines'][number]['stockStatus']
  batch_code: string
  location: string
}

type CustomerTimelineRmaRow = {
  id: string
  user_id: string | null
  order_no: string
  sku_code: string
  status: string
  problem_type: string
  description: string
  quantity: number
  requested_resolution: string
  created_at: string
}

type B2BApprovalRow = {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  vat_number: string
  fiscal_code: string
  sdi: string
  pec: string
  company_type: string
  registered_address: string
  shipping_address: string
  monthly_purchase: string
  interested_categories: string[] | null
  payment_needs: string[] | null
  status: B2BApproval['status']
  submitted_at: string
  requested_price_group_id: string
  review_note: string
}

type InventoryItemRow = {
  id: string
  sku_code: string
  product_name: string
  brand: string
  model: string
  quality_grade: string
  batch_code: string
  location: string
  actual_qty: number
  locked_qty: number
  available_qty: number
  incoming_qty: number
  qc_qty: number
  rma_qty: number
  defective_qty: number
  supplier: string
  last_movement_at: string
}

type StockMovementRow = {
  id: string
  created_at: string
  type: StockMovementType
  sku_code: string
  batch_code: string
  location: string
  quantity: number
  reference: string
  operator: string
  note: string
}

type PriceGroupRow = {
  id: string
  name: string
  description: string
  customer_count: number
  default_margin_percent: number
  payment_terms: string
  min_monthly_purchase: string
  visible_categories: string[] | null
  tier_rules: PriceGroup['tierRules'] | null
  updated_at: string
}

type BatchRow = {
  id: string
  batch_code: string
  supplier: string
  purchase_order: string
  status: AdminBatch['status']
  qc_status: AdminBatch['qcStatus']
  sku_count: number
  received_at: string | null
  warehouse_location: string
  is_battery_batch: boolean
  msds_url: string
  un38_url: string
  notes: string
}

type StaffProfileRow = {
  id: string
  email: string
  role: AdminStaffRole
  permissions: unknown
  staff_enabled: boolean | null
  staff_enabled_by: string | null
  staff_enabled_at: string | null
  customers?: { company_name: string | null }[] | { company_name: string | null } | null
  created_at: string
  updated_at: string
}

export const orderStatusFlow: AdminOrderStatus[] = [
  'submitted',
  'accepted',
  'picking',
  'packed',
  'shipped',
  'completed',
]

const productImageBucket = 'product-images'
const customerOrderSelect = `
  id,
  order_no,
  customer_name,
  customer_tier,
  status,
  payment_status,
  stock_risk,
  total_net,
  vat,
  shipping,
  created_at,
  shipping_method,
  fiscal,
  delivery_address,
  customer_note,
  staff_note,
  order_lines (
    id,
    sku_code,
    product_name,
    quality_grade,
    quantity,
    unit_price,
    stock_status,
    batch_code,
    location
  )
`

const orders: AdminOrder[] = [
  {
    id: 'ord-10027',
    orderNo: 'SO-20260522-027',
    customerName: 'RiparaVeloce Milano',
    customerTier: 'gold',
    status: 'submitted',
    paymentStatus: 'paid',
    stockRisk: 'clear',
    totalNet: 486,
    vat: 106.92,
    shipping: 0,
    createdAt: '2026-05-22T09:14:00+02:00',
    shippingMethod: 'DHL Express 24/48h',
    fiscal: {
      vatNumber: 'IT12345678901',
      fiscalCode: '12345678901',
      sdi: 'A1B2C3D',
      pec: 'amministrazione@riparaveloce.example',
    },
    deliveryAddress: 'Via Torino 22, 20123 Milano MI',
    customerNote: '如果可以请今天发货，优先处理 iPhone 11 屏幕。',
    staffNote: '金牌客户，可优先拣货。',
    lines: [
      {
        skuCode: 'IP11-SCR-SOFT-BLK',
        productName: 'iPhone 11 Display Soft OLED Black',
        qualityGrade: 'Soft OLED',
        quantity: 8,
        unitPrice: 32,
        stockStatus: 'available',
        batchCode: 'BATCH-MI-0520',
        location: 'A-01-03',
      },
      {
        skuCode: 'IP12-BAT-STD',
        productName: 'iPhone 12 Battery Standard',
        qualityGrade: 'Standard',
        quantity: 6,
        unitPrice: 18,
        stockStatus: 'available',
        batchCode: 'BATCH-BAT-0418',
        location: 'B-04-02',
      },
    ],
  },
  {
    id: 'ord-10026',
    orderNo: 'SO-20260522-026',
    customerName: 'Centro Repair Roma',
    customerTier: 'silver',
    status: 'picking',
    paymentStatus: 'bank_waiting',
    stockRisk: 'split',
    totalNet: 312,
    vat: 68.64,
    shipping: 7.9,
    createdAt: '2026-05-22T08:32:00+02:00',
    shippingMethod: 'BRT Standard',
    fiscal: {
      vatNumber: 'IT09876543210',
      fiscalCode: '09876543210',
      sdi: '0000000',
      pec: 'fatture@centrorepair.example',
    },
    deliveryAddress: 'Via Appia 104, 00179 Roma RM',
    customerNote: '已提交银行转账凭证，请核对附件。',
    staffNote: '需要核对 Xiaomi 商品的拆单库存。',
    lines: [
      {
        skuCode: 'SMG991-CHP-USB',
        productName: 'Samsung S21 Charging Port Flex',
        qualityGrade: 'Premium',
        quantity: 10,
        unitPrice: 9.2,
        stockStatus: 'reserved',
        batchCode: 'BATCH-SAM-0507',
        location: 'C-02-01',
      },
      {
        skuCode: 'XRN10-SCR-TFT-BLK',
        productName: 'Xiaomi Redmi Note 10 Display TFT Black',
        qualityGrade: 'TFT',
        quantity: 5,
        unitPrice: 44,
        stockStatus: 'incoming',
        batchCode: 'BATCH-XIA-IN',
        location: 'INCOMING',
      },
    ],
  },
  {
    id: 'ord-10025',
    orderNo: 'SO-20260521-025',
    customerName: 'FixLab Firenze',
    customerTier: 'standard',
    status: 'packed',
    paymentStatus: 'paid',
    stockRisk: 'low',
    totalNet: 168,
    vat: 36.96,
    shipping: 7.9,
    createdAt: '2026-05-21T16:48:00+02:00',
    shippingMethod: 'GLS 24/48h',
    fiscal: {
      vatNumber: 'IT11223344556',
      fiscalCode: '11223344556',
      sdi: 'KRRH6B9',
      pec: 'fixlab@pec.example',
    },
    deliveryAddress: 'Via della Scala 18, 50123 Firenze FI',
    customerNote: '请在包裹内加入装箱单。',
    staffNote: '已准备发货，注意电池安全要求。',
    lines: [
      {
        skuCode: 'IPSE2-BAT-STD',
        productName: 'iPhone SE 2020 Battery Standard',
        qualityGrade: 'Standard',
        quantity: 7,
        unitPrice: 14,
        stockStatus: 'low_stock',
        batchCode: 'BATCH-BAT-0421',
        location: 'B-02-05',
      },
      {
        skuCode: 'TOOL-PRY-SET',
        productName: 'Opening Tool Set',
        qualityGrade: 'Workshop',
        quantity: 10,
        unitPrice: 7,
        stockStatus: 'available',
        batchCode: 'BATCH-TOOL-0501',
        location: 'T-01-02',
      },
    ],
  },
  {
    id: 'ord-10024',
    orderNo: 'SO-20260521-024',
    customerName: 'Phone Doctor Torino',
    customerTier: 'gold',
    status: 'shipped',
    paymentStatus: 'paid',
    stockRisk: 'clear',
    totalNet: 544,
    vat: 119.68,
    shipping: 0,
    createdAt: '2026-05-21T11:05:00+02:00',
    shippingMethod: 'DHL Express 24/48h',
    fiscal: {
      vatNumber: 'IT66778899001',
      fiscalCode: '66778899001',
      sdi: 'M5UXCR1',
      pec: 'admin@phonedoctor.example',
    },
    deliveryAddress: 'Corso Francia 88, 10143 Torino TO',
    customerNote: '如果可以，请安排上午派送。',
    staffNote: 'DHL 跟踪号已生成。',
    lines: [
      {
        skuCode: 'IP13-SCR-REF-BLK',
        productName: 'iPhone 13 Display Refurbished Black',
        qualityGrade: 'Refurbished',
        quantity: 4,
        unitPrice: 112,
        stockStatus: 'available',
        batchCode: 'BATCH-IP13-0508',
        location: 'A-03-04',
      },
      {
        skuCode: 'IP13-CAM-BACK',
        productName: 'iPhone 13 Rear Camera',
        qualityGrade: 'Original Pull',
        quantity: 2,
        unitPrice: 48,
        stockStatus: 'available',
        batchCode: 'BATCH-CAM-0419',
        location: 'D-01-01',
      },
    ],
  },
]

const inventory: InventoryItem[] = [
  {
    id: 'inv-ip11-screen',
    skuCode: 'IP11-SCR-SOFT-BLK',
    productName: 'iPhone 11 Display Soft OLED Black',
    brand: 'Apple',
    model: 'iPhone 11',
    qualityGrade: 'Soft OLED',
    batchCode: 'BATCH-MI-0520',
    location: 'A-01-03',
    actualQty: 54,
    lockedQty: 8,
    availableQty: 46,
    incomingQty: 40,
    qcQty: 0,
    rmaQty: 2,
    defectiveQty: 1,
    supplier: 'Shenzhen Display Co.',
    lastMovementAt: '2026-05-22T09:30:00+02:00',
  },
  {
    id: 'inv-ip12-battery',
    skuCode: 'IP12-BAT-STD',
    productName: 'iPhone 12 Battery Standard',
    brand: 'Apple',
    model: 'iPhone 12',
    qualityGrade: 'Standard',
    batchCode: 'BATCH-BAT-0418',
    location: 'B-04-02',
    actualQty: 31,
    lockedQty: 6,
    availableQty: 25,
    incomingQty: 0,
    qcQty: 4,
    rmaQty: 1,
    defectiveQty: 0,
    supplier: 'Battery Lab HK',
    lastMovementAt: '2026-05-22T09:20:00+02:00',
  },
  {
    id: 'inv-s21-charging',
    skuCode: 'SMG991-CHP-USB',
    productName: 'Samsung S21 Charging Port Flex',
    brand: 'Samsung',
    model: 'Galaxy S21',
    qualityGrade: 'Premium',
    batchCode: 'BATCH-SAM-0507',
    location: 'C-02-01',
    actualQty: 18,
    lockedQty: 10,
    availableQty: 8,
    incomingQty: 25,
    qcQty: 0,
    rmaQty: 0,
    defectiveQty: 0,
    supplier: 'K-Tech Parts',
    lastMovementAt: '2026-05-22T08:56:00+02:00',
  },
  {
    id: 'inv-xiaomi-screen',
    skuCode: 'XRN10-SCR-TFT-BLK',
    productName: 'Xiaomi Redmi Note 10 Display TFT Black',
    brand: 'Xiaomi',
    model: 'Redmi Note 10',
    qualityGrade: 'TFT',
    batchCode: 'BATCH-XIA-IN',
    location: 'INCOMING',
    actualQty: 0,
    lockedQty: 0,
    availableQty: 0,
    incomingQty: 30,
    qcQty: 0,
    rmaQty: 0,
    defectiveQty: 0,
    supplier: 'CN Mobile Parts',
    lastMovementAt: '2026-05-22T07:45:00+02:00',
  },
]

const movements: StockMovement[] = [
  {
    id: 'mov-501',
    createdAt: '2026-05-22T09:30:00+02:00',
    type: 'order_lock',
    skuCode: 'IP11-SCR-SOFT-BLK',
    batchCode: 'BATCH-MI-0520',
    location: 'A-01-03',
    quantity: -8,
    reference: 'SO-20260522-027',
    operator: 'warehouse@partspro.local',
    note: '已付款订单锁定库存。',
  },
  {
    id: 'mov-500',
    createdAt: '2026-05-22T09:20:00+02:00',
    type: 'qc_hold',
    skuCode: 'IP12-BAT-STD',
    batchCode: 'BATCH-BAT-0418',
    location: 'QC-01',
    quantity: -4,
    reference: 'QC-20260522-004',
    operator: 'quality@partspro.local',
    note: '销售前进行电池检查。',
  },
  {
    id: 'mov-499',
    createdAt: '2026-05-21T17:32:00+02:00',
    type: 'ship_out',
    skuCode: 'IP13-SCR-REF-BLK',
    batchCode: 'BATCH-IP13-0508',
    location: 'A-03-04',
    quantity: -4,
    reference: 'SO-20260521-024',
    operator: 'warehouse@partspro.local',
    note: 'DHL 发货已确认。',
  },
  {
    id: 'mov-498',
    createdAt: '2026-05-21T15:10:00+02:00',
    type: 'purchase_in',
    skuCode: 'IP11-SCR-SOFT-BLK',
    batchCode: 'BATCH-MI-0520',
    location: 'A-01-03',
    quantity: 60,
    reference: 'PO-20260519-011',
    operator: 'purchasing@partspro.local',
    note: '质检通过后采购入库。',
  },
  {
    id: 'mov-497',
    createdAt: '2026-05-21T11:42:00+02:00',
    type: 'rma_in',
    skuCode: 'IP11-SCR-SOFT-BLK',
    batchCode: 'BATCH-OLD-0404',
    location: 'RMA-02',
    quantity: 2,
    reference: 'RMA-20260521-006',
    operator: 'support@partspro.local',
    note: '退货进入技术评估。',
  },
]

const adminProducts: AdminProduct[] = [
  {
    id: 'pim-ip11-screen',
    skuCode: 'IP11-SCR-SOFT-BLK',
    name: 'iPhone 11 Display Soft OLED Black Without Frame',
    brand: 'Apple',
    model: 'iPhone 11',
    modelCode: 'A2111 / A2221 / A2223',
    modelCodes: ['A2111', 'A2221', 'A2223'],
    category: 'Screens',
    qualityGrade: 'Soft OLED',
    color: 'Black',
    frame: 'Without Frame',
    stockStatus: 'in_stock',
    moq: 1,
    costPrice: 24.8,
    retailPrice: 49.9,
    b2bPrice: 32,
    vatMode: 'IVA esclusa',
    tierPrices: [
      { minQty: 5, unitPrice: 30.8 },
      { minQty: 10, unitPrice: 29.6 },
    ],
    stockQty: 46,
    location: 'A-01-03',
    batchCode: 'BATCH-MI-0520',
    supplier: 'Shenzhen Display Co.',
    warrantyDays: 180,
    weightGram: 92,
    imagePath: 'screens/IP11-SCR-SOFT-BLK.webp',
    imageAlt: 'iPhone 11 display Soft OLED black without frame',
    galleryImagePaths: [],
    isBattery: false,
    isDangerousGoods: false,
    msdsUrl: '',
    un38Url: '',
    compatibility: [
      { model: 'iPhone 11', code: 'A2111 / A2221 / A2223', note: 'Compatibile' },
    ],
    compatibilityModels: ['iPhone 11 A2111', 'iPhone 11 A2221', 'iPhone 11 A2223'],
    alternativeSkus: ['IP11-SCR-HARD-BLK', 'IP11-SCR-TFT-BLK'],
    addOnSkus: ['TOOL-WATERPROOF-SET'],
    highlights: ['Test before installation', 'B2B price after login', 'RMA tracciabile'],
    status: 'active',
    archivedAt: null,
    archivedBy: '',
    archiveReason: '',
    updatedAt: '2026-05-22T10:40:00+02:00',
  },
  {
    id: 'pim-ip12-battery',
    skuCode: 'IP12-BAT-HQ-2815',
    name: 'iPhone 12 Battery 2815mAh Compatible High Quality',
    brand: 'Apple',
    model: 'iPhone 12',
    modelCode: 'A2172 / A2402 / A2403',
    modelCodes: ['A2172', 'A2402', 'A2403'],
    category: 'Batteries',
    qualityGrade: 'High Quality Compatible',
    color: 'Black',
    frame: 'N/A',
    stockStatus: 'low_stock',
    moq: 1,
    costPrice: 9.8,
    retailPrice: 24.9,
    b2bPrice: 14.5,
    vatMode: 'IVA esclusa',
    tierPrices: [
      { minQty: 5, unitPrice: 13.8 },
      { minQty: 20, unitPrice: 12.9 },
    ],
    stockQty: 25,
    location: 'B-04-02',
    batchCode: 'BATCH-BAT-0418',
    supplier: 'Battery Lab HK',
    warrantyDays: 180,
    weightGram: 48,
    imagePath: 'batteries/IP12-BAT-HQ-2815.webp',
    imageAlt: 'iPhone 12 compatible high quality battery',
    galleryImagePaths: [],
    isBattery: true,
    isDangerousGoods: true,
    msdsUrl: 'MSDS-IP12-BAT-HQ.pdf',
    un38Url: 'UN38.3-IP12-BAT-HQ.pdf',
    compatibility: [
      { model: 'iPhone 12', code: 'A2172 / A2402 / A2403', note: 'Verificare connettore' },
    ],
    compatibilityModels: ['iPhone 12 A2172', 'iPhone 12 A2402', 'iPhone 12 A2403'],
    alternativeSkus: ['IP12-BAT-OEM-PULL'],
    addOnSkus: ['TOOL-WATERPROOF-SET'],
    highlights: ['Battery safety notice', 'MSDS/UN38.3 required', 'Low stock'],
    status: 'active',
    archivedAt: null,
    archivedBy: '',
    archiveReason: '',
    updatedAt: '2026-05-22T09:28:00+02:00',
  },
  {
    id: 'pim-sa52-charge',
    skuCode: 'SA52-CHG-EU-BLK',
    name: 'Samsung Galaxy A52 Charging Port Flex EU Version',
    brand: 'Samsung',
    model: 'Galaxy A52',
    modelCode: 'SM-A525F / SM-A526B',
    modelCodes: ['SM-A525F', 'SM-A526B'],
    category: 'Charging Ports',
    qualityGrade: 'Compatible High Quality',
    color: 'Black',
    frame: 'N/A',
    stockStatus: 'in_stock',
    moq: 2,
    costPrice: 3.4,
    retailPrice: 12.9,
    b2bPrice: 5.9,
    vatMode: 'IVA esclusa',
    tierPrices: [
      { minQty: 10, unitPrice: 5.4 },
      { minQty: 30, unitPrice: 4.9 },
    ],
    stockQty: 8,
    location: 'C-02-01',
    batchCode: 'BATCH-SAM-0507',
    supplier: 'K-Tech Parts',
    warrantyDays: 120,
    weightGram: 12,
    imagePath: 'charging-ports/SA52-CHG-EU-BLK.webp',
    imageAlt: 'Samsung Galaxy A52 charging port flex EU version',
    galleryImagePaths: [],
    isBattery: false,
    isDangerousGoods: false,
    msdsUrl: '',
    un38Url: '',
    compatibility: [
      { model: 'Galaxy A52', code: 'SM-A525F', note: 'EU version' },
      { model: 'Galaxy A52 5G', code: 'SM-A526B', note: 'Verificare versione' },
    ],
    compatibilityModels: ['Galaxy A52 SM-A525F', 'Galaxy A52 5G SM-A526B'],
    alternativeSkus: ['SA52-CHG-5G-BLK'],
    addOnSkus: [],
    highlights: ['EU version', 'MOQ 2', 'Fast dispatch'],
    status: 'active',
    archivedAt: null,
    archivedBy: '',
    archiveReason: '',
    updatedAt: '2026-05-22T08:56:00+02:00',
  },
  {
    id: 'pim-rn10-back',
    skuCode: 'RN10-BKC-BLU',
    name: 'Xiaomi Redmi Note 10 Back Cover Blue',
    brand: 'Xiaomi',
    model: 'Redmi Note 10',
    modelCode: 'M2101K7AG',
    modelCodes: ['M2101K7AG'],
    category: 'Back Covers',
    qualityGrade: 'Compatible High Quality',
    color: 'Blue',
    frame: 'N/A',
    stockStatus: 'incoming',
    moq: 1,
    costPrice: 4.6,
    retailPrice: 14.9,
    b2bPrice: 7.8,
    vatMode: 'IVA esclusa',
    tierPrices: [
      { minQty: 5, unitPrice: 7.2 },
      { minQty: 20, unitPrice: 6.7 },
    ],
    stockQty: 0,
    location: 'INCOMING',
    batchCode: 'BATCH-XIA-IN',
    supplier: 'CN Mobile Parts',
    warrantyDays: 90,
    weightGram: 36,
    imagePath: 'back-covers/RN10-BKC-BLU.webp',
    imageAlt: 'Xiaomi Redmi Note 10 blue back cover',
    galleryImagePaths: [],
    isBattery: false,
    isDangerousGoods: false,
    msdsUrl: '',
    un38Url: '',
    compatibility: [
      { model: 'Redmi Note 10', code: 'M2101K7AG', note: 'Blue version' },
    ],
    compatibilityModels: ['Redmi Note 10 M2101K7AG'],
    alternativeSkus: ['RN10-BKC-BLK'],
    addOnSkus: ['TOOL-PRY-SET'],
    highlights: ['Incoming stock', 'Color matched', 'B2B reserved price'],
    status: 'draft',
    archivedAt: null,
    archivedBy: '',
    archiveReason: '',
    updatedAt: '2026-05-22T07:45:00+02:00',
  },
]

const customers: CustomerAccount[] = []

const b2bApprovals: B2BApproval[] = []

const priceGroups: PriceGroup[] = [
  {
    id: 'pg-standard-b2b',
    name: '标准 B2B',
    description: '适用于已审核客户和小型维修实验室的基础价格表。',
    customerCount: 34,
    defaultMarginPercent: 32,
    paymentTerms: 'Stripe / PayPal / 预付银行转账',
    minMonthlyPurchase: '< €1.000',
    visibleCategories: ['Screens', 'Batteries', 'Charging Ports', 'Tools'],
    tierRules: [
      { minQty: 1, unitPrice: 32 },
      { minQty: 5, unitPrice: 30.8 },
    ],
    updatedAt: '2026-05-22T08:00:00+02:00',
  },
  {
    id: 'pg-silver-shop',
    name: '银牌维修店',
    description: '适用于有稳定复购的维修门店的专属价格。',
    customerCount: 18,
    defaultMarginPercent: 26,
    paymentTerms: '预付银行转账 / 审核后 7 天账期',
    minMonthlyPurchase: '€1.000 - €3.000',
    visibleCategories: ['Screens', 'Batteries', 'Charging Ports', 'Back Covers'],
    tierRules: [
      { minQty: 1, unitPrice: 30.8 },
      { minQty: 10, unitPrice: 29.6 },
    ],
    updatedAt: '2026-05-21T18:22:00+02:00',
  },
  {
    id: 'pg-gold-lab',
    name: '金牌实验室 / 经销商',
    description: '适用于高采购量维修实验室和经销商的更低价格表。',
    customerCount: 9,
    defaultMarginPercent: 20,
    paymentTerms: '银行转账 7 天 / 有信用额度时 15 天',
    minMonthlyPurchase: '€3.000+',
    visibleCategories: ['Screens', 'Batteries', 'Charging Ports', 'Back Covers', 'Cameras'],
    tierRules: [
      { minQty: 1, unitPrice: 29.8 },
      { minQty: 20, unitPrice: 28.4 },
    ],
    updatedAt: '2026-05-20T11:15:00+02:00',
  },
]

const batches: AdminBatch[] = [
  {
    id: 'batch-mi-0520',
    batchCode: 'BATCH-MI-0520',
    supplier: 'Shenzhen Display Co.',
    purchaseOrder: 'PO-20260519-011',
    status: 'released',
    qcStatus: 'passed',
    skuCount: 3,
    receivedAt: '2026-05-21T15:10:00+02:00',
    warehouseLocation: 'A-01 / A-03',
    isBatteryBatch: false,
    msdsUrl: '',
    un38Url: '',
    notes: '屏幕测试已通过，1 件瑕疵品已隔离。',
  },
  {
    id: 'batch-bat-0418',
    batchCode: 'BATCH-BAT-0418',
    supplier: 'Battery Lab HK',
    purchaseOrder: 'PO-20260416-008',
    status: 'qc_hold',
    qcStatus: 'pending',
    skuCount: 2,
    receivedAt: '2026-04-18T10:20:00+02:00',
    warehouseLocation: 'B-04 / QC-01',
    isBatteryBatch: true,
    msdsUrl: 'MSDS-BATCH-BAT-0418.pdf',
    un38Url: 'UN38.3-BATCH-BAT-0418.pdf',
    notes: '完全放行前进行电池抽样检查。',
  },
  {
    id: 'batch-xia-in',
    batchCode: 'BATCH-XIA-IN',
    supplier: 'CN Mobile Parts',
    purchaseOrder: 'PO-20260520-016',
    status: 'incoming',
    qcStatus: 'pending',
    skuCount: 4,
    receivedAt: '2026-05-24T09:00:00+02:00',
    warehouseLocation: 'INCOMING',
    isBatteryBatch: false,
    msdsUrl: '',
    un38Url: '',
    notes: '预计到货，QC 完成前不可销售。',
  },
]

const staffProfiles: AdminStaffProfile[] = [
  {
    id: 'profile-admin',
    email: 'admin@partspro.example',
    role: 'admin',
    permissions: defaultPermissionsForRole('admin'),
    staffEnabled: true,
    staffEnabledBy: 'system',
    staffEnabledAt: '2026-05-18T08:00:00+02:00',
    customerCompanyName: 'PartsPro',
    createdAt: '2026-05-18T08:00:00+02:00',
    updatedAt: '2026-05-22T09:00:00+02:00',
  },
  {
    id: 'profile-sales',
    email: 'sales@partspro.example',
    role: 'sales',
    permissions: defaultPermissionsForRole('sales'),
    staffEnabled: true,
    staffEnabledBy: 'profile-admin',
    staffEnabledAt: '2026-05-18T08:10:00+02:00',
    customerCompanyName: 'PartsPro',
    createdAt: '2026-05-18T08:10:00+02:00',
    updatedAt: '2026-05-21T16:00:00+02:00',
  },
  {
    id: 'profile-warehouse',
    email: 'warehouse@partspro.example',
    role: 'warehouse',
    permissions: defaultPermissionsForRole('warehouse'),
    staffEnabled: true,
    staffEnabledBy: 'profile-admin',
    staffEnabledAt: '2026-05-18T08:20:00+02:00',
    customerCompanyName: 'PartsPro',
    createdAt: '2026-05-18T08:20:00+02:00',
    updatedAt: '2026-05-21T16:05:00+02:00',
  },
  {
    id: 'profile-customer',
    email: 'amministrazione@mobilecarebari.example',
    role: 'customer',
    permissions: [],
    staffEnabled: false,
    staffEnabledBy: '',
    staffEnabledAt: null,
    customerCompanyName: 'Mobile Care Bari',
    createdAt: '2026-05-20T12:40:00+02:00',
    updatedAt: '2026-05-20T12:45:00+02:00',
  },
]

export function getAdminOrders() {
  return orders.map((order) => ({ ...order, lines: order.lines.map((line) => ({ ...line })) }))
}

export function getAdminOrderById(id: string) {
  const order = orders.find((item) => item.id === id)

  if (!order) {
    return null
  }

  return {
    ...order,
    lines: order.lines.map((line) => ({ ...line })),
  }
}

export function getNextOrderStatus(status: AdminOrderStatus) {
  const index = orderStatusFlow.indexOf(status)
  return orderStatusFlow[index + 1] || null
}

export async function updateOrderStatus(orderId: string, status: AdminOrderStatus) {
  const order = orders.find((item) => item.id === orderId)

  if (!order) {
    throw new Error('未找到订单。')
  }

  order.status = status
  return getAdminOrderById(orderId)
}

export async function staffShipOrder(orderId: string) {
  const order = orders.find((item) => item.id === orderId)

  if (!order) {
    throw new Error('未找到订单。')
  }

  // Placeholder for Supabase RPC: staff_ship_order.
  // Shipping must atomically validate locked stock and write stock movements server-side.
  order.status = 'shipped'
  order.staffNote = `${order.staffNote} 已调用 staff_ship_order 占位服务。`

  return getAdminOrderById(orderId)
}

export function getInventoryItems() {
  return inventory.map((item) => ({ ...item }))
}

export function getStockMovements() {
  return movements.map((movement) => ({ ...movement }))
}

export function getStaffProfiles() {
  return staffProfiles.map((profile) => ({
    ...profile,
    permissions: [...profile.permissions],
  }))
}

export function getAdminDashboardStats() {
  const openOrders = orders.filter((order) => order.status !== 'completed').length
  const lowStock = inventory.filter((item) => item.availableQty <= 10 || item.qcQty > 0).length
  const pendingPayments = orders.filter((order) => order.paymentStatus !== 'paid').length

  return {
    openOrders,
    lowStock,
    pendingPayments,
  }
}

export function getAdminProducts() {
  return adminProducts.map((product) => ({
    ...product,
    modelCodes: [...product.modelCodes],
    tierPrices: product.tierPrices.map((tier) => ({ ...tier })),
    galleryImagePaths: [...product.galleryImagePaths],
    compatibility: product.compatibility.map((item) => ({ ...item })),
    compatibilityModels: [...product.compatibilityModels],
    alternativeSkus: [...product.alternativeSkus],
    addOnSkus: [...product.addOnSkus],
    highlights: [...product.highlights],
  }))
}

export async function updateAdminProduct(productId: string, patch: Partial<AdminProduct>) {
  const product = adminProducts.find((item) => item.id === productId)

  if (!product) {
    throw new Error('未找到商品。')
  }

  Object.assign(product, patch, {
    updatedAt: new Date().toISOString(),
  })

  return getAdminProducts().find((item) => item.id === productId) || null
}

function createLocalProductId(skuCode: string) {
  return `pim-${skuCode.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`
}

export async function insertLocalAdminProduct(product: AdminProductPatch) {
  const skuCode = product.skuCode?.trim()

  if (!skuCode) {
    throw new Error('SKU 不能为空。')
  }

  if (adminProducts.some((item) => item.skuCode.toLowerCase() === skuCode.toLowerCase())) {
    throw new Error(`SKU ${skuCode} 已存在。`)
  }

  const now = new Date().toISOString()
  const nextProduct: AdminProduct = {
    id: createLocalProductId(skuCode),
    skuCode,
    name: product.name || skuCode,
    brand: product.brand || '',
    model: product.model || '',
    modelCode: product.modelCode || '',
    modelCodes: product.modelCodes || [],
    category: product.category || '',
    qualityGrade: product.qualityGrade || '',
    color: product.color || '',
    frame: product.frame || 'N/A',
    stockStatus: product.stockStatus || 'incoming',
    moq: product.moq || 1,
    costPrice: product.costPrice || 0,
    retailPrice: product.retailPrice || 0,
    b2bPrice: product.b2bPrice || 0,
    vatMode: product.vatMode || 'IVA esclusa',
    tierPrices: product.tierPrices || [],
    stockQty: product.stockQty || 0,
    location: product.location || '',
    batchCode: product.batchCode || '',
    supplier: product.supplier || '',
    warrantyDays: product.warrantyDays || 180,
    weightGram: product.weightGram || 0,
    imagePath: product.imagePath || '',
    imageAlt: product.imageAlt || product.name || skuCode,
    galleryImagePaths: product.galleryImagePaths || [],
    isBattery: Boolean(product.isBattery),
    isDangerousGoods: Boolean(product.isDangerousGoods),
    msdsUrl: product.msdsUrl || '',
    un38Url: product.un38Url || '',
    compatibility: product.compatibility || [],
    compatibilityModels: product.compatibilityModels || [],
    alternativeSkus: product.alternativeSkus || [],
    addOnSkus: product.addOnSkus || [],
    highlights: product.highlights || [],
    status: product.status || 'draft',
    archivedAt: null,
    archivedBy: '',
    archiveReason: '',
    updatedAt: now,
  }

  adminProducts.unshift(nextProduct)
  return getAdminProducts().find((item) => item.id === nextProduct.id) || nextProduct
}

export async function archiveLocalAdminProduct(productId: string, reason: string) {
  const product = adminProducts.find((item) => item.id === productId)

  if (!product) {
    throw new Error('未找到商品。')
  }

  product.archivedAt = new Date().toISOString()
  product.archiveReason = reason
  product.updatedAt = new Date().toISOString()
  return getAdminProducts().find((item) => item.id === productId) || null
}

export async function restoreLocalAdminProduct(productId: string) {
  const product = adminProducts.find((item) => item.id === productId)

  if (!product) {
    throw new Error('未找到商品。')
  }

  product.archivedAt = null
  product.archivedBy = ''
  product.archiveReason = ''
  product.updatedAt = new Date().toISOString()
  return getAdminProducts().find((item) => item.id === productId) || null
}

function deriveCustomerTier(priceGroupId: string): CustomerTier {
  const normalizedGroupId = priceGroupId.toLowerCase()

  if (normalizedGroupId.includes('gold')) {
    return 'gold'
  }

  if (normalizedGroupId.includes('silver')) {
    return 'silver'
  }

  return 'standard'
}

function creditLimitForTier(tier: CustomerTier) {
  const limits: Record<CustomerTier, number> = {
    standard: 0,
    silver: 900,
    gold: 2500,
  }

  return limits[tier]
}

export async function updateStaffProfileRole(profileId: string, role: AdminStaffRole) {
  return updateStaffProfilePermissions(profileId, role, defaultPermissionsForRole(role))
}

export async function updateStaffProfilePermissions(
  profileId: string,
  role: AdminStaffRole,
  permissions: StaffPermission[],
) {
  const profile = staffProfiles.find((item) => item.id === profileId)

  if (!profile) {
    throw new Error('未找到员工账号。')
  }

  const normalizedPermissions = normalizeStaffPermissions(permissions, role)
  ensureLocalPermissionManagerRemains(profileId, role, normalizedPermissions)

  profile.role = role
  profile.permissions = normalizedPermissions
  profile.staffEnabled = role !== 'customer' || normalizedPermissions.length > 0
  if (profile.staffEnabled) {
    profile.staffEnabledAt = profile.staffEnabledAt || new Date().toISOString()
  }
  profile.updatedAt = new Date().toISOString()
  return { ...profile, permissions: [...profile.permissions] }
}

export function getCustomerAccounts() {
  return customers.map((customer) => ({ ...customer }))
}

export function getB2BApprovals() {
  return b2bApprovals.map((approval) => ({
    ...approval,
    interestedCategories: [...approval.interestedCategories],
  }))
}

export function getPriceGroups() {
  return priceGroups.map((group) => ({
    ...group,
    visibleCategories: [...group.visibleCategories],
    tierRules: group.tierRules.map((tier) => ({ ...tier })),
  }))
}

export function getAdminBatches() {
  return batches.map((batch) => ({ ...batch }))
}

function warnAdminFallback(scope: string, error: unknown) {
  console.warn(`[PartsPro] Supabase ${scope} fallback to mock data`, error)
}

function warnAdminDataError(scope: string, error: unknown) {
  console.warn(`[PartsPro] Supabase ${scope} failed`, error)
}

async function hasRealSupabaseSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return Boolean(session)
}

async function requireRealSupabaseAdminData(scope: string) {
  if (!shouldUseSupabaseData) {
    throw new Error(`${scope} 需要配置 Supabase URL 和 anon key。`)
  }

  if (await hasRealSupabaseSession()) {
    return
  }

  if (hasDemoAuthProfile()) {
    throw new Error(`${scope} 需要使用真实 Supabase 管理员账号，演示账号不会显示后台真实数据。`)
  }

  throw new Error(`${scope} 需要真实 Supabase 登录会话。`)
}

async function getCurrentActor() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return {
    id: session?.user?.id || '',
    email: session?.user?.email || '',
  }
}

async function requireCurrentAdmin(scope: string) {
  await requireRealSupabaseAdminData(scope)
  const actor = await getCurrentActor()

  if (!actor.id) {
    throw new Error(`${scope} 需要管理员账号。`)
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', actor.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (data?.role !== 'admin') {
    throw new Error(`${scope} 仅管理员可操作。`)
  }
}

function normalizeAdminStaffRole(value: unknown): AdminStaffRole {
  if (
    value === 'customer' ||
    value === 'sales' ||
    value === 'warehouse' ||
    value === 'purchasing' ||
    value === 'admin'
  ) {
    return value
  }

  return 'customer'
}

function isPermissionManager(role: AdminStaffRole, permissions: unknown) {
  return (
    role === 'admin' ||
    normalizeStaffPermissions(permissions, role).includes('staff_settings.manage')
  )
}

function permissionSummary(permissions: StaffPermission[]) {
  return permissions.map((permission) => staffPermissionLabels[permission]).join('、') || '无功能权限'
}

async function requireStaffPermissionManager(scope: string) {
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    const demoProfile = readDemoAuthProfile()

    if (!profileHasPermission(demoProfile, 'staff_settings.manage')) {
      throw new Error(`${scope} 需要员工权限管理权限。`)
    }

    return {
      id: demoProfile?.id || 'demo-admin',
      email: demoProfile?.email || 'demo@partspro.local',
      role: normalizeAdminStaffRole(demoProfile?.role),
      permissions: normalizeStaffPermissions(demoProfile?.permissions, demoProfile?.role),
    }
  }

  await requireRealSupabaseAdminData(scope)
  const actor = await getCurrentActor()

  if (!actor.id) {
    throw new Error(`${scope} 需要真实登录账号。`)
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role,permissions')
    .eq('id', actor.id)
    .maybeSingle()

  if (error) {
    throw error
  }

  const role = normalizeAdminStaffRole((data as Pick<StaffProfileRow, 'role'> | null)?.role)
  const permissions = normalizeStaffPermissions(
    (data as Pick<StaffProfileRow, 'permissions'> | null)?.permissions,
    role,
  )

  if (!isPermissionManager(role, permissions)) {
    throw new Error(`${scope} 需要员工权限管理权限。`)
  }

  return {
    ...actor,
    role,
    permissions,
  }
}

function ensureCanAssignStaffRole(
  actorRole: AdminStaffRole,
  nextRole: AdminStaffRole,
  nextPermissions: StaffPermission[],
  previousPermissions: StaffPermission[] = [],
) {
  if (nextRole === 'admin' && actorRole !== 'admin') {
    throw new Error('只有超级管理员可以把账号提升为管理员。')
  }

  if (actorRole !== 'admin') {
    const nextStaffSettings = nextPermissions.filter((permission) => permission.startsWith('staff_settings.'))
    const previousStaffSettings = previousPermissions.filter((permission) =>
      permission.startsWith('staff_settings.'),
    )
    const previousSet = new Set(previousStaffSettings)
    const hasStaffSettingsChanged =
      nextStaffSettings.length !== previousStaffSettings.length ||
      nextStaffSettings.some((permission) => !previousSet.has(permission))

    if (hasStaffSettingsChanged) {
      throw new Error('非超级管理员只能分配普通业务权限，不能授予或移除员工设置权限。')
    }
  }
}

function ensureLocalPermissionManagerRemains(
  profileId: string,
  nextRole: AdminStaffRole,
  nextPermissions: StaffPermission[],
) {
  const remainingManagers = staffProfiles.filter((profile) => {
    if (profile.id === profileId) {
      return isPermissionManager(nextRole, nextPermissions)
    }

    return isPermissionManager(profile.role, profile.permissions)
  })

  if (remainingManagers.length === 0) {
    throw new Error('至少需要保留一个管理员或员工权限管理员，避免锁死后台。')
  }
}

async function ensureRemotePermissionManagerRemains(
  profileId: string,
  nextRole: AdminStaffRole,
  nextPermissions: StaffPermission[],
) {
  const { data, error } = await supabase.from('profiles').select('id,role,permissions')

  if (error) {
    throw error
  }

  const remainingManagers = (data || []).filter((row) => {
    const profile = row as Pick<StaffProfileRow, 'id' | 'role' | 'permissions'>
    if (profile.id === profileId) {
      return isPermissionManager(nextRole, nextPermissions)
    }

    return isPermissionManager(normalizeAdminStaffRole(profile.role), profile.permissions)
  })

  if (remainingManagers.length === 0) {
    throw new Error('至少需要保留一个管理员或员工权限管理员，避免锁死后台。')
  }
}

async function recordAdminAuditLog(
  entityType: AuditLog['entityType'],
  entityId: string,
  action: string,
  summary: string,
  metadata: Record<string, unknown> = {},
) {
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return null
  }

  const actor = await getCurrentActor()
  const { error } = await supabase.from('admin_audit_logs').insert({
    actor_id: actor.id || null,
    actor_email: actor.email,
    entity_type: entityType,
    entity_id: entityId,
    action,
    summary,
    metadata,
  })

  if (error) {
    warnAdminDataError('admin audit log', error)
  }

  return null
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function buildProductPayload(patch: AdminProductPatch, options: { includeStockQty?: boolean } = {}) {
  const payload: Record<string, unknown> = {}

  if (patch.skuCode !== undefined) payload.sku_code = cleanString(patch.skuCode)
  if (patch.name !== undefined) payload.name = cleanString(patch.name)
  if (patch.brand !== undefined) payload.brand = cleanString(patch.brand)
  if (patch.model !== undefined) payload.model = cleanString(patch.model)
  if (patch.modelCode !== undefined) payload.model_code = cleanString(patch.modelCode)
  if (patch.modelCodes !== undefined) payload.model_codes = patch.modelCodes
  if (patch.category !== undefined) payload.category = cleanString(patch.category)
  if (patch.qualityGrade !== undefined) payload.quality_grade = cleanString(patch.qualityGrade)
  if (patch.color !== undefined) payload.color = cleanString(patch.color)
  if (patch.frame !== undefined) payload.frame = patch.frame
  if (patch.stockStatus !== undefined) payload.stock_status = patch.stockStatus
  if (patch.moq !== undefined) payload.moq = patch.moq
  if (patch.costPrice !== undefined) payload.cost_price = patch.costPrice
  if (patch.retailPrice !== undefined) payload.retail_price = patch.retailPrice
  if (patch.b2bPrice !== undefined) payload.b2b_price = patch.b2bPrice
  if (patch.vatMode !== undefined) payload.vat_mode = patch.vatMode
  if (patch.tierPrices !== undefined) payload.tier_prices = patch.tierPrices
  if (options.includeStockQty && patch.stockQty !== undefined) payload.stock_qty = patch.stockQty
  if (patch.location !== undefined) payload.location = cleanString(patch.location)
  if (patch.batchCode !== undefined) payload.batch_code = cleanString(patch.batchCode)
  if (patch.supplier !== undefined) payload.supplier = cleanString(patch.supplier)
  if (patch.warrantyDays !== undefined) payload.warranty_days = patch.warrantyDays
  if (patch.weightGram !== undefined) payload.weight_gram = patch.weightGram
  if (patch.imagePath !== undefined) payload.image_path = cleanString(patch.imagePath)
  if (patch.imageAlt !== undefined) payload.image_alt = cleanString(patch.imageAlt)
  if (patch.galleryImagePaths !== undefined) payload.gallery_image_paths = patch.galleryImagePaths
  if (patch.isBattery !== undefined) payload.is_battery = patch.isBattery
  if (patch.isDangerousGoods !== undefined) payload.is_dangerous_goods = patch.isDangerousGoods
  if (patch.msdsUrl !== undefined) payload.msds_url = cleanString(patch.msdsUrl)
  if (patch.un38Url !== undefined) payload.un38_url = cleanString(patch.un38Url)
  if (patch.compatibility !== undefined) payload.compatibility = patch.compatibility
  if (patch.compatibilityModels !== undefined) payload.compatibility_models = patch.compatibilityModels
  if (patch.alternativeSkus !== undefined) payload.alternative_skus = patch.alternativeSkus
  if (patch.addOnSkus !== undefined) payload.add_on_skus = patch.addOnSkus
  if (patch.highlights !== undefined) payload.highlights = patch.highlights
  if (patch.status !== undefined) payload.status = patch.status

  return payload
}

function mapAdminProduct(row: AdminProductRow): AdminProduct {
  return {
    id: row.id,
    skuCode: row.sku_code,
    name: row.name,
    brand: row.brand,
    model: row.model,
    modelCode: row.model_code,
    modelCodes: row.model_codes || [],
    category: row.category,
    qualityGrade: row.quality_grade,
    color: row.color,
    frame: row.frame,
    stockStatus: row.stock_status,
    moq: row.moq,
    costPrice: Number(row.cost_price),
    retailPrice: Number(row.retail_price),
    b2bPrice: Number(row.b2b_price),
    vatMode: row.vat_mode,
    tierPrices: row.tier_prices || [],
    stockQty: row.stock_qty,
    location: row.location,
    batchCode: row.batch_code,
    supplier: row.supplier,
    warrantyDays: row.warranty_days,
    weightGram: row.weight_gram,
    imagePath: row.image_path || '',
    imageAlt: row.image_alt || row.name,
    galleryImagePaths: row.gallery_image_paths || [],
    isBattery: row.is_battery,
    isDangerousGoods: row.is_dangerous_goods,
    msdsUrl: row.msds_url,
    un38Url: row.un38_url,
    compatibility: row.compatibility || [],
    compatibilityModels: row.compatibility_models || [],
    alternativeSkus: row.alternative_skus || [],
    addOnSkus: row.add_on_skus || [],
    highlights: row.highlights || [],
    status: row.status,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by || '',
    archiveReason: row.archive_reason || '',
    updatedAt: row.updated_at,
  }
}

function mapCustomer(row: CustomerRow): CustomerAccount {
  return {
    id: row.id,
    userId: row.user_id || '',
    companyName: row.company_name || '',
    contactName: row.contact_name || '',
    email: row.email || '',
    phone: row.phone || '',
    vatNumber: row.vat_number || '',
    fiscalCode: row.fiscal_code || '',
    sdi: row.sdi || '',
    pec: row.pec || '',
    registeredAddress: row.registered_address || '',
    billingAddress: row.billing_address || '',
    shippingAddress: row.shipping_address || '',
    tier: row.tier,
    priceGroupId: row.price_group_id || '',
    status: row.status,
    monthlyPurchase: row.monthly_purchase || '',
    ordersCount: row.orders_count,
    revenue: Number(row.revenue),
    lastOrderAt: row.last_order_at,
    creditLimit: Number(row.credit_limit),
    paymentTerms: row.payment_terms || '',
    adminNote: row.admin_note || '',
    profileCompletedAt: row.profile_completed_at,
    archivedAt: row.archived_at,
    archivedBy: row.archived_by || '',
    archiveReason: row.archive_reason || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    actorId: row.actor_id || '',
    actorEmail: row.actor_email || '',
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  }
}

function mapCustomerOrderFiscal(rawFiscal: Record<string, unknown> | null): AdminOrder['fiscal'] {
  const fiscal = rawFiscal || {}

  return {
    vatNumber: String(fiscal.vatNumber || ''),
    fiscalCode: String(fiscal.fiscalCode || ''),
    sdi: String(fiscal.sdi || ''),
    pec: String(fiscal.pec || ''),
  }
}

function mapCustomerOrderLine(row: CustomerOrderLineRow): AdminOrder['lines'][number] {
  return {
    skuCode: row.sku_code,
    productName: row.product_name,
    qualityGrade: row.quality_grade,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    stockStatus: row.stock_status,
    batchCode: row.batch_code,
    location: row.location,
  }
}

function mapCustomerOrder(row: CustomerTimelineOrderRow): AdminOrder {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name || '',
    customerTier: row.customer_tier || 'standard',
    status: row.status,
    paymentStatus: row.payment_status || 'pending',
    stockRisk: row.stock_risk || 'clear',
    totalNet: Number(row.total_net),
    vat: Number(row.vat || 0),
    shipping: Number(row.shipping || 0),
    createdAt: row.created_at,
    shippingMethod: row.shipping_method || '',
    fiscal: mapCustomerOrderFiscal(row.fiscal || null),
    deliveryAddress: row.delivery_address || '',
    customerNote: row.customer_note || '',
    staffNote: row.staff_note || '',
    lines: (row.order_lines || []).map((line) => mapCustomerOrderLine(line)),
  }
}

function mapCustomerRma(row: CustomerTimelineRmaRow): CustomerRmaCase {
  return {
    id: row.id,
    userId: row.user_id || '',
    orderNo: row.order_no,
    skuCode: row.sku_code,
    status: row.status,
    problemType: row.problem_type,
    description: row.description,
    quantity: Number(row.quantity),
    requestedResolution: row.requested_resolution,
    createdAt: row.created_at,
  }
}

function mapApproval(row: B2BApprovalRow): B2BApproval {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    phone: row.phone,
    vatNumber: row.vat_number,
    fiscalCode: row.fiscal_code,
    sdi: row.sdi,
    pec: row.pec,
    companyType: row.company_type,
    registeredAddress: row.registered_address,
    shippingAddress: row.shipping_address,
    monthlyPurchase: row.monthly_purchase,
    interestedCategories: row.interested_categories || [],
    paymentNeeds: row.payment_needs || [],
    status: row.status,
    submittedAt: row.submitted_at,
    requestedPriceGroupId: row.requested_price_group_id,
    reviewNote: row.review_note,
  }
}

function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  return {
    id: row.id,
    skuCode: row.sku_code,
    productName: row.product_name,
    brand: row.brand,
    model: row.model,
    qualityGrade: row.quality_grade,
    batchCode: row.batch_code,
    location: row.location,
    actualQty: row.actual_qty,
    lockedQty: row.locked_qty,
    availableQty: row.available_qty,
    incomingQty: row.incoming_qty,
    qcQty: row.qc_qty,
    rmaQty: row.rma_qty,
    defectiveQty: row.defective_qty,
    supplier: row.supplier,
    lastMovementAt: row.last_movement_at,
  }
}

function mapStockMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    createdAt: row.created_at,
    type: row.type,
    skuCode: row.sku_code,
    batchCode: row.batch_code,
    location: row.location,
    quantity: row.quantity,
    reference: row.reference,
    operator: row.operator,
    note: row.note,
  }
}

function mapPriceGroup(row: PriceGroupRow): PriceGroup {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    customerCount: row.customer_count,
    defaultMarginPercent: Number(row.default_margin_percent),
    paymentTerms: row.payment_terms,
    minMonthlyPurchase: row.min_monthly_purchase,
    visibleCategories: row.visible_categories || [],
    tierRules: row.tier_rules || [],
    updatedAt: row.updated_at,
  }
}

function mapBatch(row: BatchRow): AdminBatch {
  return {
    id: row.id,
    batchCode: row.batch_code,
    supplier: row.supplier,
    purchaseOrder: row.purchase_order,
    status: row.status,
    qcStatus: row.qc_status,
    skuCount: row.sku_count,
    receivedAt: row.received_at || '',
    warehouseLocation: row.warehouse_location,
    isBatteryBatch: row.is_battery_batch,
    msdsUrl: row.msds_url,
    un38Url: row.un38_url,
    notes: row.notes,
  }
}

function mapStaffProfile(row: StaffProfileRow): AdminStaffProfile {
  const role = normalizeAdminStaffRole(row.role)
  const customerRelation = row.customers
  const customerCompanyName = Array.isArray(customerRelation)
    ? customerRelation[0]?.company_name || ''
    : customerRelation?.company_name || ''

  return {
    id: row.id,
    email: row.email,
    role,
    permissions: resolveStaffPermissions(role, row.permissions),
    staffEnabled: Boolean(row.staff_enabled) || staffRoles.includes(role),
    staffEnabledBy: row.staff_enabled_by || '',
    staffEnabledAt: row.staff_enabled_at,
    customerCompanyName,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function findCustomerIdForApproval(approval: B2BApprovalRow) {
  const normalizedEmail = approval.email.trim()

  if (normalizedEmail) {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('email', normalizedEmail)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data?.id) {
      return data.id as string
    }
  }

  if (approval.vat_number) {
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .eq('vat_number', approval.vat_number)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data?.id) {
      return data.id as string
    }
  }

  return ''
}

async function fetchPriceGroupTerms(priceGroupId: string) {
  const demoGroup = priceGroups.find((group) => group.id === priceGroupId)

  if (!priceGroupId) {
    return demoGroup?.paymentTerms || ''
  }

  const { data, error } = await supabase
    .from('price_groups')
    .select('payment_terms')
    .eq('id', priceGroupId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return String(data?.payment_terms || demoGroup?.paymentTerms || '')
}

async function upsertSupabaseCustomerFromApproval(approval: B2BApprovalRow, priceGroupId: string) {
  const resolvedPriceGroupId = priceGroupId || approval.requested_price_group_id || 'pg-standard-b2b'
  const tier = deriveCustomerTier(resolvedPriceGroupId)
  const existingCustomerId = await findCustomerIdForApproval(approval)
  const registeredAddress = approval.registered_address || approval.shipping_address || ''
  const shippingAddress = approval.shipping_address || registeredAddress
  const payload = {
    company_name: approval.company_name || approval.email,
    contact_name: approval.contact_name || approval.email,
    email: approval.email,
    phone: approval.phone || '',
    vat_number: approval.vat_number || '',
    fiscal_code: approval.fiscal_code || '',
    sdi: approval.sdi || '',
    pec: approval.pec || '',
    registered_address: registeredAddress,
    billing_address: registeredAddress,
    shipping_address: shippingAddress,
    tier,
    price_group_id: resolvedPriceGroupId,
    status: 'active' as const,
    monthly_purchase: approval.monthly_purchase || '',
    credit_limit: creditLimitForTier(tier),
    payment_terms: await fetchPriceGroupTerms(resolvedPriceGroupId),
    profile_completed_at: registeredAddress && shippingAddress && approval.phone ? new Date().toISOString() : null,
  }

  if (existingCustomerId) {
    const { error } = await supabase.from('customers').update(payload).eq('id', existingCustomerId)

    if (error) {
      throw error
    }

    return
  }

  const { error } = await supabase.from('customers').insert(payload)

  if (error) {
    throw error
  }
}

export async function fetchAdminProducts() {
  await requireRealSupabaseAdminData('商品管理')

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('brand', { ascending: true })
      .order('model', { ascending: true })

    if (error) {
      throw error
    }

    return data.map((row) => mapAdminProduct(row as AdminProductRow))
  } catch (error) {
    warnAdminDataError('admin products', error)
    throw error
  }
}

export async function fetchInventoryItems() {
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return getInventoryItems()
  }

  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('last_movement_at', { ascending: false })

    if (error) {
      throw error
    }

    return data.map((row) => mapInventoryItem(row as InventoryItemRow))
  } catch (error) {
    warnAdminFallback('inventory items', error)
    return getInventoryItems()
  }
}

export async function fetchStockMovements() {
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return getStockMovements()
  }

  try {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) {
      throw error
    }

    return data.map((row) => mapStockMovement(row as StockMovementRow))
  } catch (error) {
    warnAdminFallback('stock movements', error)
    return getStockMovements()
  }
}

export async function saveAdminProduct(productId: string, patch: Partial<AdminProduct>) {
  await requireRealSupabaseAdminData('商品保存')

  try {
    const payload = buildProductPayload(patch)
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    await recordAdminAuditLog('product', productId, 'product.update', `更新商品 ${patch.skuCode || productId}`, {
      changedFields: Object.keys(payload),
    })

    return data ? mapAdminProduct(data as AdminProductRow) : null
  } catch (error) {
    warnAdminDataError('save admin product', error)
    throw error
  }
}

export async function createAdminProduct(product: AdminProductPatch) {
  await requireRealSupabaseAdminData('商品新增')

  const payload = buildProductPayload(
    {
      ...product,
      status: product.status || 'draft',
      stockStatus: product.stockStatus || 'incoming',
      moq: product.moq || 1,
      vatMode: product.vatMode || 'IVA esclusa',
      warrantyDays: product.warrantyDays || 180,
      stockQty: product.stockQty || 0,
    },
    { includeStockQty: true },
  )

  if (!payload.sku_code || !payload.name || !payload.brand || !payload.model || !payload.category) {
    throw new Error('新增商品需要 SKU、名称、品牌、机型和分类。')
  }

  const { data, error } = await supabase.from('products').insert(payload).select('*').maybeSingle()

  if (error) {
    throw error
  }

  await recordAdminAuditLog('product', String(data?.id || product.skuCode || ''), 'product.create', `新增商品 ${product.skuCode}`, {
    skuCode: product.skuCode,
  })

  return data ? mapAdminProduct(data as AdminProductRow) : null
}

export async function archiveAdminProduct(productId: string, reason: string) {
  await requireRealSupabaseAdminData('商品归档')
  const actor = await getCurrentActor()
  const { data, error } = await supabase
    .from('products')
    .update({
      archived_at: new Date().toISOString(),
      archived_by: actor.id || null,
      archive_reason: reason,
      status: 'hidden',
    })
    .eq('id', productId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  await recordAdminAuditLog('product', productId, 'product.archive', `归档商品：${reason}`, { reason })
  return data ? mapAdminProduct(data as AdminProductRow) : null
}

export async function restoreAdminProduct(productId: string) {
  await requireCurrentAdmin('商品恢复')
  const { data, error } = await supabase
    .from('products')
    .update({
      archived_at: null,
      archived_by: null,
      archive_reason: '',
    })
    .eq('id', productId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  await recordAdminAuditLog('product', productId, 'product.restore', '恢复归档商品')
  return data ? mapAdminProduct(data as AdminProductRow) : null
}

export async function bulkImportProducts(previews: ProductImportPreview[]): Promise<ProductImportResult> {
  const validRows = previews.filter((preview) => preview.errors.length === 0)
  const result: ProductImportResult = {
    created: 0,
    updated: 0,
    skipped: previews.length - validRows.length,
    errors: previews
      .filter((preview) => preview.errors.length > 0)
      .map((preview) => ({
        rowNumber: preview.rowNumber,
        message: preview.errors.join('；'),
      })),
  }

  if (!validRows.length) {
    return result
  }

  await requireCurrentAdmin('商品批量导入')

  const existingSkuResponse = await supabase
    .from('products')
    .select('sku_code')
    .in(
      'sku_code',
      validRows.map((row) => String(row.product.skuCode || '')),
    )

  if (existingSkuResponse.error) {
    throw existingSkuResponse.error
  }

  const existingSkuCodes = new Set(
    existingSkuResponse.data?.map((row) => String(row.sku_code).toLowerCase()) || [],
  )

  const payloads = validRows.map((row) =>
    buildProductPayload(
      {
        status: 'draft',
        stockStatus: 'incoming',
        moq: 1,
        vatMode: 'IVA esclusa',
        warrantyDays: 180,
        stockQty: 0,
        ...row.product,
      },
      { includeStockQty: true },
    ),
  )

  const { error } = await supabase.from('products').upsert(payloads, { onConflict: 'sku_code' })

  if (error) {
    throw error
  }

  for (const row of validRows) {
    if (existingSkuCodes.has(String(row.product.skuCode || '').toLowerCase())) {
      result.updated += 1
    } else {
      result.created += 1
    }
  }

  await recordAdminAuditLog('product', 'bulk-import', 'product.bulk_import', `批量导入 ${validRows.length} 个 SKU`, {
    created: result.created,
    updated: result.updated,
    skipped: result.skipped,
  })

  return result
}

export async function uploadProductImage(file: File, skuCode: string, slot: 'main' | 'gallery' = 'main') {
  await requireRealSupabaseAdminData('商品图片上传')

  const extension = file.name.split('.').pop() || 'webp'
  const safeSku = skuCode.trim().toUpperCase().replace(/[^A-Z0-9-]+/g, '-')
  const path = `${slot === 'main' ? 'products' : 'products/gallery'}/${safeSku}-${Date.now()}.${extension}`
  const { data, error } = await supabase.storage.from(productImageBucket).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  })

  if (error) {
    throw error
  }

  await recordAdminAuditLog('product', safeSku, 'product.image_upload', `上传商品图片 ${safeSku}`, {
    path: data.path,
    slot,
  })

  return data.path
}

export async function fetchCustomerAccounts() {
  await requireRealSupabaseAdminData('客户管理')

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return data.map((row) => mapCustomer(row as CustomerRow))
  } catch (error) {
    warnAdminDataError('customers', error)
    throw error
  }
}

function buildCustomerUpdatePayload(patch: CustomerAccountPatch) {
  const payload: Record<string, string | number | null> = {}

  if (patch.companyName !== undefined) {
    payload.company_name = patch.companyName
  }

  if (patch.contactName !== undefined) {
    payload.contact_name = patch.contactName
  }

  if (patch.email !== undefined) {
    payload.email = patch.email
  }

  if (patch.phone !== undefined) {
    payload.phone = patch.phone
  }

  if (patch.vatNumber !== undefined) {
    payload.vat_number = patch.vatNumber
  }

  if (patch.fiscalCode !== undefined) {
    payload.fiscal_code = patch.fiscalCode
  }

  if (patch.sdi !== undefined) {
    payload.sdi = patch.sdi
  }

  if (patch.pec !== undefined) {
    payload.pec = patch.pec
  }

  if (patch.registeredAddress !== undefined) {
    payload.registered_address = patch.registeredAddress
  }

  if (patch.billingAddress !== undefined) {
    payload.billing_address = patch.billingAddress
  }

  if (patch.shippingAddress !== undefined) {
    payload.shipping_address = patch.shippingAddress
  }

  if (patch.status !== undefined) {
    payload.status = patch.status
  }

  if (patch.tier !== undefined) {
    payload.tier = patch.tier
  }

  if (patch.priceGroupId !== undefined) {
    payload.price_group_id = patch.priceGroupId || null
  }

  if (patch.monthlyPurchase !== undefined) {
    payload.monthly_purchase = patch.monthlyPurchase
  }

  if (patch.creditLimit !== undefined) {
    payload.credit_limit = patch.creditLimit
  }

  if (patch.paymentTerms !== undefined) {
    payload.payment_terms = patch.paymentTerms
  }

  if (patch.adminNote !== undefined) {
    payload.admin_note = patch.adminNote
  }

  return payload
}

export async function saveCustomerAccount(customerId: string, patch: CustomerAccountPatch) {
  await requireRealSupabaseAdminData('客户审批')

  const payload = buildCustomerUpdatePayload(patch)

  if (Object.keys(payload).length === 0) {
    throw new Error('没有可保存的客户变更。')
  }

  try {
    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', customerId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('未找到客户，或当前账号没有审批权限。')
    }

    await recordAdminAuditLog('customer', customerId, 'customer.update', `更新客户 ${patch.companyName || customerId}`, {
      changedFields: Object.keys(payload),
    })

    return mapCustomer(data as CustomerRow)
  } catch (error) {
    warnAdminDataError('save customer', error)
    throw error
  }
}

export async function saveCustomerProfileAdmin(customerId: string, patch: CustomerAccountPatch) {
  return saveCustomerAccount(customerId, patch)
}

export async function approveCustomerAccount(customerId: string, priceGroupId: string) {
  await requireRealSupabaseAdminData('客户审批')

  const resolvedPriceGroupId = priceGroupId || 'pg-standard-b2b'
  const tier = deriveCustomerTier(resolvedPriceGroupId)
  const paymentTerms = await fetchPriceGroupTerms(resolvedPriceGroupId)

  return saveCustomerAccount(customerId, {
    status: 'active',
    tier,
    priceGroupId: resolvedPriceGroupId,
    creditLimit: creditLimitForTier(tier),
    paymentTerms,
  })
}

export async function archiveCustomer(customerId: string, reason: string) {
  await requireRealSupabaseAdminData('客户归档')
  const actor = await getCurrentActor()
  const { data, error } = await supabase
    .from('customers')
    .update({
      archived_at: new Date().toISOString(),
      archived_by: actor.id || null,
      archive_reason: reason,
      status: 'suspended',
    })
    .eq('id', customerId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  await recordAdminAuditLog('customer', customerId, 'customer.archive', `归档客户：${reason}`, { reason })
  return data ? mapCustomer(data as CustomerRow) : null
}

export async function restoreCustomer(customerId: string) {
  await requireCurrentAdmin('客户恢复')
  const { data, error } = await supabase
    .from('customers')
    .update({
      archived_at: null,
      archived_by: null,
      archive_reason: '',
    })
    .eq('id', customerId)
    .select('*')
    .maybeSingle()

  if (error) {
    throw error
  }

  await recordAdminAuditLog('customer', customerId, 'customer.restore', '恢复归档客户')
  return data ? mapCustomer(data as CustomerRow) : null
}

export async function fetchCustomerOrdersAdmin(
  customerId: string,
  filters: CustomerOrderFilters = {},
): Promise<AdminOrder[]> {
  await requireRealSupabaseAdminData('客户订单记录')

  let query = supabase
    .from('orders')
    .select(customerOrderSelect)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    query = query.eq('payment_status', filters.paymentStatus)
  }

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  const { data, error } = await query

  if (error) {
    throw error
  }

  return ((data || []) as unknown as CustomerTimelineOrderRow[]).map((row) => mapCustomerOrder(row))
}

export async function fetchCustomerRmasAdmin(customer: CustomerAccount): Promise<CustomerRmaCase[]> {
  await requireRealSupabaseAdminData('客户 RMA 记录')

  const { data: orderNoRows, error: orderNoError } = await supabase
    .from('orders')
    .select('order_no')
    .eq('customer_id', customer.id)

  if (orderNoError) {
    throw orderNoError
  }

  const orderNos = Array.from(
    new Set((orderNoRows || []).map((row) => String(row.order_no || '')).filter(Boolean)),
  )
  const rmaSelect =
    'id,user_id,order_no,sku_code,status,problem_type,description,quantity,requested_resolution,created_at'
  const requests = []

  if (customer.userId) {
    requests.push(
      supabase
        .from('rma_requests')
        .select(rmaSelect)
        .eq('user_id', customer.userId)
        .order('created_at', { ascending: false }),
    )
  }

  if (orderNos.length) {
    requests.push(
      supabase
        .from('rma_requests')
        .select(rmaSelect)
        .in('order_no', orderNos)
        .order('created_at', { ascending: false }),
    )
  }

  if (!requests.length) {
    return []
  }

  const responses = await Promise.all(requests)
  const rowsById = new Map<string, CustomerRmaCase>()

  responses.forEach((response) => {
    if (response.error) {
      throw response.error
    }

    ;((response.data || []) as CustomerTimelineRmaRow[]).forEach((row) => {
      rowsById.set(row.id, mapCustomerRma(row))
    })
  })

  return Array.from(rowsById.values()).sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

export async function fetchCustomerAuditLogs(customerId: string): Promise<AuditLog[]> {
  await requireRealSupabaseAdminData('客户操作审计')

  const { data, error } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .eq('entity_type', 'customer')
    .eq('entity_id', customerId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    throw error
  }

  return ((data || []) as AuditLogRow[]).map((row) => mapAuditLog(row))
}

async function fetchCustomerB2BApplications(customer: CustomerAccount) {
  const requests = []

  if (customer.email) {
    requests.push(
      supabase
        .from('b2b_applications')
        .select('*')
        .eq('email', customer.email)
        .order('submitted_at', { ascending: false }),
    )
  }

  if (customer.vatNumber) {
    requests.push(
      supabase
        .from('b2b_applications')
        .select('*')
        .eq('vat_number', customer.vatNumber)
        .order('submitted_at', { ascending: false }),
    )
  }

  if (!requests.length) {
    return []
  }

  const responses = await Promise.all(requests)
  const approvalsById = new Map<string, B2BApproval>()

  responses.forEach((response) => {
    if (response.error) {
      throw response.error
    }

    ;((response.data || []) as B2BApprovalRow[]).forEach((row) => {
      approvalsById.set(row.id, mapApproval(row))
    })
  })

  return Array.from(approvalsById.values()).sort(
    (left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime(),
  )
}

async function fetchCustomerPriceGroup(priceGroupId: string) {
  if (!priceGroupId) {
    return null
  }

  const { data, error } = await supabase.from('price_groups').select('*').eq('id', priceGroupId).maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapPriceGroup(data as PriceGroupRow) : null
}

function buildCustomerDetailMetrics(
  profile: CustomerAccount,
  orders: AdminOrder[],
  rmas: CustomerRmaCase[],
): CustomerDetail['metrics'] {
  const ordersCount = orders.length || profile.ordersCount
  const revenue = orders.length ? orders.reduce((total, order) => total + order.totalNet, 0) : profile.revenue
  const lastOrderAt = orders[0]?.createdAt || profile.lastOrderAt
  const pendingPaymentAmount = orders
    .filter((order) => order.paymentStatus !== 'paid')
    .reduce((total, order) => total + order.totalNet + order.vat + order.shipping, 0)

  return {
    ordersCount,
    revenue,
    averageOrderValue: ordersCount > 0 ? revenue / ordersCount : 0,
    lastOrderAt,
    openOrdersCount: orders.filter((order) => order.status !== 'completed').length,
    pendingPaymentAmount,
    rmaCount: rmas.length,
  }
}

export async function fetchCustomerDetail(customerId: string): Promise<CustomerDetail> {
  await requireRealSupabaseAdminData('客户详情')

  const { data, error } = await supabase.from('customers').select('*').eq('id', customerId).maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    throw new Error('未找到客户，或当前账号没有客户详情权限。')
  }

  const profile = mapCustomer(data as CustomerRow)
  const [orders, rmas, auditLogs, b2bApplications, priceGroup] = await Promise.all([
    fetchCustomerOrdersAdmin(profile.id),
    fetchCustomerRmasAdmin(profile),
    fetchCustomerAuditLogs(profile.id),
    fetchCustomerB2BApplications(profile),
    fetchCustomerPriceGroup(profile.priceGroupId),
  ])

  return {
    profile,
    metrics: buildCustomerDetailMetrics(profile, orders, rmas),
    orders,
    rmas,
    b2bApplications,
    auditLogs,
    priceGroup,
  }
}

export async function fetchCustomerTimeline(customer: CustomerAccount): Promise<CustomerTimelineItem[]> {
  await requireRealSupabaseAdminData('客户时间线')

  const [auditLogs, orders, rmas] = await Promise.all([
    fetchCustomerAuditLogs(customer.id),
    fetchCustomerOrdersAdmin(customer.id, { limit: 5 }),
    fetchCustomerRmasAdmin(customer),
  ])

  const auditItems = auditLogs.slice(0, 5).map((audit) => ({
    id: audit.id,
    type: 'audit' as const,
    source: 'audit' as const,
    title: audit.summary || audit.action,
    description: audit.actorEmail ? `${audit.actorEmail} / ${audit.action}` : audit.action,
    status: audit.action,
    targetRoute: `/admin/customers/${customer.id}?tab=audit`,
    createdAt: audit.createdAt,
  }))

  const orderItems = orders.slice(0, 5).map((order) => ({
    id: order.id,
    type: 'order' as const,
    source: 'order' as const,
    title: `订单 ${order.orderNo}`,
    description: `${order.status} / ${order.paymentStatus} / ${order.lines.length} 个 SKU`,
    amount: order.totalNet,
    status: order.status,
    targetRoute: `/admin/orders/${order.id}`,
    createdAt: order.createdAt,
  }))

  const rmaItems = rmas.slice(0, 5).map((rma) => ({
    id: rma.id,
    type: 'rma' as const,
    source: 'rma' as const,
    title: `RMA ${rma.orderNo}`,
    description: `${rma.skuCode} / ${rma.status}`,
    status: rma.status,
    targetRoute: `/admin/customers/${customer.id}?tab=rmas&rma=${rma.id}`,
    createdAt: rma.createdAt,
  }))

  return [...auditItems, ...orderItems, ...rmaItems].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

export async function fetchB2BApprovals() {
  await requireRealSupabaseAdminData('B2B 审核')

  try {
    const { data, error } = await supabase
      .from('b2b_applications')
      .select('*')
      .order('submitted_at', { ascending: false })

    if (error) {
      throw error
    }

    return data.map((row) => mapApproval(row as B2BApprovalRow))
  } catch (error) {
    warnAdminDataError('b2b approvals', error)
    throw error
  }
}

export async function approveB2BApplication(
  approvalId: string,
  status: Extract<B2BApprovalStatus, 'approved' | 'rejected'>,
  priceGroupId: string,
) {
  await requireRealSupabaseAdminData('B2B 审核')

  try {
    const { data, error } = await supabase
      .from('b2b_applications')
      .update({
        status,
        requested_price_group_id: priceGroupId,
        review_note:
          status === 'approved'
            ? `已分配价格组 ${priceGroupId}`
            : '已拒绝：公司资料或采购量暂不符合。',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', approvalId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    if (data && status === 'approved') {
      await upsertSupabaseCustomerFromApproval(data as B2BApprovalRow, priceGroupId)
    }

    await recordAdminAuditLog(
      'b2b_approval',
      approvalId,
      status === 'approved' ? 'b2b.approve' : 'b2b.reject',
      status === 'approved' ? `通过 B2B 申请并分配 ${priceGroupId}` : '拒绝 B2B 申请',
      { priceGroupId },
    )

    return data ? mapApproval(data as B2BApprovalRow) : null
  } catch (error) {
    warnAdminDataError('review b2b approval', error)
    throw error
  }
}

export async function fetchPriceGroups(options: { realOnly?: boolean } = {}) {
  if (options.realOnly) {
    await requireRealSupabaseAdminData('价格组')
  } else if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {

    return getPriceGroups()
  }

  try {
    const { data, error } = await supabase.from('price_groups').select('*').order('name')

    if (error) {
      throw error
    }

    return data.map((row) => mapPriceGroup(row as PriceGroupRow))
  } catch (error) {
    if (options.realOnly) {
      warnAdminDataError('price groups', error)
      throw error
    }

    warnAdminFallback('price groups', error)
    return getPriceGroups()
  }
}

export async function fetchAdminBatches() {
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return getAdminBatches()
  }

  try {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('received_at', { ascending: false })

    if (error) {
      throw error
    }

    return data.map((row) => mapBatch(row as BatchRow))
  } catch (error) {
    warnAdminFallback('batches', error)
    return getAdminBatches()
  }
}

export async function fetchStaffProfiles() {
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return getStaffProfiles()
  }

  try {
    const { data, error } = await supabase.from('profiles').select('*').order('email')

    if (error) {
      throw error
    }

    const profiles = data.map((row) => mapStaffProfile(row as StaffProfileRow))
    const profileIds = profiles.map((profile) => profile.id)

    if (profileIds.length === 0) {
      return profiles
    }

    const { data: customerRows, error: customerError } = await supabase
      .from('customers')
      .select('user_id,company_name')
      .in('user_id', profileIds)

    if (customerError) {
      warnAdminDataError('staff customer company lookup', customerError)
      return profiles
    }

    const companyByUserId = new Map(
      (customerRows || []).map((customer) => [
        (customer as Pick<CustomerRow, 'user_id'>).user_id || '',
        (customer as Pick<CustomerRow, 'company_name'>).company_name || '',
      ]),
    )

    return profiles.map((profile) => ({
      ...profile,
      customerCompanyName: companyByUserId.get(profile.id) || profile.customerCompanyName,
    }))
  } catch (error) {
    warnAdminFallback('staff profiles', error)
    return getStaffProfiles()
  }
}

export async function saveStaffProfileRole(profileId: string, role: AdminStaffRole) {
  return saveStaffProfilePermissions(profileId, role, defaultPermissionsForRole(role))
}

export async function saveStaffProfilePermissions(
  profileId: string,
  role: AdminStaffRole,
  permissions: StaffPermission[],
) {
  const normalizedRole = normalizeAdminStaffRole(role)
  const normalizedPermissions = normalizeStaffPermissions(permissions, normalizedRole)
  const actor = await requireStaffPermissionManager('员工权限保存')

  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    const previousProfile = staffProfiles.find((profile) => profile.id === profileId)
    ensureCanAssignStaffRole(
      actor.role,
      normalizedRole,
      normalizedPermissions,
      previousProfile?.permissions || [],
    )
    return updateStaffProfilePermissions(profileId, normalizedRole, normalizedPermissions)
  }

  try {
    const { data: currentProfile, error: currentError } = await supabase
      .from('profiles')
      .select('role,permissions,staff_enabled,staff_enabled_at')
      .eq('id', profileId)
      .maybeSingle()

    if (currentError) {
      throw currentError
    }

    const previousRole = normalizeAdminStaffRole(
      (currentProfile as Pick<StaffProfileRow, 'role'> | null)?.role,
    )
    const previousPermissions = resolveStaffPermissions(
      previousRole,
      (currentProfile as Pick<StaffProfileRow, 'permissions'> | null)?.permissions,
    )

    ensureCanAssignStaffRole(actor.role, normalizedRole, normalizedPermissions, previousPermissions)
    await ensureRemotePermissionManagerRemains(profileId, normalizedRole, normalizedPermissions)

    const now = new Date().toISOString()
    const staffEnabled = normalizedRole !== 'customer' || normalizedPermissions.length > 0
    const { data, error } = await supabase
      .from('profiles')
      .update({
        role: normalizedRole,
        permissions: normalizedPermissions,
        staff_enabled: staffEnabled,
        staff_enabled_by: staffEnabled ? actor.id || null : null,
        staff_enabled_at:
          staffEnabled && !(currentProfile as Pick<StaffProfileRow, 'staff_enabled_at'> | null)?.staff_enabled_at
            ? now
            : (currentProfile as Pick<StaffProfileRow, 'staff_enabled_at'> | null)?.staff_enabled_at || null,
      })
      .eq('id', profileId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    await recordAdminAuditLog(
      'staff_profile',
      profileId,
      'staff_profile.permissions.update',
      `更新员工权限：${permissionSummary(normalizedPermissions)}`,
      {
        source: 'staff_settings',
        previous: currentProfile || null,
        next: {
          role: normalizedRole,
          permissions: normalizedPermissions,
          staffEnabled,
        },
      },
    )

    return data ? mapStaffProfile(data as StaffProfileRow) : null
  } catch (error) {
    warnAdminFallback('save staff profile', error)
    return updateStaffProfilePermissions(profileId, normalizedRole, normalizedPermissions)
  }
}

export async function enableCustomerStaffAccess(
  customerId: string,
  role: AdminStaffRole,
  permissions: StaffPermission[],
) {
  const normalizedRole = normalizeAdminStaffRole(role)
  const normalizedPermissions = normalizeStaffPermissions(permissions, normalizedRole)
  const actor = await requireStaffPermissionManager('客户后台员工开通')

  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    const customer = customers.find((item) => item.id === customerId)

    if (!customer) {
      throw new Error('未找到客户。')
    }

    if (!customer.userId) {
      throw new Error('该客户尚未绑定登录账号，不能开通后台员工。')
    }

    const existingProfile = staffProfiles.find((profile) => profile.id === customer.userId)
    ensureCanAssignStaffRole(
      actor.role,
      normalizedRole,
      normalizedPermissions,
      existingProfile?.permissions || [],
    )
    if (existingProfile) {
      return updateStaffProfilePermissions(existingProfile.id, normalizedRole, normalizedPermissions)
    }

    const now = new Date().toISOString()
    const nextProfile: AdminStaffProfile = {
      id: customer.userId,
      email: customer.email,
      role: normalizedRole,
      permissions: normalizedPermissions,
      staffEnabled: true,
      staffEnabledBy: actor.id,
      staffEnabledAt: now,
      customerCompanyName: customer.companyName,
      createdAt: now,
      updatedAt: now,
    }
    staffProfiles.push(nextProfile)
    return { ...nextProfile, permissions: [...nextProfile.permissions] }
  }

  const { data: customerData, error: customerError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .maybeSingle()

  if (customerError) {
    throw customerError
  }

  const customer = customerData ? mapCustomer(customerData as CustomerRow) : null

  if (!customer) {
    throw new Error('未找到客户。')
  }

  if (!customer.userId) {
    throw new Error('该客户尚未绑定登录账号，不能开通后台员工。')
  }

  await ensureRemotePermissionManagerRemains(customer.userId, normalizedRole, normalizedPermissions)

  const { data: currentProfile, error: currentError } = await supabase
    .from('profiles')
    .select('id,email,role,permissions,staff_enabled,staff_enabled_at,created_at,updated_at')
    .eq('id', customer.userId)
    .maybeSingle()

  if (currentError) {
    throw currentError
  }

  const previousRole = normalizeAdminStaffRole(
    (currentProfile as Pick<StaffProfileRow, 'role'> | null)?.role,
  )
  const previousPermissions = currentProfile
    ? resolveStaffPermissions(
        previousRole,
        (currentProfile as Pick<StaffProfileRow, 'permissions'> | null)?.permissions,
      )
    : []

  ensureCanAssignStaffRole(actor.role, normalizedRole, normalizedPermissions, previousPermissions)
  const now = new Date().toISOString()
  const staffEnabledAt =
    (currentProfile as Pick<StaffProfileRow, 'staff_enabled_at'> | null)?.staff_enabled_at || now
  const payload = {
    role: normalizedRole,
    permissions: normalizedPermissions,
    staff_enabled: true,
    staff_enabled_by: actor.id || null,
    staff_enabled_at: staffEnabledAt,
    updated_at: now,
  }
  const query = currentProfile
    ? supabase
        .from('profiles')
        .update(payload)
        .eq('id', customer.userId)
        .select('*')
        .maybeSingle()
    : supabase
        .from('profiles')
        .insert({
          id: customer.userId,
          email: customer.email,
          ...payload,
        })
        .select('*')
        .maybeSingle()

  const { data, error } = await query

  if (error) {
    throw error
  }

  await recordAdminAuditLog(
    'staff_profile',
    customer.userId,
    currentProfile ? 'staff_profile.customer_access.update' : 'staff_profile.customer_access.enable',
    `从客户管理开通后台员工：${customer.companyName || customer.email}`,
    {
      source: 'customers',
      customerId: customer.id,
      customerEmail: customer.email,
      customerCompanyName: customer.companyName,
      previous: currentProfile || null,
      next: {
        role: normalizedRole,
        permissions: normalizedPermissions,
        staffEnabled: true,
      },
    },
  )

  await recordAdminAuditLog(
    'customer',
    customer.id,
    'customer.staff_access.enable',
    `开通后台员工：${role} / ${permissionSummary(normalizedPermissions)}`,
    {
      source: 'customers',
      profileId: customer.userId,
      role: normalizedRole,
      permissions: normalizedPermissions,
    },
  )

  return data
    ? {
        ...mapStaffProfile(data as StaffProfileRow),
        customerCompanyName: customer.companyName,
      }
    : null
}
