<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCartOutlined, UndoOutlined } from '@ant-design/icons-vue'
import { fetchCustomerOrders } from '@/services/order.service'
import { useUiStore } from '@/stores/ui.store'
import type { AdminOrder, AdminOrderStatus, PaymentStatus, StockRisk } from '@/types/admin'

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()
const orders = ref<AdminOrder[]>([])
const isLoading = ref(false)
const loadError = ref('')

const currency = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      title: '我的订单',
      intro: '查看订单进度、付款、配送和售后入口。',
      empty: '暂无订单',
      catalog: '继续采购',
      allOrders: '全部订单',
      detail: '订单详情',
      items: '商品',
      total: '合计',
      payment: '付款',
      stock: '库存',
      delivery: '配送',
      invoice: '发票',
      note: '备注',
      noNote: '无备注',
      rma: '申请 RMA',
      reorder: '再次采购',
      lines: '订单商品',
      qty: '数量',
      unitPrice: '单价',
      back: '返回订单列表',
    }
  }

  return {
    title: 'I miei ordini',
    intro: 'Controlla avanzamento, pagamento, consegna e RMA.',
    empty: 'Nessun ordine',
    catalog: 'Continua acquisti',
    allOrders: 'Tutti gli ordini',
    detail: 'Dettaglio ordine',
    items: 'prodotti',
    total: 'Totale',
    payment: 'Pagamento',
    stock: 'Stock',
    delivery: 'Consegna',
    invoice: 'Fattura',
    note: 'Note',
    noNote: 'Nessuna nota',
    rma: 'Richiedi RMA',
    reorder: 'Riordina',
    lines: 'Prodotti ordinati',
    qty: 'Quantita',
    unitPrice: 'Prezzo',
    back: 'Torna agli ordini',
  }
})

const statusLabels = computed<Record<AdminOrderStatus, string>>(() =>
  uiStore.language === 'zh'
    ? {
        submitted: '已提交',
        accepted: '已受理',
        picking: '拣货中',
        packed: '已打包',
        shipped: '已发货',
        completed: '已完成',
      }
    : {
        submitted: 'Inviato',
        accepted: 'Accettato',
        picking: 'In preparazione',
        packed: 'Imballato',
        shipped: 'Spedito',
        completed: 'Completato',
      },
)

const paymentLabels = computed<Record<PaymentStatus, string>>(() =>
  uiStore.language === 'zh'
    ? {
        pending: '待付款',
        paid: '已付款',
        bank_waiting: '等转账核对',
        failed: '付款失败',
      }
    : {
        pending: 'In attesa',
        paid: 'Pagato',
        bank_waiting: 'Bonifico da verificare',
        failed: 'Fallito',
      },
)

const stockLabels = computed<Record<StockRisk, string>>(() =>
  uiStore.language === 'zh'
    ? {
        clear: '库存正常',
        low: '库存偏低',
        split: '可能拆单',
        blocked: '库存阻断',
      }
    : {
        clear: 'Stock ok',
        low: 'Stock basso',
        split: 'Possibile split',
        blocked: 'Bloccato',
      },
)

const selectedOrder = computed(() => {
  const orderId = String(route.params.id || '')

  if (orderId) {
    return orders.value.find((order) => order.id === orderId || order.orderNo === orderId) || null
  }

  return orders.value[0] || null
})

async function loadOrders() {
  isLoading.value = true
  loadError.value = ''

  try {
    orders.value = await fetchCustomerOrders()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Orders load failed.'
  } finally {
    isLoading.value = false
  }
}

