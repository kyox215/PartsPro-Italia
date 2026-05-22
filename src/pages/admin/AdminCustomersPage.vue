<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchCustomerAccounts, fetchPriceGroups, getCustomerAccounts, getPriceGroups } from '@/services/admin.service'
import type { CustomerAccount, CustomerStatus, CustomerTier } from '@/types/admin'

const customers = ref(getCustomerAccounts())
const priceGroups = ref(getPriceGroups())
const isLoading = ref(false)
const query = ref('')
const selectedCustomer = ref<CustomerAccount | null>(null)
const isDrawerOpen = ref(false)

const columns = [
  { title: 'Cliente', dataIndex: 'companyName', key: 'customer', width: 280 },
  { title: 'P.IVA / SDI / PEC', key: 'fiscal', width: 280 },
  { title: 'Tier', dataIndex: 'tier', key: 'tier', width: 120 },
  { title: 'Gruppo prezzo', dataIndex: 'priceGroupId', key: 'priceGroup', width: 180 },
  { title: 'Acquisti', key: 'purchase', width: 180 },
  { title: 'Credito / termini', key: 'terms', width: 220 },
  { title: 'Stato', dataIndex: 'status', key: 'status', width: 120 },
  { title: 'Azioni', key: 'actions', fixed: 'right' as const, width: 110 },
]

const filteredCustomers = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  if (!normalizedQuery) {
    return customers.value
  }

  return customers.value.filter((customer) =>
    [
      customer.companyName,
      customer.contactName,
      customer.email,
      customer.vatNumber,
      customer.sdi,
      customer.pec,
      customer.priceGroupId,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  )
})

const stats = computed(() => ({
  total: customers.value.length,
  active: customers.value.filter((customer) => customer.status === 'active').length,
  gold: customers.value.filter((customer) => customer.tier === 'gold').length,
  revenue: customers.value.reduce((total, customer) => total + customer.revenue, 0),
}))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function tierColor(tier: CustomerTier) {
  const colors: Record<CustomerTier, string> = {
    standard: 'blue',
    silver: 'purple',
    gold: 'gold',
  }

  return colors[tier]
}

function statusColor(status: CustomerStatus) {
  const colors: Record<CustomerStatus, string> = {
    active: 'green',
    pending: 'orange',
    suspended: 'red',
  }

  return colors[status]
}

function priceGroupName(priceGroupId: string) {
  return priceGroups.value.find((group) => group.id === priceGroupId)?.name || priceGroupId
}

function openCustomer(customer: CustomerAccount) {
  selectedCustomer.value = customer
  isDrawerOpen.value = true
}

async function loadCustomers() {
  isLoading.value = true
  try {
    const [customerRows, priceGroupRows] = await Promise.all([
      fetchCustomerAccounts(),
      fetchPriceGroups(),
    ])
    customers.value = customerRows
    priceGroups.value = priceGroupRows
  } finally {
    isLoading.value = false
  }
}

onMounted(loadCustomers)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="客户管理"
      sub-title="公司、P.IVA、SDI、PEC、客户等级、价格组和付款条款"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Clienti" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Attivi" :value="stats.active" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Gold" :value="stats.gold" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Revenue mock" :value="stats.revenue" prefix="EUR" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="Cerca azienda, email, P.IVA, SDI..."
          allow-clear
        />
        <a-alert
          type="info"
          show-icon
          message="客户主数据"
          description="用于维护客户等级、电子发票资料和价格组。"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredCustomers"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1360 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'customer'">
            <strong>{{ record.companyName }}</strong>
            <span class="admin-muted-line">{{ record.contactName }} / {{ record.email }}</span>
          </template>

          <template v-else-if="column.key === 'fiscal'">
            <span>P.IVA {{ record.vatNumber }}</span>
            <span class="admin-muted-line">SDI {{ record.sdi }}</span>
            <span class="admin-muted-line">PEC {{ record.pec }}</span>
          </template>

          <template v-else-if="column.key === 'tier'">
            <a-tag :color="tierColor(record.tier)">{{ record.tier }}</a-tag>
          </template>

          <template v-else-if="column.key === 'priceGroup'">
            <a-tag color="blue">{{ priceGroupName(record.priceGroupId) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'purchase'">
            <strong>{{ formatCurrency(record.revenue) }}</strong>
            <span class="admin-muted-line">{{ record.ordersCount }} ordini</span>
            <span class="admin-muted-line">Ultimo {{ formatDate(record.lastOrderAt) }}</span>
          </template>

          <template v-else-if="column.key === 'terms'">
            <span>{{ record.paymentTerms }}</span>
            <span class="admin-muted-line">Credito {{ formatCurrency(record.creditLimit) }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-button size="small" @click="openCustomer(record)">Dettaglio</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
      width="640"
      :title="selectedCustomer?.companyName || 'Cliente'"
    >
      <template v-if="selectedCustomer">
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item label="Contatto">
            {{ selectedCustomer.contactName }} / {{ selectedCustomer.email }}
          </a-descriptions-item>
          <a-descriptions-item label="Fattura elettronica">
            P.IVA {{ selectedCustomer.vatNumber }} - SDI {{ selectedCustomer.sdi }} - PEC
            {{ selectedCustomer.pec }}
          </a-descriptions-item>
          <a-descriptions-item label="Tier">
            {{ selectedCustomer.tier }} / {{ priceGroupName(selectedCustomer.priceGroupId) }}
          </a-descriptions-item>
          <a-descriptions-item label="Volume mensile">
            {{ selectedCustomer.monthlyPurchase }}
          </a-descriptions-item>
          <a-descriptions-item label="Credito">
            {{ formatCurrency(selectedCustomer.creditLimit) }} / {{ selectedCustomer.paymentTerms }}
          </a-descriptions-item>
          <a-descriptions-item label="Storico">
            {{ selectedCustomer.ordersCount }} ordini, {{ formatCurrency(selectedCustomer.revenue) }}
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>
  </main>
</template>
