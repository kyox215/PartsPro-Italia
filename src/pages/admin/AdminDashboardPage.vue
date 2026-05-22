<script setup lang="ts">
import { computed } from 'vue'
import {
  getB2BApprovals,
  getAdminDashboardStats,
  getAdminOrders,
  getInventoryItems,
  getStockMovements,
  orderStatusFlow,
} from '@/services/admin.service'
import type { AdminOrderStatus, PaymentStatus, StockRisk } from '@/types/admin'
import {
  labelApprovalStatus,
  labelMovementType,
  labelOrderStatus,
  labelPaymentStatus,
  labelStockRisk,
} from '@/utils/adminLabels'

const stats = getAdminDashboardStats()
const orders = getAdminOrders()
const inventory = getInventoryItems()
const approvals = getB2BApprovals()
const movements = getStockMovements()

const priorityOrders = computed(() =>
  orders.filter((order) => order.status === 'submitted' || order.stockRisk !== 'clear').slice(0, 4),
)

const stockAlerts = computed(() =>
  inventory.filter((item) => item.availableQty <= 10 || item.qcQty > 0 || item.defectiveQty > 0),
)

const paymentQueue = computed(() =>
  orders.filter((order) => order.paymentStatus !== 'paid').slice(0, 4),
)

const approvalQueue = computed(() =>
  approvals.filter((approval) => approval.status === 'submitted').slice(0, 4),
)

const shipmentQueue = computed(() =>
  orders.filter((order) => ['picking', 'packed'].includes(order.status)).slice(0, 4),
)

const recentMovements = computed(() => movements.slice(0, 5))

const orderLanes = computed(() =>
  orderStatusFlow.map((status) => {
    const laneOrders = orders.filter((order) => order.status === status)

    return {
      status,
      label: labelOrderStatus(status),
      count: laneOrders.length,
      total: laneOrders.reduce((sum, order) => sum + orderGrossTotal(order), 0),
      orders: laneOrders.slice(0, 3),
    }
  }),
)

const kpis = computed(() => [
  {
    label: '待处理订单',
    value: stats.openOrders,
    tone: 'blue',
    note: `${orders.filter((order) => order.status === 'submitted').length} 个新提交`,
  },
  {
    label: '待核对付款',
    value: stats.pendingPayments,
    tone: 'orange',
    note: `${paymentQueue.value.length} 个需跟进`,
  },
  {
    label: '库存预警',
    value: stats.lowStock,
    tone: 'red',
    note: `${stockAlerts.value.length} 个 SKU`,
  },
  {
    label: 'B2B 待审核',
    value: approvalQueue.value.length,
    tone: 'purple',
    note: '开户与价格组',
  },
])

