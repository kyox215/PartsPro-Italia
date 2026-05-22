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

const orders = ref(getAdminOrders())
const selectedStatus = ref<'all' | AdminOrderStatus>('all')
const selectedOrder = ref<AdminOrder | null>(null)
const isDrawerOpen = ref(false)

const columns = [
  { title: 'Ordine', dataIndex: 'orderNo', key: 'order', width: 190 },
  { title: 'Cliente', dataIndex: 'customerName', key: 'customer', width: 220 },
  { title: 'Stato', dataIndex: 'status', key: 'status', width: 160 },
  { title: 'Pagamento', dataIndex: 'paymentStatus', key: 'paymentStatus', width: 150 },
  { title: 'Stock', dataIndex: 'stockRisk', key: 'stockRisk', width: 130 },
  { title: 'Totale', dataIndex: 'totalNet', key: 'totalNet', width: 130 },
  { title: 'Creato', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
  { title: 'Azioni', key: 'actions', fixed: 'right' as const, width: 210 },
]

const statusOptions = computed(() => [
  { label: `Tutti (${orders.value.length})`, value: 'all' },
  ...orderStatusFlow.map((status) => ({
    label: `${status} (${orders.value.filter((order) => order.status === status).length})`,
    value: status,
  })),
])

const filteredOrders = computed(() => {
  if (selectedStatus.value === 'all') {
    return orders.value
  }

  return orders.value.filter((order) => order.status === selectedStatus.value)
})

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
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
    return 'Completato'
  }

  return nextStatus === 'shipped' ? 'Spedisci' : `Avanza a ${nextStatus}`
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
    title: `Portare ${order.orderNo} a ${nextStatus}?`,
    content: 'Aggiorna lo stato operativo senza modificare direttamente le quantita stock.',
    okText: 'Conferma',
    cancelText: 'Annulla',
    async onOk() {
      await updateOrderStatus(order.id, nextStatus)
      refreshOrders()
      message.success('Stato ordine aggiornato.')
    },
  })
}

function confirmShip(order: AdminOrder) {
  Modal.confirm({
    title: `Spedire ${order.orderNo}?`,
    content:
      'Questa azione chiama il service/RPC placeholder staff_ship_order. Il futuro backend dovra validare e scaricare lo stock in transazione.',
    okText: 'Chiama staff_ship_order',
    cancelText: 'Annulla',
    async onOk() {
      await staffShipOrder(order.id)
      refreshOrders()
      message.success('staff_ship_order chiamato, ordine spedito.')
    },
  })
}
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="订单处理"
      sub-title="按 submitted、accepted、picking、packed、shipped、completed 推进订单"
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
        <a-segmented v-model:value="selectedStatus" :options="statusOptions" />
        <a-alert
          type="info"
          show-icon
          message="发货调用 staff_ship_order"
          description="UI 不直接修改库存；发货必须通过 Supabase RPC / service 处理。"
        />
      </div>

      <a-table
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
            <span class="admin-muted-line">Tier {{ record.customerTier }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>

          <template v-else-if="column.key === 'paymentStatus'">
            <a-tag :color="paymentColor(record.paymentStatus)">{{ record.paymentStatus }}</a-tag>
          </template>

          <template v-else-if="column.key === 'stockRisk'">
            <a-tag :color="stockRiskColor(record.stockRisk)">{{ record.stockRisk }}</a-tag>
          </template>

          <template v-else-if="column.key === 'totalNet'">
            <strong>{{ formatCurrency(record.totalNet + record.vat + record.shipping) }}</strong>
            <span class="admin-muted-line">Net {{ formatCurrency(record.totalNet) }}</span>
          </template>

          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openOrder(record)">Drawer</a-button>
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
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
      width="720"
      :title="selectedOrder?.orderNo || '订单详情'"
    >
      <template v-if="selectedOrder">
        <a-steps
          size="small"
          :current="orderStatusFlow.indexOf(selectedOrder.status)"
          class="admin-order-steps"
        >
          <a-step v-for="status in orderStatusFlow" :key="status" :title="status" />
        </a-steps>

        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item label="Cliente">
            {{ selectedOrder.customerName }} / {{ selectedOrder.customerTier }}
          </a-descriptions-item>
          <a-descriptions-item label="Fattura">
            P.IVA {{ selectedOrder.fiscal.vatNumber }} - SDI {{ selectedOrder.fiscal.sdi }} - PEC
            {{ selectedOrder.fiscal.pec }}
          </a-descriptions-item>
          <a-descriptions-item label="Consegna">
            {{ selectedOrder.shippingMethod }} - {{ selectedOrder.deliveryAddress }}
          </a-descriptions-item>
          <a-descriptions-item label="Note cliente">
            {{ selectedOrder.customerNote }}
          </a-descriptions-item>
          <a-descriptions-item label="Note staff">
            {{ selectedOrder.staffNote }}
          </a-descriptions-item>
        </a-descriptions>

        <a-list class="admin-line-list" :data-source="selectedOrder.lines" bordered>
          <template #header>Righe ordine e stock</template>
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.productName" :description="item.skuCode">
                <template #avatar>
                  <a-tag color="blue">{{ item.quantity }}x</a-tag>
                </template>
              </a-list-item-meta>
              <a-space wrap>
                <a-tag>{{ item.qualityGrade }}</a-tag>
                <a-tag :color="item.stockStatus === 'available' ? 'green' : 'orange'">
                  {{ item.stockStatus }}
                </a-tag>
                <a-tag>{{ item.batchCode }}</a-tag>
                <a-tag>{{ item.location }}</a-tag>
              </a-space>
            </a-list-item>
          </template>
        </a-list>

        <a-space class="admin-drawer-actions">
          <a-button @click="isDrawerOpen = false">Chiudi</a-button>
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
