import type {
  AdminBatch,
  AdminOrder,
  AdminOrderStatus,
  AdminProduct,
  B2BApproval,
  B2BApprovalStatus,
  CustomerAccount,
  InventoryItem,
  PriceGroup,
  StockMovement,
} from '@/types/admin'
import { shouldUseSupabaseData, supabase } from '@/lib/supabase'

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
  company_name: string
  contact_name: string
  email: string
  vat_number: string
  sdi: string
  pec: string
  tier: CustomerAccount['tier']
  price_group_id: string
  status: CustomerAccount['status']
  monthly_purchase: string
  orders_count: number
  revenue: number
  last_order_at: string | null
  credit_limit: number
  payment_terms: string
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
  monthly_purchase: string
  interested_categories: string[] | null
  status: B2BApproval['status']
  submitted_at: string
  requested_price_group_id: string
  review_note: string
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
    customerNote: 'Se possibile spedire oggi. Priorita schermi iPhone 11.',
    staffNote: 'Cliente gold, ok priorita picking.',
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
    customerNote: 'Bonifico inviato, allegato da verificare.',
    staffNote: 'Verificare split stock per Xiaomi.',
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
    customerNote: 'Aggiungere packing list nel pacco.',
    staffNote: 'Pronto per spedizione, attenzione batteria.',
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
    customerNote: 'Consegna mattina se possibile.',
    staffNote: 'Tracking DHL generato.',
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
    note: 'Stock bloccato per ordine pagato.',
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
    note: 'Controllo batterie prima della vendita.',
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
    note: 'Spedizione DHL confermata.',
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
    note: 'Ingresso merce dopo QC superato.',
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
    note: 'Reso in valutazione tecnica.',
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

const customers: CustomerAccount[] = [
  {
    id: 'cus-ripara-milano',
    companyName: 'RiparaVeloce Milano',
    contactName: 'Luca Ferri',
    email: 'acquisti@riparaveloce.example',
    vatNumber: 'IT12345678901',
    sdi: 'A1B2C3D',
    pec: 'amministrazione@riparaveloce.example',
    tier: 'gold',
    priceGroupId: 'pg-gold-lab',
    status: 'active',
    monthlyPurchase: '€3.000 - €5.000',
    ordersCount: 42,
    revenue: 18420,
    lastOrderAt: '2026-05-22T09:14:00+02:00',
    creditLimit: 2500,
    paymentTerms: 'Carta / PayPal / Bonifico 7gg',
  },
  {
    id: 'cus-centro-roma',
    companyName: 'Centro Repair Roma',
    contactName: 'Giulia Conti',
    email: 'fatture@centrorepair.example',
    vatNumber: 'IT09876543210',
    sdi: '0000000',
    pec: 'fatture@centrorepair.example',
    tier: 'silver',
    priceGroupId: 'pg-silver-shop',
    status: 'active',
    monthlyPurchase: '€1.000 - €3.000',
    ordersCount: 18,
    revenue: 7210,
    lastOrderAt: '2026-05-22T08:32:00+02:00',
    creditLimit: 900,
    paymentTerms: 'Bonifico anticipato',
  },
  {
    id: 'cus-fixlab-firenze',
    companyName: 'FixLab Firenze',
    contactName: 'Marco Bianchi',
    email: 'ordini@fixlab.example',
    vatNumber: 'IT11223344556',
    sdi: 'KRRH6B9',
    pec: 'fixlab@pec.example',
    tier: 'standard',
    priceGroupId: 'pg-standard-b2b',
    status: 'active',
    monthlyPurchase: '< €1.000',
    ordersCount: 7,
    revenue: 1680,
    lastOrderAt: '2026-05-21T16:48:00+02:00',
    creditLimit: 0,
    paymentTerms: 'Stripe / PayPal',
  },
]

