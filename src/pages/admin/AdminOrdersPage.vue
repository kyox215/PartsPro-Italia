<script setup lang="ts">
import { computed, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import {
  getAdminOrders,
  getNextOrderStatus,
  orderStatusFlow,
  staffShipOrder,
  updateOrderStatus,
} from '@/services/admin.service'
import type { AdminOrder, AdminOrderStatus, PaymentStatus, StockRisk } from '@/types/admin'
import {
  labelCustomerTier,
  labelOrderStatus,
  labelPaymentStatus,
  labelStockRisk,
  labelStockStatus,
  orderStatusLabels,
} from '@/utils/adminLabels'

const orders = ref(getAdminOrders())
const selectedStatus = ref<'all' | AdminOrderStatus>('all')
const selectedOrder = ref<AdminOrder | null>(null)
const isDrawerOpen = ref(false)
const isStatusFilterOpen = ref(false)

const columns = [
  { title: '订单', dataIndex: 'orderNo', key: 'order', width: 190 },
  { title: '客户', dataIndex: 'customerName', key: 'customer', width: 220 },
  { title: '订单状态', dataIndex: 'status', key: 'status', width: 160 },
  { title: '付款状态', dataIndex: 'paymentStatus', key: 'paymentStatus', width: 150 },
  { title: '库存风险', dataIndex: 'stockRisk', key: 'stockRisk', width: 130 },
  { title: '总额', dataIndex: 'totalNet', key: 'totalNet', width: 130 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 210 },
]

const statusOptions = computed(() => [
  { label: `全部 (${orders.value.length})`, value: 'all' },
  ...orderStatusFlow.map((status) => ({
    label: `${orderStatusLabels[status]} (${orders.value.filter((order) => order.status === status).length})`,
    value: status,
  })),
])

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') {
    return orders.value
  }

  return orders.value.filter((order) => order.status === selectedStatus.value)
})

const selectedStatusLabel = computed(
  () =>
    statusOptions.value.find((option) => option.value === selectedStatus.value)?.label ||
    '全部',
)

const dashboard = computed(() => ({
  submitted: orders.value.filter((order) => order.status === 'submitted').length,
  packing: orders.value.filter((order) => ['picking', 'packed'].includes(order.status)).length,
  risk: orders.value.filter((order) => order.stockRisk !== 'clear').length,
}))

function refreshOrders() {
  orders.value = getAdminOrders()
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

function selectStatus(value: string) {
  selectedStatus.value = value === 'all' ? 'all' : (value as AdminOrderStatus)
  isStatusFilterOpen.value = false
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
      refreshOrders()
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
      refreshOrders()
      message.success('已调用 staff_ship_order，订单已发货。')
    },
  })
}
</script>

<template>
  <main class="admin-page">
    <a-page-header
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
        <a-segmented
          v-model:value="selectedStatus"
          class="admin-desktop-scroll-control"
          :options="statusOptions"
        />
        <a-button class="admin-mobile-popup-trigger" @click="isStatusFilterOpen = true">
          <span>{{ selectedStatusLabel }}</span>
          <strong>{{ filteredOrders.length }}</strong>
        </a-button>
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
        row-key="id"
        :scroll="{ x: 1240 }"
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
            <a-tag :color="statusColor(record.status)">{{ labelOrderStatus(record.status) }}</a-tag>
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

          <div class="admin-mobile-order-tags">
            <a-tag :color="statusColor(order.status)">{{ labelOrderStatus(order.status) }}</a-tag>
            <a-tag :color="paymentColor(order.paymentStatus)">{{ labelPaymentStatus(order.paymentStatus) }}</a-tag>
            <a-tag :color="stockRiskColor(order.stockRisk)">{{ labelStockRisk(order.stockRisk) }}</a-tag>
          </div>

          <div class="admin-mobile-order-actions">
            <a-button size="small" @click="openOrder(order)">详情</a-button>
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

    <a-modal
      v-model:open="isStatusFilterOpen"
      class="admin-mobile-filter-modal"
      title="筛选订单状态"
      :footer="null"
      centered
    >
      <div class="admin-mobile-filter-list">
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          :class="{ 'admin-mobile-filter-active': selectedStatus === option.value }"
          @click="selectStatus(option.value)"
        >
          <span>{{ option.label }}</span>
          <strong v-if="selectedStatus === option.value">当前</strong>
        </button>
      </div>
    </a-modal>

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
        </div>

        <a-space class="admin-drawer-actions admin-order-actions">
          <a-button @click="isDrawerOpen = false">关闭</a-button>
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
