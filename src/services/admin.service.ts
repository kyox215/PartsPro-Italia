import type {
  AdminBatch,
  AdminOrder,
  AdminOrderStatus,
  AdminProduct,
  AdminStaffProfile,
  AdminStaffRole,
  B2BApproval,
  B2BApprovalStatus,
  CustomerAccount,
  CustomerAccountPatch,
  CustomerTier,
  InventoryItem,
  PriceGroup,
  StockMovement,
  StockMovementType,
} from '@/types/admin'
import { shouldUseSupabaseData, supabase } from '@/lib/supabase'
import { hasDemoAuthProfile } from '@/services/demo-auth.service'

type AdminProductRow = {
  id: string
  sku_code: string
  name: string
  brand: string
  model: string
  model_code: string
  category: string
  quality_grade: string
  color: string
  frame: AdminProduct['frame']
  cost_price: number
  retail_price: number
  b2b_price: number
  tier_prices: AdminProduct['tierPrices'] | null
  stock_qty: number
  location: string
  batch_code: string
  supplier: string
  warranty_days: number
  weight_gram: number
  is_battery: boolean
  is_dangerous_goods: boolean
  msds_url: string
  un38_url: string
  compatibility_models: string[] | null
  alternative_skus: string[] | null
  add_on_skus: string[] | null
  status: AdminProduct['status']
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
  profile_completed_at: string | null
  created_at: string
  updated_at: string
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
    category: 'Screens',
    qualityGrade: 'Soft OLED',
    color: 'Black',
    frame: 'Without Frame',
    costPrice: 24.8,
    retailPrice: 49.9,
    b2bPrice: 32,
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
    isBattery: false,
    isDangerousGoods: false,
    msdsUrl: '',
    un38Url: '',
    compatibilityModels: ['iPhone 11 A2111', 'iPhone 11 A2221', 'iPhone 11 A2223'],
    alternativeSkus: ['IP11-SCR-HARD-BLK', 'IP11-SCR-TFT-BLK'],
    addOnSkus: ['TOOL-WATERPROOF-SET'],
    status: 'active',
    updatedAt: '2026-05-22T10:40:00+02:00',
  },
  {
    id: 'pim-ip12-battery',
    skuCode: 'IP12-BAT-HQ-2815',
    name: 'iPhone 12 Battery 2815mAh Compatible High Quality',
    brand: 'Apple',
    model: 'iPhone 12',
    modelCode: 'A2172 / A2402 / A2403',
    category: 'Batteries',
    qualityGrade: 'High Quality Compatible',
    color: 'Black',
    frame: 'N/A',
    costPrice: 9.8,
    retailPrice: 24.9,
    b2bPrice: 14.5,
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
    isBattery: true,
    isDangerousGoods: true,
    msdsUrl: 'MSDS-IP12-BAT-HQ.pdf',
    un38Url: 'UN38.3-IP12-BAT-HQ.pdf',
    compatibilityModels: ['iPhone 12 A2172', 'iPhone 12 A2402', 'iPhone 12 A2403'],
    alternativeSkus: ['IP12-BAT-OEM-PULL'],
    addOnSkus: ['TOOL-WATERPROOF-SET'],
    status: 'active',
    updatedAt: '2026-05-22T09:28:00+02:00',
  },
  {
    id: 'pim-sa52-charge',
    skuCode: 'SA52-CHG-EU-BLK',
    name: 'Samsung Galaxy A52 Charging Port Flex EU Version',
    brand: 'Samsung',
    model: 'Galaxy A52',
    modelCode: 'SM-A525F / SM-A526B',
    category: 'Charging Ports',
    qualityGrade: 'Compatible High Quality',
    color: 'Black',
    frame: 'N/A',
    costPrice: 3.4,
    retailPrice: 12.9,
    b2bPrice: 5.9,
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
    isBattery: false,
    isDangerousGoods: false,
    msdsUrl: '',
    un38Url: '',
    compatibilityModels: ['Galaxy A52 SM-A525F', 'Galaxy A52 5G SM-A526B'],
    alternativeSkus: ['SA52-CHG-5G-BLK'],
    addOnSkus: [],
    status: 'active',
    updatedAt: '2026-05-22T08:56:00+02:00',
  },
  {
    id: 'pim-rn10-back',
    skuCode: 'RN10-BKC-BLU',
    name: 'Xiaomi Redmi Note 10 Back Cover Blue',
    brand: 'Xiaomi',
    model: 'Redmi Note 10',
    modelCode: 'M2101K7AG',
    category: 'Back Covers',
    qualityGrade: 'Compatible High Quality',
    color: 'Blue',
    frame: 'N/A',
    costPrice: 4.6,
    retailPrice: 14.9,
    b2bPrice: 7.8,
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
    isBattery: false,
    isDangerousGoods: false,
    msdsUrl: '',
    un38Url: '',
    compatibilityModels: ['Redmi Note 10 M2101K7AG'],
    alternativeSkus: ['RN10-BKC-BLK'],
    addOnSkus: ['TOOL-PRY-SET'],
    status: 'draft',
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
    createdAt: '2026-05-18T08:00:00+02:00',
    updatedAt: '2026-05-22T09:00:00+02:00',
  },
  {
    id: 'profile-sales',
    email: 'sales@partspro.example',
    role: 'sales',
    createdAt: '2026-05-18T08:10:00+02:00',
    updatedAt: '2026-05-21T16:00:00+02:00',
  },
  {
    id: 'profile-warehouse',
    email: 'warehouse@partspro.example',
    role: 'warehouse',
    createdAt: '2026-05-18T08:20:00+02:00',
    updatedAt: '2026-05-21T16:05:00+02:00',
  },
  {
    id: 'profile-customer',
    email: 'amministrazione@mobilecarebari.example',
    role: 'customer',
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
  return staffProfiles.map((profile) => ({ ...profile }))
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
    tierPrices: product.tierPrices.map((tier) => ({ ...tier })),
    compatibilityModels: [...product.compatibilityModels],
    alternativeSkus: [...product.alternativeSkus],
    addOnSkus: [...product.addOnSkus],
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
  const profile = staffProfiles.find((item) => item.id === profileId)

  if (!profile) {
    throw new Error('未找到员工账号。')
  }

  profile.role = role
  profile.updatedAt = new Date().toISOString()
  return { ...profile }
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
    throw new Error(`${scope} 需要使用真实 Supabase 管理员账号，演示账号不会显示客户真实数据。`)
  }

  throw new Error(`${scope} 需要真实 Supabase 登录会话。`)
}

