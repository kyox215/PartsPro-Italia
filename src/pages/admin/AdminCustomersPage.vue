<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fetchCustomerAccounts, fetchPriceGroups, getCustomerAccounts, getPriceGroups } from '@/services/admin.service'
import type { CustomerAccount, CustomerStatus, CustomerTier } from '@/types/admin'
import { labelCustomerStatus, labelCustomerTier } from '@/utils/adminLabels'

const route = useRoute()
const customers = ref(getCustomerAccounts())
const priceGroups = ref(getPriceGroups())
const isLoading = ref(false)
const query = ref('')
const selectedCustomer = ref<CustomerAccount | null>(null)
const isDrawerOpen = ref(false)

const columns = [
  { title: '客户', dataIndex: 'companyName', key: 'customer', width: 280 },
  { title: 'P.IVA / SDI / PEC', key: 'fiscal', width: 280 },
  { title: '客户等级', dataIndex: 'tier', key: 'tier', width: 120 },
  { title: '价格组', dataIndex: 'priceGroupId', key: 'priceGroup', width: 180 },
  { title: '采购', key: 'purchase', width: 180 },
  { title: '信用 / 条款', key: 'terms', width: 220 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 110 },
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
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)),
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

function formatDate(value: string | null) {
  if (!value) {
    return '暂无订单'
  }

  return new Intl.DateTimeFormat('zh-CN', {
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
  return priceGroupId ? priceGroups.value.find((group) => group.id === priceGroupId)?.name || priceGroupId : '未分配'
}

function readRouteQuery(value: unknown) {
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
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
      title="客户管理"
      sub-title="公司、P.IVA、SDI、PEC、客户等级、价格组和付款条款"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="客户总数" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="正常客户" :value="stats.active" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="金牌客户" :value="stats.gold" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="演示销售额" :value="stats.revenue" prefix="EUR" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="搜索公司、邮箱、P.IVA、SDI..."
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
        class="admin-desktop-data-table"
        :columns="columns"
        :data-source="filteredCustomers"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1360 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'customer'">
            <strong>{{ record.companyName || '未完善公司资料' }}</strong>
            <span class="admin-muted-line">{{ record.contactName || '未填写联系人' }} / {{ record.email }}</span>
          </template>

          <template v-else-if="column.key === 'fiscal'">
            <span>P.IVA {{ record.vatNumber || '未填写' }}</span>
            <span class="admin-muted-line">SDI {{ record.sdi || '未填写' }}</span>
            <span class="admin-muted-line">PEC {{ record.pec || '未填写' }}</span>
          </template>

          <template v-else-if="column.key === 'tier'">
            <a-tag :color="tierColor(record.tier)">{{ labelCustomerTier(record.tier) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'priceGroup'">
            <a-tag color="blue">{{ priceGroupName(record.priceGroupId) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'purchase'">
            <strong>{{ formatCurrency(record.revenue) }}</strong>
            <span class="admin-muted-line">{{ record.ordersCount }} 个订单</span>
            <span class="admin-muted-line">最近 {{ formatDate(record.lastOrderAt) }}</span>
          </template>

          <template v-else-if="column.key === 'terms'">
            <span>{{ record.paymentTerms }}</span>
            <span class="admin-muted-line">信用额度 {{ formatCurrency(record.creditLimit) }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ labelCustomerStatus(record.status) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-button size="small" @click="openCustomer(record)">详情</a-button>
          </template>
        </template>
      </a-table>

      <div class="admin-mobile-data-list admin-mobile-customer-list">
        <a-empty v-if="filteredCustomers.length === 0" class="admin-mobile-empty" description="暂无客户" />
        <article
          v-for="customer in filteredCustomers"
          :key="customer.id"
          class="admin-mobile-data-card admin-mobile-customer-card"
        >
          <header>
            <div>
              <strong>{{ customer.companyName || '未完善公司资料' }}</strong>
              <span>{{ customer.contactName || '未填写联系人' }} / {{ customer.email }}</span>
            </div>
            <a-tag :color="statusColor(customer.status)">
              {{ labelCustomerStatus(customer.status) }}
            </a-tag>
          </header>

          <div class="admin-mobile-data-tags">
            <a-tag :color="tierColor(customer.tier)">{{ labelCustomerTier(customer.tier) }}</a-tag>
            <a-tag color="blue">{{ priceGroupName(customer.priceGroupId) }}</a-tag>
          </div>

          <dl class="admin-mobile-data-grid">
            <div>
              <dt>P.IVA</dt>
              <dd>{{ customer.vatNumber || '未填写' }}</dd>
            </div>
            <div>
              <dt>发票</dt>
              <dd>SDI {{ customer.sdi || '-' }} / PEC {{ customer.pec || '-' }}</dd>
            </div>
            <div>
              <dt>采购</dt>
              <dd>{{ formatCurrency(customer.revenue) }} · {{ customer.ordersCount }} 单</dd>
            </div>
            <div>
              <dt>最近订单</dt>
              <dd>{{ formatDate(customer.lastOrderAt) }}</dd>
            </div>
            <div>
              <dt>付款条款</dt>
              <dd>{{ customer.paymentTerms }}</dd>
            </div>
            <div>
              <dt>信用额度</dt>
              <dd>{{ formatCurrency(customer.creditLimit) }}</dd>
            </div>
          </dl>

          <div class="admin-mobile-data-actions">
            <a-button size="small" block @click="openCustomer(customer)">详情</a-button>
          </div>
        </article>
      </div>
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
      class="admin-data-drawer"
      width="640"
      :title="selectedCustomer?.companyName || selectedCustomer?.email || '客户详情'"
    >
      <template v-if="selectedCustomer">
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item label="联系人">
            {{ selectedCustomer.contactName || '未填写联系人' }} / {{ selectedCustomer.email }}
          </a-descriptions-item>
          <a-descriptions-item label="电子发票">
            P.IVA {{ selectedCustomer.vatNumber || '未填写' }} - SDI
            {{ selectedCustomer.sdi || '未填写' }} - PEC {{ selectedCustomer.pec || '未填写' }}
          </a-descriptions-item>
          <a-descriptions-item label="客户等级">
            {{ labelCustomerTier(selectedCustomer.tier) }} / {{ priceGroupName(selectedCustomer.priceGroupId) }}
          </a-descriptions-item>
          <a-descriptions-item label="月采购量">
            {{ selectedCustomer.monthlyPurchase }}
          </a-descriptions-item>
          <a-descriptions-item label="信用额度">
            {{ formatCurrency(selectedCustomer.creditLimit) }} / {{ selectedCustomer.paymentTerms }}
          </a-descriptions-item>
          <a-descriptions-item label="历史采购">
            {{ selectedCustomer.ordersCount }} 个订单，{{ formatCurrency(selectedCustomer.revenue) }}
          </a-descriptions-item>
        </a-descriptions>
      </template>
    </a-drawer>
  </main>
</template>