const b2bApprovals: B2BApproval[] = [
  {
    id: 'b2b-20260522-014',
    companyName: 'Repair Hub Napoli',
    contactName: 'Antonio Russo',
    email: 'info@repairhubnapoli.example',
    phone: '+39 081 000 1234',
    vatNumber: 'IT13579246801',
    fiscalCode: '13579246801',
    sdi: 'M5UXCR1',
    pec: 'repairhubnapoli@pec.example',
    companyType: 'Laboratorio riparazioni',
    monthlyPurchase: '€1.000 - €3.000',
    interestedCategories: ['Screens', 'Batteries', 'Charging Ports'],
    status: 'submitted',
    submittedAt: '2026-05-22T10:18:00+02:00',
    requestedPriceGroupId: 'pg-silver-shop',
    reviewNote: 'Verificare P.IVA e volume iniziale.',
  },
  {
    id: 'b2b-20260521-011',
    companyName: 'Smart Parts Veneto',
    contactName: 'Elena Costa',
    email: 'sales@smartpartsveneto.example',
    phone: '+39 041 000 5588',
    vatNumber: 'IT24681357902',
    fiscalCode: '24681357902',
    sdi: 'A4707H7',
    pec: 'smartpartsveneto@pec.example',
    companyType: 'Rivenditore',
    monthlyPurchase: '€3.000 - €5.000',
    interestedCategories: ['Screens', 'Cameras', 'Back Covers'],
    status: 'submitted',
    submittedAt: '2026-05-21T15:04:00+02:00',
    requestedPriceGroupId: 'pg-gold-lab',
    reviewNote: 'Richiede listino rivenditore e bonifico 7gg.',
  },
  {
    id: 'b2b-20260520-008',
    companyName: 'Mobile Care Bari',
    contactName: 'Sara Greco',
    email: 'amministrazione@mobilecarebari.example',
    phone: '+39 080 000 7788',
    vatNumber: 'IT99887766554',
    fiscalCode: '99887766554',
    sdi: '0000000',
    pec: 'mobilecarebari@pec.example',
    companyType: 'Negozio riparazioni',
    monthlyPurchase: '< €1.000',
    interestedCategories: ['Batteries', 'Tools'],
    status: 'approved',
    submittedAt: '2026-05-20T12:40:00+02:00',
    requestedPriceGroupId: 'pg-standard-b2b',
    reviewNote: 'Approvato come standard B2B.',
  },
]

const priceGroups: PriceGroup[] = [
  {
    id: 'pg-standard-b2b',
    name: 'Standard B2B',
    description: 'Listino base per clienti approvati e piccoli laboratori.',
    customerCount: 34,
    defaultMarginPercent: 32,
    paymentTerms: 'Stripe / PayPal / Bonifico anticipato',
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
    name: 'Silver Repair Shop',
    description: 'Prezzi dedicati a negozi con acquisto ricorrente.',
    customerCount: 18,
    defaultMarginPercent: 26,
    paymentTerms: 'Bonifico anticipato / 7gg previa approvazione',
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
    name: 'Gold Lab / Reseller',
    description: 'Listino piu aggressivo per laboratori e rivenditori alto volume.',
    customerCount: 9,
    defaultMarginPercent: 20,
    paymentTerms: 'Bonifico 7gg / 15gg con limite credito',
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
    notes: 'Display test superato, 1 pezzo difettoso separato.',
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
    notes: 'Controllo campione batterie prima rilascio completo.',
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
    notes: 'Merce prevista, non vendibile finche QC non e completato.',
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
    throw new Error('Ordine non trovato.')
  }

  order.status = status
  return getAdminOrderById(orderId)
}

export async function staffShipOrder(orderId: string) {
  const order = orders.find((item) => item.id === orderId)

  if (!order) {
    throw new Error('Ordine non trovato.')
  }

  // Placeholder for Supabase RPC: staff_ship_order.
  // Shipping must atomically validate locked stock and write stock movements server-side.
  order.status = 'shipped'
  order.staffNote = `${order.staffNote} staff_ship_order placeholder chiamato.`

  return getAdminOrderById(orderId)
}

