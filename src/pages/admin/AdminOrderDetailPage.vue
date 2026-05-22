<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  getAdminOrderById,
  getNextOrderStatus,
  orderStatusFlow,
  staffShipOrder,
  updateOrderStatus,
} from '@/services/admin.service'
import type { AdminOrder, AdminOrderStatus, PaymentStatus, StockRisk } from '@/types/admin'

const route = useRoute()
const router = useRouter()
const order = ref<AdminOrder | null>(getAdminOrderById(String(route.params.id)))

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
  return new Intl.DateTimeFormat('it-IT', {
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

function refreshOrder() {
  order.value = getAdminOrderById(String(route.params.id))
}

function nextActionLabel() {
  if (!order.value) {
    return ''
  }

  const nextStatus = getNextOrderStatus(order.value.status)

  if (!nextStatus) {
    return 'Completato'
  }

  return nextStatus === 'shipped' ? 'Spedisci ordine' : `Avanza a ${nextStatus}`
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
      title: `Spedire ${order.value.orderNo}?`,
      content:
        'Questa azione chiama staff_ship_order. Il backend reale dovra scaricare lo stock in modo atomico.',
      okText: 'Chiama staff_ship_order',
      cancelText: 'Annulla',
      async onOk() {
        if (!order.value) {
          return
        }

        await staffShipOrder(order.value.id)
        refreshOrder()
        message.success('Ordine spedito tramite staff_ship_order placeholder.')
      },
    })
    return
  }

  Modal.confirm({
    title: `Portare ${order.value.orderNo} a ${nextStatus}?`,
    content: 'Aggiorna solo lo stato ordine; lo stock resta gestito dal service dedicato.',
    okText: 'Conferma',
    cancelText: 'Annulla',
    async onOk() {
      if (!order.value) {
        return
      }

      await updateOrderStatus(order.value.id, nextStatus)
      refreshOrder()
      message.success('Stato ordine aggiornato.')
    },
  })
}
</script>

<template>
  <main class="admin-page">
    <template v-if="order">
      <a-page-header
        :title="order.orderNo"
        :sub-title="`${order.customerName} - ${formatDate(order.createdAt)}`"
        @back="router.push('/admin/orders')"
      >
        <template #tags>
          <a-tag :color="statusColor(order.status)">{{ order.status }}</a-tag>
          <a-tag :color="paymentColor(order.paymentStatus)">{{ order.paymentStatus }}</a-tag>
          <a-tag :color="stockRiskColor(order.stockRisk)">stock {{ order.stockRisk }}</a-tag>
        </template>
        <template #extra>
          <a-button @click="router.push('/admin/orders')">Lista ordini</a-button>
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
          <a-step v-for="status in orderStatusFlow" :key="status" :title="status" />
        </a-steps>
      </a-card>

      <div class="admin-detail-grid">
        <a-card title="Cliente e fattura">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="Cliente">
              {{ order.customerName }} / tier {{ order.customerTier }}
            </a-descriptions-item>
            <a-descriptions-item label="P.IVA">
              {{ order.fiscal.vatNumber }}
            </a-descriptions-item>
            <a-descriptions-item label="Codice Fiscale">
              {{ order.fiscal.fiscalCode }}
            </a-descriptions-item>
            <a-descriptions-item label="SDI / PEC">
              {{ order.fiscal.sdi }} / {{ order.fiscal.pec }}
            </a-descriptions-item>
            <a-descriptions-item label="Indirizzo">
              {{ order.deliveryAddress }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>

        <a-card title="Totali ordine">
          <a-statistic title="Totale lordo" :value="totalGross" prefix="EUR" :precision="2" />
          <a-divider />
          <a-descriptions size="small" :column="1">
            <a-descriptions-item label="Netto">
              {{ formatCurrency(order.totalNet) }}
            </a-descriptions-item>
            <a-descriptions-item label="VAT">
              {{ formatCurrency(order.vat) }}
            </a-descriptions-item>
            <a-descriptions-item label="Spedizione">
              {{ formatCurrency(order.shipping) }}
            </a-descriptions-item>
            <a-descriptions-item label="Metodo">
              {{ order.shippingMethod }}
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </div>

      <a-card class="admin-table-card" title="Righe ordine">
        <a-table :data-source="order.lines" row-key="skuCode" :pagination="false" :scroll="{ x: 920 }">
          <a-table-column title="SKU" data-index="skuCode" key="skuCode" width="160" />
          <a-table-column title="Prodotto" data-index="productName" key="productName" />
          <a-table-column title="Qualita" data-index="qualityGrade" key="qualityGrade" width="130" />
          <a-table-column title="Qta" data-index="quantity" key="quantity" width="80" />
          <a-table-column title="Prezzo" key="unitPrice" width="120">
            <template #default="{ record }">
              {{ formatCurrency(record.unitPrice) }}
            </template>
          </a-table-column>
          <a-table-column title="Stock" key="stockStatus" width="130">
            <template #default="{ record }">
              <a-tag :color="record.stockStatus === 'available' ? 'green' : 'orange'">
                {{ record.stockStatus }}
              </a-tag>
            </template>
          </a-table-column>
          <a-table-column title="Lotto" data-index="batchCode" key="batchCode" width="150" />
          <a-table-column title="Ubicazione" data-index="location" key="location" width="130" />
        </a-table>
      </a-card>

      <a-card title="Note operative">
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :md="12">
            <a-alert type="info" show-icon message="Nota cliente" :description="order.customerNote" />
          </a-col>
          <a-col :xs="24" :md="12">
            <a-alert type="warning" show-icon message="Nota staff" :description="order.staffNote" />
          </a-col>
        </a-row>
      </a-card>
    </template>

    <a-result
      v-else
      status="404"
      title="Ordine non trovato"
      sub-title="Il mock service non contiene questo ordine."
    >
      <template #extra>
        <a-button type="primary" @click="router.push('/admin/orders')">Torna agli ordini</a-button>
      </template>
    </a-result>
  </main>
</template>
