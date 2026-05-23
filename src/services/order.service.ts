import {
  getAdminOrderById,
  getAdminOrders,
  getNextOrderStatus,
  orderStatusFlow,
  staffShipOrder as staffShipDemoOrder,
  updateOrderStatus as updateDemoOrderStatus,
} from '@/services/admin.service'
import { buildCartLines, calculateCartSummary } from '@/services/cart.service'
import { fetchCurrentCustomerProfile, validateCustomerProfile } from '@/services/customer.service'
import { shouldUseSupabaseData, supabase } from '@/lib/supabase'
import type {
  AdminOrder,
  AdminOrderLine,
  AdminOrderStatus,
  PaymentStatus,
  StockRisk,
} from '@/types/admin'
import type { CartSummary, CheckoutPayload, CreatedOrder } from '@/types/cart'
import type { Product, StockStatus } from '@/types/product'

export { getNextOrderStatus, orderStatusFlow }

type JsonRecord = Record<string, unknown>

type OrderLineRow = {
  id: string
  sku_code: string
  product_name: string
  quality_grade: string
  quantity: number
  unit_price: number
  stock_status: AdminOrderLine['stockStatus']
  batch_code: string
  location: string
}

type OrderRow = {
  id: string
  order_no: string
  customer_name: string
  customer_tier: AdminOrder['customerTier']
  status: AdminOrderStatus
  payment_status: PaymentStatus
  stock_risk: StockRisk
  total_net: number
  vat: number
  shipping: number
  created_at: string
  shipping_method: string
  fiscal: JsonRecord | null
  delivery_address: string
  customer_note: string
  staff_note: string
  order_lines?: OrderLineRow[] | null
}

const demoOrdersStorageKey = 'partspro.demoOrders'

