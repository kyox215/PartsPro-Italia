<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  approveCustomerAccount,
  approveB2BApplication,
  fetchB2BApprovals,
  fetchCustomerAccounts,
  fetchPriceGroups,
  saveCustomerAccount,
} from '@/services/admin.service'
import type {
  B2BApproval,
  B2BApprovalStatus,
  CustomerAccount,
  CustomerStatus,
  CustomerTier,
  PriceGroup,
} from '@/types/admin'
import {
  labelApprovalStatus,
  labelCategory,
  labelCustomerStatus,
  labelCustomerTier,
} from '@/utils/adminLabels'

type CustomerTabKey = 'accounts' | 'approvals'

const route = useRoute()
const router = useRouter()
const customers = ref<CustomerAccount[]>([])
const approvals = ref<B2BApproval[]>([])
const priceGroups = ref<PriceGroup[]>([])
const isCustomersLoading = ref(false)
const isApprovalsLoading = ref(false)
const isSavingCustomer = ref(false)
const query = ref('')
const approvalQuery = ref('')
const activeTab = ref<CustomerTabKey>('accounts')
const selectedApprovalStatus = ref<'all' | B2BApprovalStatus>('submitted')
const selectedCustomer = ref<CustomerAccount | null>(null)
const selectedApproval = ref<B2BApproval | null>(null)
const selectedPriceGroupId = ref('pg-standard-b2b')
const isCustomerDrawerOpen = ref(false)
const isApprovalDrawerOpen = ref(false)
const customerDataError = ref('')
const approvalDataError = ref('')
const customerDraft = ref({
  status: 'pending' as CustomerStatus,
  tier: 'standard' as CustomerTier,
  priceGroupId: '',
  monthlyPurchase: '',
  creditLimit: 0,
  paymentTerms: '',
})

const customerColumns = [
  { title: '客户', dataIndex: 'companyName', key: 'customer', width: 280 },
  { title: '税务 / 联系', key: 'fiscal', width: 300 },
  { title: '客户等级', dataIndex: 'tier', key: 'tier', width: 120 },
  { title: '价格组', dataIndex: 'priceGroupId', key: 'priceGroup', width: 180 },
  { title: '采购', key: 'purchase', width: 180 },
  { title: '信用 / 条款', key: 'terms', width: 220 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 110 },
]

const approvalColumns = [
  { title: '申请', dataIndex: 'companyName', key: 'request', width: 300 },
  { title: '税务资料', key: 'fiscal', width: 260 },
  { title: '采购量 / 分类', key: 'volume', width: 260 },
  { title: '价格组', dataIndex: 'requestedPriceGroupId', key: 'group', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 240 },
]

const approvalStatusOptions = computed(() => [
  { label: `全部 (${approvals.value.length})`, value: 'all' },
  { label: `待审核 (${approvals.value.filter((item) => item.status === 'submitted').length})`, value: 'submitted' },
  { label: `已通过 (${approvals.value.filter((item) => item.status === 'approved').length})`, value: 'approved' },
  { label: `已拒绝 (${approvals.value.filter((item) => item.status === 'rejected').length})`, value: 'rejected' },
])

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
      customer.phone,
      customer.vatNumber,
      customer.fiscalCode,
      customer.sdi,
      customer.pec,
      customer.priceGroupId,
      customer.registeredAddress,
      customer.shippingAddress,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)),
  )
})

const filteredApprovals = computed(() => {
  const normalizedQuery = approvalQuery.value.trim().toLowerCase()
  const statusFiltered =
    selectedApprovalStatus.value === 'all'
      ? approvals.value
      : approvals.value.filter((approval) => approval.status === selectedApprovalStatus.value)

  if (!normalizedQuery) {
    return statusFiltered
  }

  return statusFiltered.filter((approval) =>
    [
      approval.companyName,
      approval.contactName,
      approval.email,
      approval.phone,
      approval.vatNumber,
      approval.fiscalCode,
      approval.sdi,
      approval.pec,
      approval.registeredAddress,
      approval.shippingAddress,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)),
  )
})

