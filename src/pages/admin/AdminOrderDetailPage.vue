<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  fetchAdminOrderById,
  getNextOrderStatus,
  orderStatusFlow,
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
const router = useRouter()
const order = ref<AdminOrder | null>(null)
const isLoading = ref(false)

const currentStep = computed(() => (order.value ? orderStatusFlow.indexOf(order.value.status) : 0))

const totalGross = computed(() => {
  if (!order.value) {
    return 0
  }

  return order.value.totalNet + order.value.vat + order.value.shipping
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
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

async function refreshOrder() {
  isLoading.value = true

  try {
    order.value = await fetchAdminOrderById(String(route.params.id))
  } catch (error) {
    message.error(error instanceof Error ? error.message : '订单加载失败。')
  } finally {
    isLoading.value = false
  }
}

function nextActionLabel() {
  if (!order.value) {
    return ''
  }

  const nextStatus = getNextOrderStatus(order.value.status)

  if (!nextStatus) {
    return '已完成'
  }

  return nextStatus === 'shipped' ? '发货订单' : `推进到${orderStatusLabels[nextStatus]}`
}

function confirmAdvance() {
  if (!order.value) {
    return
  }

  const nextStatus = getNextOrderStatus(order.value.status)

  if (!nextStatus) {
    return
  }

  if (nextStatus === 'shipped') {
    Modal.confirm({
      title: `确认发货 ${order.value.orderNo}？`,
      content:
        '此操作调用 staff_ship_order。真实后端需要在事务中扣减锁定库存并写入库存流水。',
      okText: '确认发货',
      cancelText: '取消',
      async onOk() {
        if (!order.value) {
          return
        }

        await staffShipOrder(order.value.id)
        await refreshOrder()
        message.success('订单已通过 staff_ship_order 发货。')
      },
    })
    return
  }

  Modal.confirm({
    title: `推进订单 ${order.value.orderNo}？`,
    content: `订单状态将变更为“${orderStatusLabels[nextStatus]}”；库存仍由专用服务处理。`,
    okText: '确认',
    cancelText: '取消',
    async onOk() {
      if (!order.value) {
        return
      }

      await updateOrderStatus(order.value.id, nextStatus)
      await refreshOrder()
      message.success('订单状态已更新。')
    },
  })
}

onMounted(refreshOrder)
</script>

<template>
  <main class="admin-page">
    <a-spin v-if="isLoading" />

    <template v-else-if="order">
      <a-page-header
        :title="order.orderNo"
        :sub-title="`${order.customerName} - ${formatDate(order.createdAt)}`"
        @back="router.push('/admin/orders')"
      >
        <template #tags>
          <a-tag :color="statusColor(order.status)">{{ labelOrderStatus(order.status) }}</a-tag>
          <a-tag :color="paymentColor(order.paymentStatus)">{{ labelPaymentStatus(order.paymentStatus) }}</a-tag>
          <a-tag :color="stockRiskColor(order.stockRisk)">库存 {{ labelStockRisk(order.stockRisk) }}</a-tag>
        </template>
        <template #extra>
          <a-button @click="router.push('/admin/orders')">订单列表</a-button>
          <a-button
            type="primary"
            :disabled="!getNextOrderStatus(order.status)"
            @click="confirmAdvance"
          >
            {{ nextActionLabel() }}
          </a-button>
        </template>
      </a-page-header>

      <a-card class="admin-detail-card">
        <a-steps :current="currentStep" responsive>
          <a-step v-for="status in orderStatusFlow" :key="status" :title="orderStatusLabels[status]" />
        </a-steps>
      </a-card>

      <div class="admin-detail-grid">
        <a-card title="客户与发票">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="客户">
              {{ order.customerName }} / 等级 {{ labelCustomerTier(order.customerTier) }}
            </a-descriptions-item>
            <a-descriptions-item label="P.IVA">
              {{ order.fiscal.vatNumber }}
            </a-descriptions-item>
            <a-descriptions-item label="税号">
              {{ order.fiscal.fiscalCode }}
            </a-descriptions-item>
            <a-descriptions-item label="SDI / PEC">
              {{ order.fiscal.sdi }} / {{ order.fiscal.pec }}
            </a-descriptions-item>
            <a-descriptions-item label="地址">
              {{ order.deliveryAddress }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card title="订单金额">
          <a-statistic title="含税总额" :value="totalGross" prefix="EUR" :precision="2" />
          <a-divider />
          <a-descriptions size="small" :column="1">
            <a-descriptions-item label="净额">
              {{ formatCurrency(order.totalNet) }}
            </a-descriptions-item>
            <a-descriptions-item label="VAT">
              {{ formatCurrency(order.vat) }}
            </a-descriptions-item>
            <a-descriptions-item label="配送费">
              {{ formatCurrency(order.shipping) }}
            </a-descriptions-item>
            <a-descriptions-item label="配送方式">
              {{ order.shippingMethod }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </div>

      <a-card class="admin-table-card" title="订单商品">
        <a-table :data-source="order.lines" row-key="skuCode" :pagination="false" :scroll="{ x: 920 }">
          <a-table-column title="SKU" data-index="skuCode" key="skuCode" width="160" />
          <a-table-column title="商品" data-index="productName" key="productName" />
          <a-table-column title="品质" data-index="qualityGrade" key="qualityGrade" width="130" />
          <a-table-column title="数量" data-index="quantity" key="quantity" width="80" />
          <a-table-column title="单价" key="unitPrice" width="120">
            <template #default="{ record }">
              {{ formatCurrency(record.unitPrice) }}
            </template>
          </a-table-column>
          <a-table-column title="库存" key="stockStatus" width="130">
            <template #default="{ record }">
              <a-tag :color="record.stockStatus === 'available' ? 'green' : 'orange'">
                {{ labelStockStatus(record.stockStatus) }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="批次" data-index="batchCode" key="batchCode" width="150" />
          <a-table-column title="库位" data-index="location" key="location" width="130" />
        </a-table>
      </a-card>

      <a-card title="操作备注">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :md="12">
            <a-alert type="info" show-icon message="客户备注" :description="order.customerNote" />
          </a-col>
          <a-col :xs="24" :md="12">
            <a-alert type="warning" show-icon message="员工备注" :description="order.staffNote" />
          </a-col>
        </a-row>
      </a-card>
    </template>

    <a-result
      v-else
      status="404"
      title="未找到订单"
      sub-title="演示服务中没有这个订单。"
    >
      <template #extra>
        <a-button type="primary" @click="router.push('/admin/orders')">返回订单列表</a-button>
      </template>
    </a-result>
  </main>
</template>