const orderSelect = `
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

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function readStoredDemoOrders() {
  if (!canUseStorage()) {
    return []
  }

  try {
    const rawOrders = window.localStorage.getItem(demoOrdersStorageKey)
    return rawOrders ? (JSON.parse(rawOrders) as AdminOrder[]) : []
  } catch {
    return []
  }
}

function writeStoredDemoOrders(orders: AdminOrder[]) {
  if (!canUseStorage()) {
    return
  }

  try {
    window.localStorage.setItem(demoOrdersStorageKey, JSON.stringify(orders))
  } catch {
    // Storage can be unavailable in embedded/private contexts.
  }
}

function getDemoOrders() {
  const storedOrders = readStoredDemoOrders()
  const storedIds = new Set(storedOrders.map((order) => order.id))
  const baseOrders = getAdminOrders().filter((order) => !storedIds.has(order.id))

  return [...storedOrders, ...baseOrders].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

function getDemoOrder(orderId: string) {
  return getDemoOrders().find((order) => order.id === orderId || order.orderNo === orderId) || null
}

function updateStoredDemoOrder(orderId: string, updater: (order: AdminOrder) => AdminOrder) {
  const storedOrders = readStoredDemoOrders()
  const orderIndex = storedOrders.findIndex((order) => order.id === orderId)

  if (orderIndex < 0) {
    return null
  }

  const nextOrders = [...storedOrders]
  nextOrders[orderIndex] = updater(nextOrders[orderIndex])
  writeStoredDemoOrders(nextOrders)
  return nextOrders[orderIndex]
}

async function hasRealSupabaseSession() {
  if (!shouldUseSupabaseData) {
    return false
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return Boolean(data.session?.user)
}

function normalizeFiscal(rawFiscal: JsonRecord | null): AdminOrder['fiscal'] {
  const fiscal = rawFiscal || {}

  return {
    vatNumber: String(fiscal.vatNumber || ''),
    fiscalCode: String(fiscal.fiscalCode || ''),
    sdi: String(fiscal.sdi || ''),
    pec: String(fiscal.pec || ''),
  }
}

function mapOrderLineRow(row: OrderLineRow): AdminOrderLine {
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

function mapOrderRow(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    orderNo: row.order_no,
    customerName: row.customer_name,
    customerTier: row.customer_tier,
    status: row.status,
    paymentStatus: row.payment_status,
    stockRisk: row.stock_risk,
    totalNet: Number(row.total_net),
    vat: Number(row.vat),
    shipping: Number(row.shipping),
    createdAt: row.created_at,
    shippingMethod: row.shipping_method,
    fiscal: normalizeFiscal(row.fiscal),
    deliveryAddress: row.delivery_address,
    customerNote: row.customer_note,
    staffNote: row.staff_note,
    lines: (row.order_lines || []).map((line) => mapOrderLineRow(line)),
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function mapStockStatusForOrderLine(stockStatus: StockStatus): AdminOrderLine['stockStatus'] {
  if (stockStatus === 'low_stock') {
    return 'low_stock'
  }

  if (stockStatus === 'incoming') {
    return 'incoming'
  }

  return 'available'
}

function resolveStockRisk(products: Product[]): StockRisk {
  if (products.some((product) => product.stockStatus === 'out_of_stock')) {
    return 'blocked'
  }

  if (products.some((product) => product.stockStatus === 'incoming')) {
    return 'split'
  }

  if (products.some((product) => product.stockStatus === 'low_stock')) {
    return 'low'
  }

  return 'clear'
}

function createDemoOrderNo() {
  const now = new Date()
  const datePart = new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .replace(/-/g, '')
  const suffix = String(now.getTime()).slice(-6)

  return `SO-${datePart}-${suffix}`
}

async function createDemoOrder(payload: CheckoutPayload): Promise<CreatedOrder> {
  const customerProfile = await fetchCurrentCustomerProfile()
  const profileValidation = validateCustomerProfile(customerProfile)

  if (!profileValidation.isComplete) {
    throw new Error('Completa i dati aziendali prima del checkout.')
  }

  const lines = buildCartLines(payload.items)
  const hasInvalidLine = lines.some((line) => line.isBelowMoq || line.isOutOfStock)

  if (hasInvalidLine) {
    throw new Error('Carrello non valido: controlla MOQ e disponibilita stock.')
  }

  const summary = calculateCartSummary(lines)
  const orderNo = createDemoOrderNo()
  const createdOrder: AdminOrder = {
    id: `demo-${orderNo}`,
    orderNo,
    customerName: customerProfile.companyName,
    customerTier: 'standard',
    status: 'submitted',
    paymentStatus: payload.paymentMethod === 'bank_transfer' ? 'bank_waiting' : 'pending',
    stockRisk: resolveStockRisk(lines.map((line) => line.product)),
    totalNet: summary.subtotal,
    vat: summary.vat,
    shipping: summary.shipping,
    createdAt: new Date().toISOString(),
    shippingMethod: payload.shippingMethod,
    fiscal: {
      vatNumber: customerProfile.vatNumber,
      fiscalCode: customerProfile.fiscalCode,
      sdi: customerProfile.sdi,
      pec: customerProfile.pec,
    },
    deliveryAddress: customerProfile.shippingAddress,
    customerNote: payload.customerNote,
    staffNote: 'Demo order created from local checkout.',
    lines: lines.map((line) => ({
      skuCode: line.product.skuCode,
      productName: line.product.name,
      qualityGrade: line.product.qualityGrade,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      stockStatus: mapStockStatusForOrderLine(line.product.stockStatus),
      batchCode: 'DEMO-PENDING',
      location: '待分配',
    })),
  }

  writeStoredDemoOrders([createdOrder, ...readStoredDemoOrders()])

  return {
    orderId: createdOrder.id,
    orderNo: createdOrder.orderNo,
    status: 'submitted',
    summary,
  }
}

function mapCreatedOrder(data: unknown): CreatedOrder {
  const payload = data as {
    orderId?: string
    orderNo?: string
    status?: CreatedOrder['status']
    summary?: CartSummary
  }

  if (!payload.orderId || !payload.orderNo || !payload.summary) {
    throw new Error('Risposta ordine non valida.')
  }

  return {
    orderId: payload.orderId,
    orderNo: payload.orderNo,
    status: payload.status || 'submitted',
    summary: payload.summary,
  }
}

export async function createOrderFromCheckout(payload: CheckoutPayload): Promise<CreatedOrder> {
  if (await hasRealSupabaseSession()) {
    const { data, error } = await supabase.rpc('create_order_from_cart', {
      payload: {
        items: payload.items,
        shippingMethod: payload.shippingMethod,
        paymentMethod: payload.paymentMethod,
        customerNote: payload.customerNote,
      },
    })

    if (error) {
      throw error
    }

    return mapCreatedOrder(data)
  }

  return createDemoOrder(payload)
}

export async function fetchCustomerOrders() {
  if (await hasRealSupabaseSession()) {
    const { data, error } = await supabase
      .from('orders')
      .select(orderSelect)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data as unknown as OrderRow[]).map((row) => mapOrderRow(row))
  }

  return getDemoOrders()
}

export async function fetchCustomerOrderById(orderId: string) {
  if (await hasRealSupabaseSession()) {
    let query = supabase
      .from('orders')
      .select(orderSelect)

    query = isUuid(orderId) ? query.eq('id', orderId) : query.eq('order_no', orderId)

    const { data, error } = await query.maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapOrderRow(data as unknown as OrderRow) : null
  }

  return getDemoOrder(orderId)
}

export async function fetchAdminOrders() {
  if (await hasRealSupabaseSession()) {
    const { data, error } = await supabase
      .from('orders')
      .select(orderSelect)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data as unknown as OrderRow[]).map((row) => mapOrderRow(row))
  }

  return getDemoOrders()
}

export async function fetchAdminOrderById(orderId: string) {
  if (await hasRealSupabaseSession()) {
    let query = supabase
      .from('orders')
      .select(orderSelect)

    query = isUuid(orderId) ? query.eq('id', orderId) : query.eq('order_no', orderId)

    const { data, error } = await query.maybeSingle()

    if (error) {
      throw error
    }

    return data ? mapOrderRow(data as unknown as OrderRow) : null
  }

  return getDemoOrder(orderId) || getAdminOrderById(orderId)
}

export async function updateOrderStatus(orderId: string, status: AdminOrderStatus) {
  if (await hasRealSupabaseSession()) {
    const { error } = await supabase.rpc('advance_order_status', {
      target_order_id: orderId,
      next_status: status,
    })

    if (error) {
      throw error
    }

    return fetchAdminOrderById(orderId)
  }

  const storedOrder = updateStoredDemoOrder(orderId, (order) => ({ ...order, status }))

  if (storedOrder) {
    return storedOrder
  }

  return updateDemoOrderStatus(orderId, status)
}

export async function staffShipOrder(orderId: string) {
  if (await hasRealSupabaseSession()) {
    const { error } = await supabase.rpc('staff_ship_order', {
      target_order_id: orderId,
    })

    if (error) {
      throw error
    }

    return fetchAdminOrderById(orderId)
  }

  const storedOrder = updateStoredDemoOrder(orderId, (order) => ({
    ...order,
    status: 'shipped',
    staffNote: `${order.staffNote} staff_ship_order demo completed.`,
  }))

  if (storedOrder) {
    return storedOrder
  }

  return staffShipDemoOrder(orderId)
}

export async function recordOrderQuantityCheck(
  order: AdminOrder,
  quantities: Record<string, number | null>,
) {
  if (await hasRealSupabaseSession()) {
    const { error } = await supabase.rpc('record_order_quantity_check', {
      target_order_id: order.id,
      check_payload: {
        orderNo: order.orderNo,
        quantities,
      },
    })

    if (error) {
      throw error
    }
  }
}