function orderGrossTotal(order: { totalNet: number; vat: number; shipping: number }) {
  return order.totalNet + order.vat + order.shipping
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function orderStatusTone(status: AdminOrderStatus) {
  const tones: Record<AdminOrderStatus, string> = {
    submitted: 'blue',
    accepted: 'cyan',
    picking: 'gold',
    packed: 'purple',
    shipped: 'green',
    completed: 'default',
  }

  return tones[status]
}

function paymentTone(status: PaymentStatus) {
  const tones: Record<PaymentStatus, string> = {
    pending: 'orange',
    paid: 'green',
    bank_waiting: 'gold',
    failed: 'red',
  }

  return tones[status]
}

function stockRiskTone(risk: StockRisk) {
  const tones: Record<StockRisk, string> = {
    clear: 'green',
    low: 'orange',
    split: 'purple',
    blocked: 'red',
  }

  return tones[risk]
}
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="运营仪表盘"
      sub-title="订单状态、付款、库存、B2B 审核和仓库动作的高密度看板"
    >
      <template #extra>
        <RouterLink to="/admin/orders">
          <a-button size="small">订单处理</a-button>
        </RouterLink>
      </template>
    </a-page-header>

    <section class="admin-dashboard-kpis">
      <article
        v-for="item in kpis"
        :key="item.label"
        class="admin-dashboard-kpi"
        :class="`admin-dashboard-kpi-${item.tone}`"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.note }}</small>
      </article>
    </section>

    <section class="admin-kanban-board">
      <header class="admin-section-heading">
        <div>
          <h2>订单状态看板</h2>
          <p>按状态推进，优先处理新提交、拆单、低库存和待发货订单。</p>
        </div>
        <a-tag color="blue">{{ orders.length }} 个订单</a-tag>
      </header>

      <div class="admin-kanban-lanes">
        <article v-for="lane in orderLanes" :key="lane.status" class="admin-kanban-lane">
          <header>
            <span>{{ lane.label }}</span>
            <strong>{{ lane.count }}</strong>
          </header>
          <small>{{ formatCurrency(lane.total) }}</small>

          <div class="admin-kanban-cards">
            <RouterLink
              v-for="order in lane.orders"
              :key="order.id"
              class="admin-kanban-card"
              :to="`/admin/orders/${order.id}`"
            >
              <span>{{ order.orderNo }}</span>
              <strong>{{ order.customerName }}</strong>
              <div>
                <a-tag :color="paymentTone(order.paymentStatus)">
                  {{ labelPaymentStatus(order.paymentStatus) }}
                </a-tag>
                <a-tag :color="stockRiskTone(order.stockRisk)">
                  {{ labelStockRisk(order.stockRisk) }}
                </a-tag>
              </div>
            </RouterLink>

            <div v-if="lane.orders.length === 0" class="admin-kanban-empty">暂无订单</div>
          </div>
        </article>
      </div>
    </section>

    <div class="admin-dashboard-panels">
      <a-card class="admin-dashboard-panel" title="今日优先处理">
        <div class="admin-ops-list">
          <RouterLink
            v-for="order in priorityOrders"
            :key="order.id"
            :to="`/admin/orders/${order.id}`"
            class="admin-ops-row"
          >
            <span>
              <strong>{{ order.orderNo }}</strong>
              <small>{{ order.customerName }}</small>
            </span>
            <span>
              <a-tag :color="orderStatusTone(order.status)">{{ labelOrderStatus(order.status) }}</a-tag>
              <a-tag :color="stockRiskTone(order.stockRisk)">{{ labelStockRisk(order.stockRisk) }}</a-tag>
            </span>
          </RouterLink>
        </div>
      </a-card>

      <a-card class="admin-dashboard-panel" title="付款与发货队列">
        <div class="admin-queue-grid">
          <section>
            <h3>待核对付款</h3>
            <RouterLink
              v-for="order in paymentQueue"
              :key="order.id"
              :to="`/admin/orders/${order.id}`"
              class="admin-mini-row"
            >
              <span>{{ order.orderNo }}</span>
              <a-tag :color="paymentTone(order.paymentStatus)">
                {{ labelPaymentStatus(order.paymentStatus) }}
              </a-tag>
            </RouterLink>
          </section>
          <section>
            <h3>仓库待推进</h3>
            <RouterLink
              v-for="order in shipmentQueue"
              :key="order.id"
              :to="`/admin/orders/${order.id}`"
              class="admin-mini-row"
            >
              <span>{{ order.orderNo }}</span>
              <a-tag :color="orderStatusTone(order.status)">
                {{ labelOrderStatus(order.status) }}
              </a-tag>
            </RouterLink>
          </section>
        </div>
      </a-card>

      <a-card class="admin-dashboard-panel" title="库存预警">
        <div class="admin-ops-list">
          <RouterLink
            v-for="item in stockAlerts"
            :key="item.id"
            to="/admin/inventory"
            class="admin-ops-row"
          >
            <span>
              <strong>{{ item.skuCode }}</strong>
              <small>{{ item.productName }}</small>
            </span>
            <span>
              <a-tag :color="item.availableQty <= 10 ? 'orange' : 'green'">可用 {{ item.availableQty }}</a-tag>
              <a-tag v-if="item.qcQty > 0" color="gold">QC {{ item.qcQty }}</a-tag>
              <a-tag v-if="item.defectiveQty > 0" color="red">瑕疵 {{ item.defectiveQty }}</a-tag>
            </span>
          </RouterLink>
        </div>
      </a-card>

      <a-card class="admin-dashboard-panel" title="B2B 审核">
        <div class="admin-ops-list">
          <RouterLink
            v-for="approval in approvalQueue"
            :key="approval.id"
            to="/admin/b2b-approvals"
            class="admin-ops-row"
          >
            <span>
              <strong>{{ approval.companyName }}</strong>
              <small>{{ approval.monthlyPurchase }} / {{ approval.requestedPriceGroupId }}</small>
            </span>
            <span>
              <a-tag color="orange">{{ labelApprovalStatus(approval.status) }}</a-tag>
            </span>
          </RouterLink>
          <a-empty v-if="approvalQueue.length === 0" description="暂无待审核申请" />
        </div>
      </a-card>

      <a-card class="admin-dashboard-panel admin-dashboard-panel-wide" title="最近库存流水">
        <div class="admin-movement-feed">
          <RouterLink
            v-for="movement in recentMovements"
            :key="movement.id"
            to="/admin/stock-movements"
            class="admin-movement-row"
          >
            <span>{{ formatDate(movement.createdAt) }}</span>
            <strong>{{ movement.skuCode }}</strong>
            <a-tag>{{ labelMovementType(movement.type) }}</a-tag>
            <small>{{ movement.reference }} / {{ movement.location }}</small>
            <b>{{ movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity }}</b>
          </RouterLink>
        </div>
      </a-card>
    </div>
  </main>
</template>