export function getInventoryItems() {
  return inventory.map((item) => ({ ...item }))
}

export function getStockMovements() {
  return movements.map((movement) => ({ ...movement }))
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
    throw new Error('Prodotto non trovato.')
  }

  Object.assign(product, patch, {
    updatedAt: new Date().toISOString(),
  })

  return getAdminProducts().find((item) => item.id === productId) || null
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

export async function reviewB2BApproval(
  approvalId: string,
  status: Extract<B2BApprovalStatus, 'approved' | 'rejected'>,
  priceGroupId: string,
) {
  const approval = b2bApprovals.find((item) => item.id === approvalId)

  if (!approval) {
    throw new Error('Richiesta B2B non trovata.')
  }

  approval.status = status
  approval.requestedPriceGroupId = priceGroupId
  approval.reviewNote =
    status === 'approved'
      ? `Approvato con gruppo prezzo ${priceGroupId}.`
      : 'Respinto: dati aziendali o volume non sufficienti.'

  return getB2BApprovals().find((item) => item.id === approvalId) || null
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
    companyName: row.company_name,
    contactName: row.contact_name,
    email: row.email,
    vatNumber: row.vat_number,
    sdi: row.sdi,
    pec: row.pec,
    tier: row.tier,
    priceGroupId: row.price_group_id,
    status: row.status,
    monthlyPurchase: row.monthly_purchase,
    ordersCount: row.orders_count,
    revenue: Number(row.revenue),
    lastOrderAt: row.last_order_at || '',
    creditLimit: Number(row.credit_limit),
    paymentTerms: row.payment_terms,
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
    monthlyPurchase: row.monthly_purchase,
    interestedCategories: row.interested_categories || [],
    status: row.status,
    submittedAt: row.submitted_at,
    requestedPriceGroupId: row.requested_price_group_id,
    reviewNote: row.review_note,
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

export async function fetchAdminProducts() {
  if (!shouldUseSupabaseData) {
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

export async function saveAdminProduct(productId: string, patch: Partial<AdminProduct>) {
  if (!shouldUseSupabaseData) {
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
  if (!shouldUseSupabaseData) {
    return getCustomerAccounts()
  }

  try {
    const { data, error } = await supabase.from('customers').select('*').order('company_name')

    if (error) {
      throw error
    }

    return data.map((row) => mapCustomer(row as CustomerRow))
  } catch (error) {
    warnAdminFallback('customers', error)
    return getCustomerAccounts()
  }
}

export async function fetchB2BApprovals() {
  if (!shouldUseSupabaseData) {
    return getB2BApprovals()
  }

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
    warnAdminFallback('b2b approvals', error)
    return getB2BApprovals()
  }
}

export async function approveB2BApplication(
  approvalId: string,
  status: Extract<B2BApprovalStatus, 'approved' | 'rejected'>,
  priceGroupId: string,
) {
  if (!shouldUseSupabaseData) {
    return reviewB2BApproval(approvalId, status, priceGroupId)
  }

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

    return data ? mapApproval(data as B2BApprovalRow) : null
  } catch (error) {
    warnAdminFallback('review b2b approval', error)
    return reviewB2BApproval(approvalId, status, priceGroupId)
  }
}

export async function fetchPriceGroups() {
  if (!shouldUseSupabaseData) {
    return getPriceGroups()
  }

  try {
    const { data, error } = await supabase.from('price_groups').select('*').order('name')

    if (error) {
      throw error
    }

    return data.map((row) => mapPriceGroup(row as PriceGroupRow))
  } catch (error) {
    warnAdminFallback('price groups', error)
    return getPriceGroups()
  }
}

export async function fetchAdminBatches() {
  if (!shouldUseSupabaseData) {
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