const stats = computed(() => ({
  total: customers.value.length,
  active: customers.value.filter((customer) => customer.status === 'active').length,
  pendingCustomers: customers.value.filter((customer) => customer.status === 'pending').length,
  pendingApprovals: approvals.value.filter((approval) => approval.status === 'submitted').length,
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
    timeStyle: 'short',
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

function customerStatusColor(status: CustomerStatus) {
  const colors: Record<CustomerStatus, string> = {
    active: 'green',
    pending: 'orange',
    suspended: 'red',
  }

  return colors[status]
}

function approvalStatusColor(status: B2BApprovalStatus) {
  const colors: Record<B2BApprovalStatus, string> = {
    submitted: 'orange',
    approved: 'green',
    rejected: 'red',
  }

  return colors[status]
}

function priceGroupName(priceGroupId: string) {
  return priceGroupId ? priceGroups.value.find((group) => group.id === priceGroupId)?.name || priceGroupId : '未分配'
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '无法读取 Supabase 真实数据。'
}

function isNewCustomer(customer: CustomerAccount) {
  return customer.status === 'pending' && !customer.profileCompletedAt
}

function tierFromPriceGroup(priceGroupId: string): CustomerTier {
  const normalizedGroupId = priceGroupId.toLowerCase()

  if (normalizedGroupId.includes('gold')) {
    return 'gold'
  }

  if (normalizedGroupId.includes('silver')) {
    return 'silver'
  }

  return 'standard'
}

function creditLimitFromTier(tier: CustomerTier) {
  const limits: Record<CustomerTier, number> = {
    standard: 0,
    silver: 900,
    gold: 2500,
  }

  return limits[tier]
}

function priceGroupTerms(priceGroupId: string) {
  return priceGroups.value.find((group) => group.id === priceGroupId)?.paymentTerms || ''
}

function syncCustomerDraft(customer: CustomerAccount) {
  customerDraft.value = {
    status: customer.status,
    tier: customer.tier,
    priceGroupId: customer.priceGroupId || priceGroups.value[0]?.id || '',
    monthlyPurchase: customer.monthlyPurchase,
    creditLimit: customer.creditLimit,
    paymentTerms: customer.paymentTerms,
  }
}

function handleCustomerPriceGroupChange(value: string | number) {
  const priceGroupId = String(value)
  const tier = tierFromPriceGroup(priceGroupId)

  customerDraft.value = {
    ...customerDraft.value,
    priceGroupId,
    tier,
    creditLimit: creditLimitFromTier(tier),
    paymentTerms: priceGroupTerms(priceGroupId) || customerDraft.value.paymentTerms,
  }
}

function readRouteQuery(value: unknown) {
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
}

function readTabQuery(value: unknown): CustomerTabKey {
  const tab = readRouteQuery(value)
  return tab === 'approvals' ? 'approvals' : 'accounts'
}

function handleTabChange(tab: string | number) {
  const nextTab = tab === 'approvals' ? 'approvals' : 'accounts'
  activeTab.value = nextTab

  const nextQuery = { ...route.query }
  if (nextTab === 'accounts') {
    delete nextQuery.tab
  } else {
    nextQuery.tab = nextTab
  }

  router.replace({ query: nextQuery })
}

function openCustomer(customer: CustomerAccount) {
  selectedCustomer.value = customer
  syncCustomerDraft(customer)
  isCustomerDrawerOpen.value = true
}

function openApproval(approval: B2BApproval) {
  selectedApproval.value = approval
  selectedPriceGroupId.value = approval.requestedPriceGroupId || priceGroups.value[0]?.id || 'pg-standard-b2b'
  isApprovalDrawerOpen.value = true
}

async function loadCustomers() {
  isCustomersLoading.value = true
  customerDataError.value = ''
  try {
    const [customerRows, priceGroupRows] = await Promise.all([
      fetchCustomerAccounts(),
      fetchPriceGroups({ realOnly: true }),
    ])
    customers.value = customerRows
    priceGroups.value = priceGroupRows
  } catch (error) {
    customers.value = []
    customerDataError.value = errorMessage(error)
  } finally {
    isCustomersLoading.value = false
  }
}

async function loadApprovals() {
  isApprovalsLoading.value = true
  approvalDataError.value = ''
  try {
    const [approvalRows, priceGroupRows] = await Promise.all([
      fetchB2BApprovals(),
      fetchPriceGroups({ realOnly: true }),
    ])
    approvals.value = approvalRows
    priceGroups.value = priceGroupRows
  } catch (error) {
    approvals.value = []
    approvalDataError.value = errorMessage(error)
  } finally {
    isApprovalsLoading.value = false
  }
}

function replaceCustomer(savedCustomer: CustomerAccount) {
  customers.value = customers.value.map((customer) =>
    customer.id === savedCustomer.id ? savedCustomer : customer,
  )
  selectedCustomer.value = savedCustomer
  syncCustomerDraft(savedCustomer)
}

async function saveSelectedCustomer() {
  if (!selectedCustomer.value) {
    return
  }

  isSavingCustomer.value = true
  try {
    const savedCustomer = await saveCustomerAccount(selectedCustomer.value.id, customerDraft.value)
    replaceCustomer(savedCustomer)
    message.success('客户权限已保存。')
  } catch (error) {
    message.error(errorMessage(error))
  } finally {
    isSavingCustomer.value = false
  }
}

function approveSelectedCustomer() {
  if (!selectedCustomer.value) {
    return
  }

  const customer = selectedCustomer.value
  const priceGroupId = customerDraft.value.priceGroupId || priceGroups.value[0]?.id || ''

  if (!priceGroupId) {
    message.warning('请先在 Supabase 价格组中配置至少一个价格组。')
    return
  }

  Modal.confirm({
    title: `确认通过 ${customer.companyName || customer.email}？`,
    content: `客户会变为正常状态，并分配价格组：${priceGroupName(priceGroupId)}。`,
    okText: '通过审核',
    cancelText: '取消',
    async onOk() {
      isSavingCustomer.value = true
      try {
        const savedCustomer = await approveCustomerAccount(customer.id, priceGroupId)
        replaceCustomer(savedCustomer)
        message.success('客户已通过审核。')
      } catch (error) {
        message.error(errorMessage(error))
      } finally {
        isSavingCustomer.value = false
      }
    },
  })
}

async function reviewApproval(
  approval: B2BApproval,
  status: Extract<B2BApprovalStatus, 'approved' | 'rejected'>,
  priceGroupId = selectedPriceGroupId.value || approval.requestedPriceGroupId || 'pg-standard-b2b',
) {
  const actionText = status === 'approved' ? '通过' : '拒绝'

  Modal.confirm({
    title: `确认${actionText} ${approval.companyName}？`,
    content:
      status === 'approved'
        ? `审核通过后会同步到客户主数据，并分配价格组：${priceGroupName(priceGroupId)}。`
        : '该申请会保留为已拒绝记录，便于后续追踪。',
    okText: actionText,
    cancelText: '取消',
    async onOk() {
      await approveB2BApplication(approval.id, status, priceGroupId)
      await Promise.all([loadApprovals(), loadCustomers()])
      isApprovalDrawerOpen.value = false
      message.success(status === 'approved' ? 'B2B 申请已通过，客户主数据已同步。' : 'B2B 申请已拒绝。')
    },
  })
}

onMounted(async () => {
  await Promise.all([loadCustomers(), loadApprovals()])
})

watch(
  () => route.query.q,
  (value) => {
    const nextQuery = readRouteQuery(value)
    query.value = nextQuery
    approvalQuery.value = nextQuery
  },
  { immediate: true },
)

watch(
  () => route.query.tab,
  (value) => {
    activeTab.value = readTabQuery(value)
  },
  { immediate: true },
)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="客户管理"
      sub-title="客户主数据、B2B 开户审核、价格组、电子发票资料和付款条款"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="客户总数" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="正常客户" :value="stats.active" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="新用户/待审核" :value="stats.pendingCustomers" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="真实销售额" :value="stats.revenue" prefix="EUR" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
        <a-tab-pane key="accounts" tab="客户主数据">
          <div class="admin-toolbar">
            <a-input-search
              v-model:value="query"
              class="admin-toolbar-search"
              placeholder="搜索公司、邮箱、电话、P.IVA、SDI..."
              allow-clear
            />
            <a-alert
              v-if="customerDataError"
              type="error"
              show-icon
              message="无法读取 Supabase 客户真实数据"
              :description="customerDataError"
            />
            <a-alert
              v-else
              type="info"
              show-icon
              message="Supabase 客户真实数据"
              description="Google 登录、邮箱登录和 B2B 审核同步后的客户都会在这里以真实数据库状态展示。"
            />
          </div>

          <a-table
            class="admin-desktop-data-table"
            :columns="customerColumns"
            :data-source="filteredCustomers"
            :loading="isCustomersLoading"
            row-key="id"
            :scroll="{ x: 1420 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'customer'">
                <strong>{{ record.companyName || '未完善公司资料' }}</strong>
                <a-tag v-if="isNewCustomer(record)" color="orange">新用户</a-tag>
                <span class="admin-muted-line">{{ record.contactName || '未填写联系人' }} / {{ record.email }}</span>
                <span class="admin-muted-line">{{ record.phone || '未填写电话' }}</span>
              </template>

              <template v-else-if="column.key === 'fiscal'">
                <span>P.IVA {{ record.vatNumber || '未填写' }}</span>
                <span class="admin-muted-line">CF {{ record.fiscalCode || '未填写' }}</span>
                <span class="admin-muted-line">SDI {{ record.sdi || '未填写' }} / PEC {{ record.pec || '未填写' }}</span>
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
                <span>{{ record.paymentTerms || '未设置' }}</span>
                <span class="admin-muted-line">信用额度 {{ formatCurrency(record.creditLimit) }}</span>
              </template>

              <template v-else-if="column.key === 'status'">
                <a-tag :color="customerStatusColor(record.status)">{{ labelCustomerStatus(record.status) }}</a-tag>
              </template>

              <template v-else-if="column.key === 'actions'">
                <a-button size="small" type="primary" ghost @click="openCustomer(record)">
                  {{ record.status === 'pending' ? '审批' : '详情' }}
                </a-button>
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
                  <a-tag v-if="isNewCustomer(customer)" color="orange">新用户</a-tag>
                  <span>{{ customer.contactName || '未填写联系人' }} / {{ customer.email }}</span>
                </div>
                <a-tag :color="customerStatusColor(customer.status)">
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
                  <dt>电话</dt>
                  <dd>{{ customer.phone || '未填写' }}</dd>
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
                  <dt>付款条款</dt>
                  <dd>{{ customer.paymentTerms || '未设置' }}</dd>
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
        </a-tab-pane>

        <a-tab-pane key="approvals" tab="B2B 审核">
          <div class="admin-toolbar">
            <a-input-search
              v-model:value="approvalQuery"
              class="admin-toolbar-search"
              placeholder="搜索申请公司、邮箱、电话、P.IVA..."
              allow-clear
            />
            <a-segmented v-model:value="selectedApprovalStatus" :options="approvalStatusOptions" />
            <a-select v-model:value="selectedPriceGroupId" class="admin-toolbar-search">
              <a-select-option v-for="group in priceGroups" :key="group.id" :value="group.id">
                {{ group.name }}
              </a-select-option>
            </a-select>
            <a-alert
              v-if="approvalDataError"
              type="error"
              show-icon
              message="无法读取 Supabase B2B 申请"
              :description="approvalDataError"
            />
          </div>

          <a-table
            class="admin-desktop-data-table"
            :columns="approvalColumns"
            :data-source="filteredApprovals"
            :loading="isApprovalsLoading"
            row-key="id"
            :scroll="{ x: 1360 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'request'">
                <strong>{{ record.companyName }}</strong>
                <span class="admin-muted-line">{{ record.contactName }} / {{ record.email }}</span>
                <span class="admin-muted-line">{{ record.phone }} / {{ formatDate(record.submittedAt) }}</span>
              </template>

              <template v-else-if="column.key === 'fiscal'">
                <span>P.IVA {{ record.vatNumber }}</span>
                <span class="admin-muted-line">CF {{ record.fiscalCode }}</span>
                <span class="admin-muted-line">SDI {{ record.sdi }} / PEC {{ record.pec }}</span>
              </template>

              <template v-else-if="column.key === 'volume'">
                <strong>{{ record.companyType }}</strong>
                <span class="admin-muted-line">{{ record.monthlyPurchase }}</span>
                <a-space wrap>
                  <a-tag v-for="category in record.interestedCategories" :key="category">
                    {{ labelCategory(category) }}
                  </a-tag>
                </a-space>
              </template>

              <template v-else-if="column.key === 'group'">
                <a-tag color="blue">{{ priceGroupName(record.requestedPriceGroupId) }}</a-tag>
              </template>

              <template v-else-if="column.key === 'status'">
                <a-tag :color="approvalStatusColor(record.status)">{{ labelApprovalStatus(record.status) }}</a-tag>
              </template>

              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button size="small" @click="openApproval(record)">详情</a-button>
                  <a-button
                    size="small"
                    type="primary"
                    :disabled="record.status !== 'submitted'"
                    @click="reviewApproval(record, 'approved', record.requestedPriceGroupId || selectedPriceGroupId)"
                  >
                    通过
                  </a-button>
                  <a-button
                    size="small"
                    danger
                    :disabled="record.status !== 'submitted'"
                    @click="reviewApproval(record, 'rejected', record.requestedPriceGroupId || selectedPriceGroupId)"
                  >
                    拒绝
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>

          <div class="admin-mobile-data-list admin-mobile-customer-list">
            <a-empty v-if="filteredApprovals.length === 0" class="admin-mobile-empty" description="暂无审核申请" />
            <article
              v-for="approval in filteredApprovals"
              :key="approval.id"
              class="admin-mobile-data-card admin-mobile-customer-card"
            >
              <header>
                <div>
                  <strong>{{ approval.companyName }}</strong>
                  <span>{{ approval.contactName }} / {{ approval.email }}</span>
                </div>
                <a-tag :color="approvalStatusColor(approval.status)">
                  {{ labelApprovalStatus(approval.status) }}
                </a-tag>
              </header>

              <dl class="admin-mobile-data-grid">
                <div>
                  <dt>P.IVA</dt>
                  <dd>{{ approval.vatNumber }}</dd>
                </div>
                <div>
                  <dt>电话</dt>
                  <dd>{{ approval.phone }}</dd>
                </div>
                <div>
                  <dt>采购量</dt>
                  <dd>{{ approval.monthlyPurchase }}</dd>
                </div>
                <div>
                  <dt>价格组</dt>
                  <dd>{{ priceGroupName(approval.requestedPriceGroupId) }}</dd>
                </div>
              </dl>

              <div class="admin-mobile-data-actions">
                <a-button size="small" block @click="openApproval(approval)">详情</a-button>
              </div>
            </article>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <a-drawer
      v-model:open="isCustomerDrawerOpen"
      class="admin-data-drawer"
      width="640"
      :title="selectedCustomer?.companyName || selectedCustomer?.email || '客户详情'"
    >
      <template v-if="selectedCustomer">
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item label="联系人">
            {{ selectedCustomer.contactName || '未填写联系人' }} / {{ selectedCustomer.email }} /
            {{ selectedCustomer.phone || '未填写电话' }}
          </a-descriptions-item>
          <a-descriptions-item label="电子发票">
            P.IVA {{ selectedCustomer.vatNumber || '未填写' }} - CF
            {{ selectedCustomer.fiscalCode || '未填写' }} - SDI
            {{ selectedCustomer.sdi || '未填写' }} - PEC {{ selectedCustomer.pec || '未填写' }}
          </a-descriptions-item>
          <a-descriptions-item label="客户等级">
            {{ labelCustomerTier(selectedCustomer.tier) }} / {{ priceGroupName(selectedCustomer.priceGroupId) }}
          </a-descriptions-item>
          <a-descriptions-item label="地址">
            注册 {{ selectedCustomer.registeredAddress || '未填写' }} / 发货
            {{ selectedCustomer.shippingAddress || '未填写' }}
          </a-descriptions-item>
          <a-descriptions-item label="月采购量">
            {{ selectedCustomer.monthlyPurchase || '未设置' }}
          </a-descriptions-item>
          <a-descriptions-item label="信用额度">
            {{ formatCurrency(selectedCustomer.creditLimit) }} / {{ selectedCustomer.paymentTerms || '未设置' }}
          </a-descriptions-item>
          <a-descriptions-item label="历史采购">
            {{ selectedCustomer.ordersCount }} 个订单，{{ formatCurrency(selectedCustomer.revenue) }}
          </a-descriptions-item>
          <a-descriptions-item label="资料完成时间">
            {{ selectedCustomer.profileCompletedAt ? formatDate(selectedCustomer.profileCompletedAt) : '未完成' }}
          </a-descriptions-item>
          <a-descriptions-item label="注册时间">
            {{ formatDate(selectedCustomer.createdAt) }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />
        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="12">
              <a-form-item label="客户状态">
                <a-select v-model:value="customerDraft.status">
                  <a-select-option value="pending">待审核</a-select-option>
                  <a-select-option value="active">正常</a-select-option>
                  <a-select-option value="suspended">已暂停</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="客户等级">
                <a-select v-model:value="customerDraft.tier">
                  <a-select-option value="standard">标准客户</a-select-option>
                  <a-select-option value="silver">银牌客户</a-select-option>
                  <a-select-option value="gold">金牌客户</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="价格组">
                <a-select
                  :value="customerDraft.priceGroupId"
                  @change="handleCustomerPriceGroupChange"
                >
                  <a-select-option v-for="group in priceGroups" :key="group.id" :value="group.id">
                    {{ group.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="月采购量">
                <a-input v-model:value="customerDraft.monthlyPurchase" placeholder="例如 €1.000 - €3.000" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="信用额度">
                <a-input-number
                  v-model:value="customerDraft.creditLimit"
                  style="width: 100%"
                  :min="0"
                  :step="100"
                />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="付款条款">
                <a-input v-model:value="customerDraft.paymentTerms" placeholder="例如 预付银行转账" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>

        <a-space class="admin-drawer-actions">
          <a-button @click="isCustomerDrawerOpen = false">关闭</a-button>
          <a-button :loading="isSavingCustomer" @click="saveSelectedCustomer">保存权限</a-button>
          <a-button
            type="primary"
            :loading="isSavingCustomer"
            :disabled="selectedCustomer.status !== 'pending'"
            @click="approveSelectedCustomer"
          >
            通过审核
          </a-button>
        </a-space>
      </template>
    </a-drawer>

    <a-drawer
      v-model:open="isApprovalDrawerOpen"
      class="admin-data-drawer"
      width="640"
      :title="selectedApproval?.companyName || 'B2B 申请'"
    >
      <template v-if="selectedApproval">
        <a-descriptions bordered size="small" :column="1">
          <a-descriptions-item label="联系人">
            {{ selectedApproval.contactName }} / {{ selectedApproval.email }} / {{ selectedApproval.phone }}
          </a-descriptions-item>
          <a-descriptions-item label="税务资料">
            P.IVA {{ selectedApproval.vatNumber }} - CF {{ selectedApproval.fiscalCode }} - SDI
            {{ selectedApproval.sdi }} - PEC {{ selectedApproval.pec }}
          </a-descriptions-item>
          <a-descriptions-item label="地址">
            注册 {{ selectedApproval.registeredAddress || '未填写' }} / 发货
            {{ selectedApproval.shippingAddress || '未填写' }}
          </a-descriptions-item>
          <a-descriptions-item label="公司">
            {{ selectedApproval.companyType }} / {{ selectedApproval.monthlyPurchase }}
          </a-descriptions-item>
          <a-descriptions-item label="意向分类">
            {{ selectedApproval.interestedCategories.map(labelCategory).join(', ') }}
          </a-descriptions-item>
          <a-descriptions-item label="审核备注">
            {{ selectedApproval.reviewNote || '暂无备注' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />
        <a-form layout="vertical">
          <a-form-item label="分配价格组">
            <a-select v-model:value="selectedPriceGroupId">
              <a-select-option v-for="group in priceGroups" :key="group.id" :value="group.id">
                {{ group.name }} - {{ group.paymentTerms }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>

        <a-space class="admin-drawer-actions">
          <a-button @click="isApprovalDrawerOpen = false">关闭</a-button>
          <a-button
            danger
            :disabled="selectedApproval.status !== 'submitted'"
            @click="reviewApproval(selectedApproval, 'rejected')"
          >
            拒绝
          </a-button>
          <a-button
            type="primary"
            :disabled="selectedApproval.status !== 'submitted'"
            @click="reviewApproval(selectedApproval, 'approved')"
          >
            通过并同步客户
          </a-button>
        </a-space>
      </template>
    </a-drawer>
  </main>
</template>
