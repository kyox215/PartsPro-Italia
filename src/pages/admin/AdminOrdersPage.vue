<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import {
  getNextOrderStatus,
  orderStatusFlow,
  fetchAdminOrders,
  recordOrderQuantityCheck,
  staffShipOrder,
  updateOrderStatus,
} from '@/services/order.service'
import type { AdminOrder, AdminOrderStatus, PaymentStatus, StockRisk } from '@/types/admin'
import {
  labelCustomerTier,
  labelOrderStatus,
  labelPaymentStatus,
  labelStockRisk,
  labelStockStatus,
  orderStatusLabels,
} from '@/utils/adminLabels'

const route = useRoute()
const orders = ref<AdminOrder[]>([])
const isLoading = ref(false)
const selectedStatus = ref<'all' | AdminOrderStatus>('all')
const query = ref('')
const selectedOrder = ref<AdminOrder | null>(null)
const isDrawerOpen = ref(false)
const quantityChecks = ref<Record<string, Record<string, number | null>>>({})
const quantityVerifiedOrders = ref<Record<string, boolean>>({})

const columns = [
  { title: '订单', dataIndex: 'orderNo', key: 'order', width: 190 },
  { title: '客户', dataIndex: 'customerName', key: 'customer', width: 220 },
  { title: '订单进度', dataIndex: 'status', key: 'status', width: 230 },
  { title: '付款状态', dataIndex: 'paymentStatus', key: 'paymentStatus', width: 150 },
  { title: '库存风险', dataIndex: 'stockRisk', key: 'stockRisk', width: 130 },
  { title: '总额', dataIndex: 'totalNet', key: 'totalNet', width: 130 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 260 },
]

const statusOptions = computed(() => [
  { label: `全部 (${orders.value.length})`, value: 'all' },
  ...orderStatusFlow.map((status) => ({
    label: `${orderStatusLabels[status]} (${orders.value.filter((order) => order.status === status).length})`,
    value: status,
  })),
])

const filteredOrders = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()
  const statusFilteredOrders =
    selectedStatus.value === 'all'
      ? orders.value
      : orders.value.filter((order) => order.status === selectedStatus.value)

  if (!normalizedQuery) {
    return statusFilteredOrders
  }

  return statusFilteredOrders.filter((order) =>
    [
      order.orderNo,
      order.customerName,
      order.customerTier,
      order.paymentStatus,
      order.stockRisk,
      order.shippingMethod,
      order.deliveryAddress,
      ...order.lines.flatMap((line) => [
        line.skuCode,
        line.productName,
        line.qualityGrade,
        line.batchCode,
        line.location,
      ]),
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  )
})

const dashboard = computed(() => ({
  submitted: orders.value.filter((order) => order.status === 'submitted').length,
  packing: orders.value.filter((order) => ['picking', 'packed'].includes(order.status)).length,
  risk: orders.value.filter((order) => order.stockRisk !== 'clear').length,
}))

async function refreshOrders() {
  isLoading.value = true

  try {
    orders.value = await fetchAdminOrders()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '订单加载失败。')
  } finally {
    isLoading.value = false
  }

  if (selectedOrder.value) {
    selectedOrder.value =
      orders.value.find((order) => order.id === selectedOrder.value?.id) || selectedOrder.value
  }
}

function openOrder(order: AdminOrder) {
  selectedOrder.value = order
  isDrawerOpen.value = true
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function orderGrossTotal(order: AdminOrder) {
  return order.totalNet + order.vat + order.shipping
}

function escapePrintText(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }

    return entities[char]
  })
}