function orderTotal(order: AdminOrder) {
  return order.totalNet + order.vat + order.shipping
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(uiStore.language === 'zh' ? 'zh-CN' : 'it-IT', {
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

function stockColor(risk: StockRisk) {
  const colors: Record<StockRisk, string> = {
    clear: 'green',
    low: 'orange',
    split: 'purple',
    blocked: 'red',
  }

  return colors[risk]
}

function openOrder(order: AdminOrder) {
  router.push(`/account/orders/${order.id}`)
}

watch(
  () => route.params.id,
  () => {
    if (!orders.value.length) {
      loadOrders()
    }
  },
)

onMounted(loadOrders)
</script>

<template>
  <main class="customer-orders-page">
    <section class="customer-orders-head">
      <div>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.intro }}</p>
      </div>
      <RouterLink to="/products">
        <a-button type="primary">
          <ShoppingCartOutlined />
          {{ copy.catalog }}
        </a-button>
      </RouterLink>
    </section>

    <a-alert v-if="loadError" type="error" show-icon :message="loadError" />

    <a-spin :spinning="isLoading">
      <a-empty v-if="!orders.length && !isLoading" :description="copy.empty">
        <RouterLink to="/products">
          <a-button type="primary">{{ copy.catalog }}</a-button>
        </RouterLink>
      </a-empty>

      <section v-else class="customer-orders-grid">
        <div class="customer-orders-list">
          <div class="customer-orders-list-title">
            <span>{{ copy.allOrders }}</span>
            <a-tag color="blue">{{ orders.length }}</a-tag>
          </div>

          <button
            v-for="order in orders"
            :key="order.id"
            type="button"
            class="customer-order-card"
            :class="{ 'is-active': selectedOrder?.id === order.id }"
            @click="openOrder(order)"
          >
            <span class="customer-order-card-top">
              <strong>{{ order.orderNo }}</strong>
              <b>{{ currency.format(orderTotal(order)) }}</b>
            </span>
            <span>{{ formatDate(order.createdAt) }}</span>
            <span class="customer-order-tags">
              <a-tag :color="statusColor(order.status)">{{ statusLabels[order.status] }}</a-tag>
              <a-tag :color="paymentColor(order.paymentStatus)">
                {{ paymentLabels[order.paymentStatus] }}
              </a-tag>
              <a-tag :color="stockColor(order.stockRisk)">{{ stockLabels[order.stockRisk] }}</a-tag>
            </span>
          </button>
        </div>

        <a-card v-if="selectedOrder" class="customer-order-detail-card" :title="copy.detail">
          <template #extra>
            <a-button size="small" @click="router.push('/account/orders')">
              {{ copy.back }}
            </a-button>
          </template>

          <div class="customer-order-detail-title">
            <div>
              <h2>{{ selectedOrder.orderNo }}</h2>
              <p>{{ selectedOrder.customerName }} · {{ formatDate(selectedOrder.createdAt) }}</p>
            </div>
            <strong>{{ currency.format(orderTotal(selectedOrder)) }}</strong>
          </div>

          <div class="customer-order-status-grid">
            <div>
              <span>{{ copy.payment }}</span>
              <a-tag :color="paymentColor(selectedOrder.paymentStatus)">
                {{ paymentLabels[selectedOrder.paymentStatus] }}
              </a-tag>
            </div>
            <div>
              <span>{{ copy.stock }}</span>
              <a-tag :color="stockColor(selectedOrder.stockRisk)">
                {{ stockLabels[selectedOrder.stockRisk] }}
              </a-tag>
            </div>
            <div>
              <span>{{ copy.delivery }}</span>
              <strong>{{ selectedOrder.shippingMethod }}</strong>
            </div>
            <div>
              <span>{{ copy.invoice }}</span>
              <strong>{{ selectedOrder.fiscal.sdi || selectedOrder.fiscal.pec || '-' }}</strong>
            </div>
          </div>

          <a-divider />

          <div class="customer-order-lines-head">
            <h3>{{ copy.lines }}</h3>
            <a-tag>{{ selectedOrder.lines.length }} {{ copy.items }}</a-tag>
          </div>

          <div class="customer-order-lines">
            <article v-for="line in selectedOrder.lines" :key="line.skuCode" class="customer-order-line">
              <div>
                <strong>{{ line.productName }}</strong>
                <span>{{ line.qualityGrade }}</span>
              </div>
              <span>{{ copy.qty }} {{ line.quantity }}</span>
              <b>{{ currency.format(line.unitPrice * line.quantity) }}</b>
            </article>
          </div>

          <a-divider />

          <div class="customer-order-total-box">
            <span>{{ copy.total }}</span>
            <strong>{{ currency.format(orderTotal(selectedOrder)) }}</strong>
          </div>

          <a-alert
            type="info"
            show-icon
            :message="copy.note"
            :description="selectedOrder.customerNote || copy.noNote"
          />

          <div class="customer-order-actions">
            <RouterLink :to="`/account/rma?order=${selectedOrder.orderNo}`">
              <a-button>
                <UndoOutlined />
                {{ copy.rma }}
              </a-button>
            </RouterLink>
            <RouterLink to="/products">
              <a-button type="primary">{{ copy.reorder }}</a-button>
            </RouterLink>
          </div>
        </a-card>
      </section>
    </a-spin>
  </main>
</template>