function mapAdminProduct(row: AdminProductRow): AdminProduct {
  return {
    id: row.id,
    skuCode: row.sku_code,
    name: row.name,
    brand: row.brand,
    model: row.model,
    modelCode: row.model_code,
    category: row.category,
    qualityGrade: row.quality_grade,
    color: row.color,
    frame: row.frame,
    costPrice: Number(row.cost_price),
    retailPrice: Number(row.retail_price),
    b2bPrice: Number(row.b2b_price),
    tierPrices: row.tier_prices || [],
    stockQty: row.stock_qty,
    location: row.location,
    batchCode: row.batch_code,
    supplier: row.supplier,
    warrantyDays: row.warranty_days,
    weightGram: row.weight_gram,
    isBattery: row.is_battery,
    isDangerousGoods: row.is_dangerous_goods,
    msdsUrl: row.msds_url,
    un38Url: row.un38_url,
    compatibilityModels: row.compatibility_models || [],
    alternativeSkus: row.alternative_skus || [],
    addOnSkus: row.add_on_skus || [],
    status: row.status,
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
    profileCompletedAt: row.profile_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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
  return {
    id: row.id,
    email: row.email,
    role: row.role,
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
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return getAdminProducts()
  }

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
    warnAdminFallback('admin products', error)
    return getAdminProducts()
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
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return updateAdminProduct(productId, patch)
  }

  try {
    const payload = {
      name: patch.name,
      brand: patch.brand,
      model: patch.model,
      model_code: patch.modelCode,
      category: patch.category,
      quality_grade: patch.qualityGrade,
      color: patch.color,
      frame: patch.frame,
      cost_price: patch.costPrice,
      retail_price: patch.retailPrice,
      b2b_price: patch.b2bPrice,
      stock_qty: patch.stockQty,
      location: patch.location,
      batch_code: patch.batchCode,
      supplier: patch.supplier,
      warranty_days: patch.warrantyDays,
      weight_gram: patch.weightGram,
      is_battery: patch.isBattery,
      is_dangerous_goods: patch.isDangerousGoods,
      msds_url: patch.msdsUrl,
      un38_url: patch.un38Url,
      compatibility_models: patch.compatibilityModels,
      alternative_skus: patch.alternativeSkus,
      add_on_skus: patch.addOnSkus,
      status: patch.status,
    }
    const { data, error } = await supabase
      .from('products')
      .update(payload)
      .eq('id', productId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapAdminProduct(data as AdminProductRow) : null
  } catch (error) {
    warnAdminFallback('save admin product', error)
    return updateAdminProduct(productId, patch)
  }
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

    return mapCustomer(data as CustomerRow)
  } catch (error) {
    warnAdminDataError('save customer', error)
    throw error
  }
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

    return data.map((row) => mapStaffProfile(row as StaffProfileRow))
  } catch (error) {
    warnAdminFallback('staff profiles', error)
    return getStaffProfiles()
  }
}

export async function saveStaffProfileRole(profileId: string, role: AdminStaffRole) {
  if (!shouldUseSupabaseData || hasDemoAuthProfile() || !(await hasRealSupabaseSession())) {
    return updateStaffProfileRole(profileId, role)
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', profileId)
      .select('*')
      .maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapStaffProfile(data as StaffProfileRow) : null
  } catch (error) {
    warnAdminFallback('save staff profile', error)
    return updateStaffProfileRole(profileId, role)
  }
}