function printOrder(order: AdminOrder) {
  const printWindow = window.open('', '_blank', 'width=980,height=720')

  if (!printWindow) {
    message.warning('浏览器阻止了打印窗口，请允许弹窗后重试。')
    return
  }

  const lineRows = order.lines
    .map(
      (line, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <strong>${escapePrintText(line.productName)}</strong>
            <small>${escapePrintText(line.skuCode)} / ${escapePrintText(line.qualityGrade)}</small>
          </td>
          <td>${escapePrintText(line.batchCode)}</td>
          <td>${escapePrintText(line.location)}</td>
          <td class="qty">${line.quantity}</td>
          <td class="check"></td>
          <td class="check"></td>
        </tr>`,
    )
    .join('')

  const printedAt = new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapePrintText(order.orderNo)} 拣货/装箱单</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111827;
            font-family: Arial, "Microsoft YaHei", sans-serif;
            font-size: 12px;
          }
          header {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            align-items: start;
            padding-bottom: 10px;
            border-bottom: 2px solid #111827;
          }
          h1 { margin: 0 0 4px; font-size: 22px; line-height: 1.2; }
          h2 { margin: 0 0 8px; font-size: 14px; }
          p { margin: 2px 0; }
          .meta {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin: 12px 0;
          }
          .box {
            min-height: 72px;
            padding: 8px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
          }
          .box strong { display: block; margin-bottom: 4px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 7px 6px; border: 1px solid #d1d5db; vertical-align: top; }
          th { background: #f3f4f6; text-align: left; font-size: 11px; }
          td small { display: block; margin-top: 3px; color: #4b5563; }
          .qty { width: 52px; text-align: center; font-size: 16px; font-weight: 800; }
          .check { width: 70px; height: 34px; }
          .sign {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 18px;
          }
          .sign div { height: 52px; border-bottom: 1px solid #111827; }
          .muted { color: #6b7280; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <header>
          <div>
            <h1>PartsPro 拣货 / 装箱单</h1>
            <p><strong>${escapePrintText(order.orderNo)}</strong> · ${escapePrintText(labelOrderStatus(order.status))}</p>
            <p class="muted">打印时间：${escapePrintText(printedAt)}</p>
          </div>
          <div class="right">
            <p>SKU：${order.lines.length}</p>
            <p>件数：${order.lines.reduce((sum, line) => sum + line.quantity, 0)}</p>
            <p>总额：${escapePrintText(formatCurrency(orderGrossTotal(order)))}</p>
          </div>
        </header>

        <section class="meta">
          <div class="box">
            <strong>客户</strong>
            <p>${escapePrintText(order.customerName)} / ${escapePrintText(labelCustomerTier(order.customerTier))}</p>
            <p>${escapePrintText(order.deliveryAddress)}</p>
          </div>
          <div class="box">
            <strong>发票</strong>
            <p>P.IVA ${escapePrintText(order.fiscal.vatNumber)}</p>
            <p>SDI ${escapePrintText(order.fiscal.sdi)} / PEC ${escapePrintText(order.fiscal.pec)}</p>
          </div>
          <div class="box">
            <strong>配送</strong>
            <p>${escapePrintText(order.shippingMethod)}</p>
            <p>${escapePrintText(order.customerNote || '无客户备注')}</p>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>商品 / SKU</th>
              <th>批次</th>
              <th>库位</th>
              <th>应拣</th>
              <th>实拣</th>
              <th>复核</th>
            </tr>
          </thead>
          <tbody>${lineRows}</tbody>
        </table>

        <section class="sign">
          <div>拣货人：</div>
          <div>复核人：</div>
          <div>打包人：</div>
        </section>
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.focus()
  window.setTimeout(() => printWindow.print(), 250)
}

function selectStatus(value: string) {
  selectedStatus.value = value === 'all' ? 'all' : (value as AdminOrderStatus)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function statusColor(status: AdminOrderStatus) {
  const colors: Record<AdminOrderStatus, string> = {
    submitted: 'blue',
    accepted: 'cyan',
    picking: 'gold',
    packed: 'purple',
    shipped: 'green',
    completed: 'default',
  }

  return colors[status]
}

function paymentColor(status: PaymentStatus) {
  const colors: Record<PaymentStatus, string> = {
    pending: 'orange',
    paid: 'green',
    bank_waiting: 'gold',
    failed: 'red',
  }

  return colors[status]
}

function stockRiskColor(risk: StockRisk) {
  const colors: Record<StockRisk, string> = {
    clear: 'green',
    low: 'orange',
    split: 'purple',
    blocked: 'red',
  }

  return colors[risk]
}

function readRouteQuery(value: unknown) {
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
}

function orderStatusIndex(status: AdminOrderStatus) {
  return orderStatusFlow.indexOf(status)
}

function orderProgressPercent(status: AdminOrderStatus) {
  return Math.round(((orderStatusIndex(status) + 1) / orderStatusFlow.length) * 100)
}

function orderProgressStepLabel(status: AdminOrderStatus) {
  return `${orderStatusIndex(status) + 1}/${orderStatusFlow.length}`
}

function orderProgressClass(status: AdminOrderStatus) {
  return `admin-order-progress-${status}`
}

function isOrderStepDone(step: AdminOrderStatus, current: AdminOrderStatus) {
  return orderStatusIndex(step) <= orderStatusIndex(current)
}

function getQuantityCheckValues(order: AdminOrder) {
  return quantityChecks.value[order.id] || {}
}

function getCheckedQuantity(order: AdminOrder, skuCode: string) {
  return getQuantityCheckValues(order)[skuCode] ?? null
}

function updateCheckedQuantity(order: AdminOrder, skuCode: string, value: unknown) {
  const normalizedValue = typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : null

  quantityChecks.value = {
    ...quantityChecks.value,
    [order.id]: {
      ...getQuantityCheckValues(order),
      [skuCode]: normalizedValue,
    },
  }
  quantityVerifiedOrders.value = {
    ...quantityVerifiedOrders.value,
    [order.id]: false,
  }
}

function updateSelectedOrderCheckedQuantity(skuCode: string, value: unknown) {
  if (!selectedOrder.value) {
    return
  }

  updateCheckedQuantity(selectedOrder.value, skuCode, value)
}

function fillExpectedQuantities(order: AdminOrder) {
  quantityChecks.value = {
    ...quantityChecks.value,
    [order.id]: Object.fromEntries(order.lines.map((line) => [line.skuCode, line.quantity])),
  }
  quantityVerifiedOrders.value = {
    ...quantityVerifiedOrders.value,
    [order.id]: false,
  }
}

function clearQuantityCheck(order: AdminOrder) {
  quantityChecks.value = {
    ...quantityChecks.value,
    [order.id]: {},
  }
  quantityVerifiedOrders.value = {
    ...quantityVerifiedOrders.value,
    [order.id]: false,
  }
}

function quantityCheckSummary(order: AdminOrder) {
  const values = getQuantityCheckValues(order)
  const checked = order.lines.filter((line) => values[line.skuCode] !== null && values[line.skuCode] !== undefined).length
  const matched = order.lines.filter((line) => values[line.skuCode] === line.quantity).length
  const mismatched = checked - matched
  const complete = order.lines.length > 0 && checked === order.lines.length && mismatched === 0
  const verified = Boolean(quantityVerifiedOrders.value[order.id])

  if (verified) {
    return { label: '数量已确认', color: 'green', checked, matched, mismatched, complete }
  }

  if (checked === 0) {
    return { label: '未核对', color: 'default', checked, matched, mismatched, complete }
  }

  if (mismatched > 0) {
    return { label: `${mismatched} 项差异`, color: 'red', checked, matched, mismatched, complete }
  }

  if (complete) {
    return { label: '待确认', color: 'blue', checked, matched, mismatched, complete }
  }

  return { label: `${checked}/${order.lines.length} 已核`, color: 'gold', checked, matched, mismatched, complete }
}

function quantityLineStatus(order: AdminOrder, skuCode: string, expectedQuantity: number) {
  const value = getCheckedQuantity(order, skuCode)

  if (value === null) {
    return { label: '待核', color: 'default' }
  }

  if (value === expectedQuantity) {
    return { label: '匹配', color: 'green' }
  }

  return { label: `差异 ${value - expectedQuantity}`, color: 'red' }
}

async function confirmQuantityCheck(order: AdminOrder) {
  const summary = quantityCheckSummary(order)

  if (!summary.complete) {
    message.warning('请先完成所有 SKU 的数量核对，并修正差异项。')
    return
  }

  try {
    await recordOrderQuantityCheck(order, getQuantityCheckValues(order))
  } catch (error) {
    message.error(error instanceof Error ? error.message : '数量核对记录失败。')
    return
  }

  quantityVerifiedOrders.value = {
    ...quantityVerifiedOrders.value,
    [order.id]: true,
  }
  message.success(`${order.orderNo} 数量核对已确认。`)
}

function nextActionLabel(order: AdminOrder) {
  const nextStatus = getNextOrderStatus(order.status)

  if (!nextStatus) {
    return '已完成'
  }

  return nextStatus === 'shipped' ? '发货' : `推进到${orderStatusLabels[nextStatus]}`
}

function confirmAdvance(order: AdminOrder) {
  const nextStatus = getNextOrderStatus(order.status)

  if (!nextStatus) {
    return
  }

  if (nextStatus === 'shipped') {
    confirmShip(order)
    return
  }

  Modal.confirm({
    title: `推进订单 ${order.orderNo}？`,
    content: `订单状态将从“${orderStatusLabels[order.status]}”变更为“${orderStatusLabels[nextStatus]}”，不会直接修改库存数量。`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      await updateOrderStatus(order.id, nextStatus)
      await refreshOrders()
      message.success('订单状态已更新。')
    },
  })
}

function confirmShip(order: AdminOrder) {
  Modal.confirm({
    title: `确认发货 ${order.orderNo}？`,
    content:
      '此操作调用 staff_ship_order 服务/RPC。后端需要在事务中校验库存、扣减锁定库存并写入库存流水。',
    okText: '确认发货',
    cancelText: '取消',
    async onOk() {
      await staffShipOrder(order.id)
      await refreshOrders()
      message.success('已调用 staff_ship_order，订单已发货。')
    },
  })
}

onMounted(refreshOrders)

watch(
  () => route.query.q,
  (value) => {
    query.value = readRouteQuery(value)
  },
  { immediate: true },
)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      class="admin-orders-page-header"
      title="订单处理"
      sub-title="按已提交、已受理、拣货中、已打包、已发货、已完成推进订单"
    >
      <template #extra>
        <a-button @click="refreshOrders">刷新</a-button>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="新提交订单" :value="dashboard.submitted" />
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="拣货 / 已打包" :value="dashboard.packing" />
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="库存风险订单" :value="dashboard.risk" />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="搜索订单号、客户、SKU、批次..."
          allow-clear
        />
        <div class="admin-status-filter-row" role="tablist" aria-label="订单状态筛选">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            type="button"
            :class="{ 'admin-status-filter-active': selectedStatus === option.value }"
            @click="selectStatus(option.value)"
          >
            {{ option.label }}
          </button>
        </div>
        <a-alert
          type="info"
          show-icon
          message="发货必须走后端服务"
          description="界面不直接扣库存；发货由 Supabase RPC / service 校验锁定库存并写入库存流水。"
        />
      </div>

      <a-table
        class="admin-desktop-data-table"
        :columns="columns"
        :data-source="filteredOrders"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1420 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'order'">
            <RouterLink class="admin-strong-link" :to="`/admin/orders/${record.id}`">
              {{ record.orderNo }}
            </RouterLink>
            <span class="admin-muted-line">{{ formatDate(record.createdAt) }}</span>
          </template>

          <template v-else-if="column.key === 'customer'">
            <strong>{{ record.customerName }}</strong>
            <span class="admin-muted-line">等级 {{ labelCustomerTier(record.customerTier) }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <div
              class="admin-order-progress-cell"
              :class="orderProgressClass(record.status)"
              :style="{ '--order-progress': `${orderProgressPercent(record.status)}%` }"
            >
              <div class="admin-order-progress-head">
                <a-tag :color="statusColor(record.status)">{{ labelOrderStatus(record.status) }}</a-tag>
                <span>第 {{ orderProgressStepLabel(record.status) }} 步</span>
              </div>
              <div class="admin-order-progress-track" aria-hidden="true">
                <span />
              </div>
              <div class="admin-order-progress-dots" aria-hidden="true">
                <i
                  v-for="step in orderStatusFlow"
                  :key="step"
                  :class="{ 'admin-order-progress-dot-done': isOrderStepDone(step, record.status) }"
                />
              </div>
            </div>
          </template>

          <template v-else-if="column.key === 'paymentStatus'">
            <a-tag :color="paymentColor(record.paymentStatus)">{{ labelPaymentStatus(record.paymentStatus) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'stockRisk'">
            <a-tag :color="stockRiskColor(record.stockRisk)">{{ labelStockRisk(record.stockRisk) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'totalNet'">
            <strong>{{ formatCurrency(record.totalNet + record.vat + record.shipping) }}</strong>
            <span class="admin-muted-line">净额 {{ formatCurrency(record.totalNet) }}</span>
          </template>

          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openOrder(record)">详情</a-button>
              <a-button size="small" @click="printOrder(record)">打印</a-button>
              <a-button
                size="small"
                type="primary"
                :disabled="!getNextOrderStatus(record.status)"
                @click="confirmAdvance(record)"
              >
                {{ nextActionLabel(record) }}
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="admin-mobile-order-list">
        <a-empty v-if="filteredOrders.length === 0" class="admin-mobile-empty" description="暂无订单" />
        <article v-for="order in filteredOrders" :key="order.id" class="admin-mobile-order-card">
          <header>
            <RouterLink :to="`/admin/orders/${order.id}`">{{ order.orderNo }}</RouterLink>
            <strong>{{ formatCurrency(orderGrossTotal(order)) }}</strong>
          </header>

          <div class="admin-mobile-order-meta">
            <span>{{ order.customerName }}</span>
            <span>等级 {{ labelCustomerTier(order.customerTier) }}</span>
            <span>{{ formatDate(order.createdAt) }}</span>
          </div>

          <div
            class="admin-mobile-order-progress"
            :class="orderProgressClass(order.status)"
            :style="{ '--order-progress': `${orderProgressPercent(order.status)}%` }"
          >
            <div class="admin-order-progress-head">
              <a-tag :color="statusColor(order.status)">{{ labelOrderStatus(order.status) }}</a-tag>
              <span>进度 {{ orderProgressStepLabel(order.status) }}</span>
            </div>
            <div class="admin-order-progress-track" aria-hidden="true">
              <span />
            </div>
            <div class="admin-order-progress-dots" aria-hidden="true">
              <i
                v-for="step in orderStatusFlow"
                :key="step"
                :class="{ 'admin-order-progress-dot-done': isOrderStepDone(step, order.status) }"
              />
            </div>
          </div>

          <div class="admin-mobile-order-tags">
            <a-tag :color="paymentColor(order.paymentStatus)">{{ labelPaymentStatus(order.paymentStatus) }}</a-tag>
            <a-tag :color="stockRiskColor(order.stockRisk)">{{ labelStockRisk(order.stockRisk) }}</a-tag>
            <a-tag :color="quantityCheckSummary(order).color">
              核对 {{ quantityCheckSummary(order).label }}
            </a-tag>
          </div>

          <div class="admin-mobile-order-actions">
            <a-button size="small" @click="openOrder(order)">详情</a-button>
            <a-button size="small" @click="printOrder(order)">打印</a-button>
            <a-button
              size="small"
              type="primary"
              :disabled="!getNextOrderStatus(order.status)"
              @click="confirmAdvance(order)"
            >
              {{ nextActionLabel(order) }}
            </a-button>
          </div>
        </article>
      </div>
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
      class="admin-data-drawer admin-order-drawer"
      width="840"
      :title="selectedOrder?.orderNo || '订单详情'"
    >
      <template v-if="selectedOrder">
        <div class="admin-order-drawer-shell">
          <div class="admin-order-status-strip">
            <span
              v-for="(status, index) in orderStatusFlow"
              :key="status"
              class="admin-order-status-step"
              :class="{
                'admin-order-status-active': status === selectedOrder.status,
                'admin-order-status-done': index < orderStatusFlow.indexOf(selectedOrder.status),
              }"
            >
              <strong>{{ index + 1 }}</strong>
              <span>{{ orderStatusLabels[status] }}</span>
            </span>
          </div>

          <div class="admin-order-kpi-strip">
            <span>
              <small>总额</small>
              <strong>{{ formatCurrency(orderGrossTotal(selectedOrder)) }}</strong>
            </span>
            <span>
              <small>付款</small>
              <a-tag :color="paymentColor(selectedOrder.paymentStatus)">
                {{ labelPaymentStatus(selectedOrder.paymentStatus) }}
              </a-tag>
            </span>
            <span>
              <small>库存</small>
              <a-tag :color="stockRiskColor(selectedOrder.stockRisk)">
                {{ labelStockRisk(selectedOrder.stockRisk) }}
              </a-tag>
            </span>
            <span>
              <small>数量核对</small>
              <a-tag :color="quantityCheckSummary(selectedOrder).color">
                {{ quantityCheckSummary(selectedOrder).label }}
              </a-tag>
            </span>
          </div>

          <section class="admin-order-info-grid">
            <article>
              <span>客户</span>
              <strong>{{ selectedOrder.customerName }}</strong>
              <small>等级 {{ labelCustomerTier(selectedOrder.customerTier) }}</small>
            </article>
            <article>
              <span>发票</span>
              <strong>P.IVA {{ selectedOrder.fiscal.vatNumber }}</strong>
              <small>SDI {{ selectedOrder.fiscal.sdi }} / PEC {{ selectedOrder.fiscal.pec }}</small>
            </article>
            <article class="admin-order-info-wide">
              <span>配送</span>
              <strong>{{ selectedOrder.shippingMethod }}</strong>
              <small>{{ selectedOrder.deliveryAddress }}</small>
            </article>
            <article class="admin-order-info-wide">
              <span>客户备注</span>
              <p>{{ selectedOrder.customerNote }}</p>
            </article>
            <article class="admin-order-info-wide">
              <span>员工备注</span>
              <p>{{ selectedOrder.staffNote }}</p>
            </article>
          </section>

          <section class="admin-order-lines-panel">
            <header>
              <h3>订单商品与库存</h3>
              <span>{{ selectedOrder.lines.length }} SKU</span>
            </header>

            <div class="admin-order-line-list">
              <article
                v-for="item in selectedOrder.lines"
                :key="item.skuCode"
                class="admin-order-line-card"
              >
                <div class="admin-order-line-main">
                  <a-tag color="blue">{{ item.quantity }}x</a-tag>
                  <div>
                    <strong>{{ item.productName }}</strong>
                    <span>{{ item.skuCode }}</span>
                  </div>
                </div>

                <div class="admin-order-line-tags">
                  <a-tag>{{ item.qualityGrade }}</a-tag>
                  <a-tag :color="item.stockStatus === 'available' ? 'green' : 'orange'">
                    {{ labelStockStatus(item.stockStatus) }}
                  </a-tag>
                  <a-tag>{{ item.batchCode }}</a-tag>
                  <a-tag>{{ item.location }}</a-tag>
                </div>
              </article>
            </div>
          </section>

          <section class="admin-order-lines-panel admin-quantity-check-panel">
            <header>
              <div>
                <h3>数量核对</h3>
                <p>
                  已核 {{ quantityCheckSummary(selectedOrder).checked }}/{{ selectedOrder.lines.length }}，
                  匹配 {{ quantityCheckSummary(selectedOrder).matched }}，
                  差异 {{ quantityCheckSummary(selectedOrder).mismatched }}
                </p>
              </div>
              <a-space>
                <a-button size="small" @click="fillExpectedQuantities(selectedOrder)">填入应拣数</a-button>
                <a-button size="small" @click="clearQuantityCheck(selectedOrder)">清空</a-button>
              </a-space>
            </header>

            <div class="admin-quantity-check-list">
              <article
                v-for="item in selectedOrder.lines"
                :key="item.skuCode"
                class="admin-quantity-check-row"
              >
                <div class="admin-quantity-check-product">
                  <strong>{{ item.productName }}</strong>
                  <span>{{ item.skuCode }} · {{ item.batchCode }} · {{ item.location }}</span>
                </div>
                <div class="admin-quantity-check-expected">
                  <span>应拣</span>
                  <strong>{{ item.quantity }}</strong>
                </div>
                <a-input-number
                  :value="getCheckedQuantity(selectedOrder, item.skuCode)"
                  :min="0"
                  :precision="0"
                  size="small"
                  placeholder="实拣"
                  @change="updateSelectedOrderCheckedQuantity(item.skuCode, $event)"
                />
                <a-tag :color="quantityLineStatus(selectedOrder, item.skuCode, item.quantity).color">
                  {{ quantityLineStatus(selectedOrder, item.skuCode, item.quantity).label }}
                </a-tag>
              </article>
            </div>
          </section>
        </div>

        <a-space class="admin-drawer-actions admin-order-actions">
          <a-button @click="isDrawerOpen = false">关闭</a-button>
          <a-button @click="printOrder(selectedOrder)">打印拣货单</a-button>
          <a-button @click="confirmQuantityCheck(selectedOrder)">确认数量核对</a-button>
          <a-button
            type="primary"
            :disabled="!getNextOrderStatus(selectedOrder.status)"
            @click="confirmAdvance(selectedOrder)"
          >
            {{ nextActionLabel(selectedOrder) }}
          </a-button>
        </a-space>
      </template>
    </a-drawer>
  </main>
</template>
