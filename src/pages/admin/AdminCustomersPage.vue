<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  approveB2BApplication,
  approveCustomerAccount,
  archiveCustomer,
  enableCustomerStaffAccess,
  fetchB2BApprovals,
  fetchCustomerAccounts,
  fetchCustomerTimeline,
  fetchPriceGroups,
  restoreCustomer,
  saveCustomerProfileAdmin,
} from '@/services/admin.service'
import type {
  AdminStaffRole,
  B2BApproval,
  B2BApprovalStatus,
  CustomerAccount,
  CustomerAccountPatch,
  CustomerStatus,
  CustomerTier,
  CustomerTimelineItem,
  PriceGroup,
} from '@/types/admin'
import type { StaffPermission } from '@/types/auth'
import { defaultPermissionsForRole, staffPermissionLabels } from '@/types/auth'
import { useAuthStore } from '@/stores/auth.store'
import {
  labelApprovalStatus,
  labelCategory,
  labelCustomerStatus,
  labelCustomerTier,
} from '@/utils/adminLabels'
import { matchesSearchTokens, readRouteQuery, withSearchQuery } from '@/utils/adminSearch'

type CustomerTabKey = 'accounts' | 'new' | 'approvals' | 'archived'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const customers = ref<CustomerAccount[]>([])
const approvals = ref<B2BApproval[]>([])
const priceGroups = ref<PriceGroup[]>([])
const customerTimeline = ref<CustomerTimelineItem[]>([])
const isCustomersLoading = ref(false)
const isApprovalsLoading = ref(false)
const isTimelineLoading = ref(false)
const isSavingCustomer = ref(false)
const isEnablingStaffAccess = ref(false)
const query = ref('')
const approvalQuery = ref('')
const activeTab = ref<CustomerTabKey>('accounts')
const selectedApprovalStatus = ref<'all' | B2BApprovalStatus>('submitted')
const selectedCustomer = ref<CustomerAccount | null>(null)
const selectedApproval = ref<B2BApproval | null>(null)
const selectedPriceGroupId = ref('pg-standard-b2b')
const staffAccessRole = ref<AdminStaffRole>('sales')
const staffAccessPermissions = ref<StaffPermission[]>(defaultPermissionsForRole('sales'))
const allowStaffPermissionManagement = ref(false)
const isCustomerDrawerOpen = ref(false)
const isApprovalDrawerOpen = ref(false)
const customerDataError = ref('')
const approvalDataError = ref('')
const customerDraft = ref<CustomerAccountPatch>({
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  vatNumber: '',
  fiscalCode: '',
  sdi: '',
  pec: '',
  registeredAddress: '',
  billingAddress: '',
  shippingAddress: '',
  status: 'pending',
  tier: 'standard',
  priceGroupId: '',
  monthlyPurchase: '',
  creditLimit: 0,
  paymentTerms: '',
  adminNote: '',
})

const customerColumns = [
  { title: '客户', dataIndex: 'companyName', key: 'customer', width: 310 },
  { title: '税务 / 联系', key: 'fiscal', width: 310 },
  { title: '客户等级', dataIndex: 'tier', key: 'tier', width: 120 },
  { title: '价格组', dataIndex: 'priceGroupId', key: 'priceGroup', width: 180 },
  { title: '采购', key: 'purchase', width: 180 },
  { title: '信用 / 条款', key: 'terms', width: 220 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 150 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 120 },
]

const approvalColumns = [
  { title: '申请', dataIndex: 'companyName', key: 'request', width: 300 },
  { title: '税务资料', key: 'fiscal', width: 260 },
  { title: '采购量 / 分类', key: 'volume', width: 260 },
  { title: '价格组', dataIndex: 'requestedPriceGroupId', key: 'group', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 240 },
]

const staffRoleOptions = computed(() =>
  (['sales', 'warehouse', 'purchasing', 'admin'] as AdminStaffRole[]).map((role) => ({
    label: role === 'sales' ? '销售' : role === 'warehouse' ? '仓库' : role === 'purchasing' ? '采购' : '管理员',
    value: role,
    disabled: role === 'admin' && authStore.role !== 'admin',
  })),
)

const customerStaffPermissionOptions = computed(() =>
  (Object.keys(staffPermissionLabels) as StaffPermission[])
    .filter(
      (permission) =>
        permission !== 'staff_settings.manage' &&
        (authStore.role === 'admin' || !permission.startsWith('staff_settings.')),
    )
    .map((permission) => ({
      label: staffPermissionLabels[permission],
      value: permission,
    })),
)

const activeCustomers = computed(() => customers.value.filter((customer) => !customer.archivedAt))
const archivedCustomers = computed(() => customers.value.filter((customer) => customer.archivedAt))
const newCustomers = computed(() => activeCustomers.value.filter(isNewCustomer))
const customerRowsForTab = computed(() => {
  if (activeTab.value === 'new') return newCustomers.value
  if (activeTab.value === 'archived') return archivedCustomers.value
  return activeCustomers.value
})

const filteredVisibleCustomers = computed(() => filterCustomers(customerRowsForTab.value, query.value))
const drawerOrderTimelineItems = computed(() => customerTimeline.value.filter((item) => item.type === 'order').slice(0, 5))
const drawerRmaTimelineItems = computed(() => customerTimeline.value.filter((item) => item.type === 'rma').slice(0, 5))
const drawerAuditTimelineItems = computed(() => customerTimeline.value.filter((item) => item.type === 'audit').slice(0, 5))

const approvalStatusOptions = computed(() => [
  { label: `全部 (${approvals.value.length})`, value: 'all' },
  { label: `待审核 (${approvals.value.filter((item) => item.status === 'submitted').length})`, value: 'submitted' },
  { label: `已通过 (${approvals.value.filter((item) => item.status === 'approved').length})`, value: 'approved' },
  { label: `已拒绝 (${approvals.value.filter((item) => item.status === 'rejected').length})`, value: 'rejected' },
])

const filteredApprovals = computed(() => {
  const statusFiltered =
    selectedApprovalStatus.value === 'all'
      ? approvals.value
      : approvals.value.filter((approval) => approval.status === selectedApprovalStatus.value)

  if (!approvalQuery.value.trim()) {
    return statusFiltered
  }

  return statusFiltered.filter((approval) =>
    matchesSearchTokens(
      [
        approval.companyName,
        approval.contactName,
        approval.email,
        approval.phone,
        approval.vatNumber,
        approval.fiscalCode,
        approval.sdi,
        approval.pec,
        approval.companyType,
        approval.monthlyPurchase,
        approval.interestedCategories,
        approval.interestedCategories.map(labelCategory),
        approval.paymentNeeds,
        approval.status,
        labelApprovalStatus(approval.status),
        approval.requestedPriceGroupId,
        priceGroupName(approval.requestedPriceGroupId),
        approval.registeredAddress,
        approval.shippingAddress,
        approval.reviewNote,
      ],
      approvalQuery.value,
    ),
  )
})

const stats = computed(() => ({
  total: activeCustomers.value.length,
  active: activeCustomers.value.filter((customer) => customer.status === 'active').length,
  pendingCustomers: newCustomers.value.length,
  archived: archivedCustomers.value.length,
  pendingApprovals: approvals.value.filter((approval) => approval.status === 'submitted').length,
  revenue: activeCustomers.value.reduce((total, customer) => total + customer.revenue, 0),
}))

const customerSearchPlaceholder = computed(() => {
  if (activeTab.value === 'new') return '搜索新用户邮箱、姓名、电话、P.IVA、备注...'
  if (activeTab.value === 'archived') return '搜索归档客户、邮箱、归档原因、备注...'
  return '搜索公司、联系人、邮箱、电话、P.IVA、SDI、PEC、价格组...'
})

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

function priceGroupName(priceGroupId: string | undefined) {
  return priceGroupId ? priceGroups.value.find((group) => group.id === priceGroupId)?.name || priceGroupId : '未分配'
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : '无法读取 Supabase 真实数据。'
}

function isNewCustomer(customer: CustomerAccount) {
  return customer.status === 'pending' && !customer.profileCompletedAt
}

function filterCustomers(rows: CustomerAccount[], value: string) {
  if (!value.trim()) {
    return rows
  }

  return rows.filter((customer) =>
    matchesSearchTokens(
      [
        customer.companyName,
        customer.contactName,
        customer.email,
        customer.phone,
        customer.vatNumber,
        customer.fiscalCode,
        customer.sdi,
        customer.pec,
        customer.status,
        labelCustomerStatus(customer.status),
        customer.tier,
        labelCustomerTier(customer.tier),
        customer.priceGroupId,
        priceGroupName(customer.priceGroupId),
        customer.monthlyPurchase,
        customer.ordersCount,
        customer.revenue,
        customer.paymentTerms,
        customer.creditLimit,
        customer.registeredAddress,
        customer.billingAddress,
        customer.shippingAddress,
        customer.adminNote,
        customer.archiveReason,
      ],
      value,
    ),
  )
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
    companyName: customer.companyName,
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    vatNumber: customer.vatNumber,
    fiscalCode: customer.fiscalCode,
    sdi: customer.sdi,
    pec: customer.pec,
    registeredAddress: customer.registeredAddress,
    billingAddress: customer.billingAddress,
    shippingAddress: customer.shippingAddress,
    status: customer.status,
    tier: customer.tier,
    priceGroupId: customer.priceGroupId || priceGroups.value[0]?.id || '',
    monthlyPurchase: customer.monthlyPurchase,
    creditLimit: customer.creditLimit,
    paymentTerms: customer.paymentTerms,
    adminNote: customer.adminNote,
  }
}

function syncStaffAccessDraft() {
  staffAccessRole.value = 'sales'
  staffAccessPermissions.value = defaultPermissionsForRole('sales')
  allowStaffPermissionManagement.value = false
}

function normalizeStaffAccessRole(value: string | number): AdminStaffRole {
  const role = String(value)
  return role === 'warehouse' || role === 'purchasing' || role === 'admin' ? role : 'sales'
}

function handleStaffAccessRoleChange(value: string | number) {
  const nextRole = normalizeStaffAccessRole(value)
  staffAccessRole.value = nextRole
  staffAccessPermissions.value = defaultPermissionsForRole(nextRole)
  allowStaffPermissionManagement.value = nextRole === 'admin'
}

function buildStaffAccessPermissions() {
  const permissions = new Set(staffAccessPermissions.value)

  if (allowStaffPermissionManagement.value) {
    permissions.add('staff_settings.view')
    permissions.add('staff_settings.manage')
  }

  return Array.from(permissions)
}

function buildCustomerPatch(): CustomerAccountPatch {
  return {
    companyName: customerDraft.value.companyName || '',
    contactName: customerDraft.value.contactName || '',
    email: customerDraft.value.email || '',
    phone: customerDraft.value.phone || '',
    vatNumber: customerDraft.value.vatNumber || '',
    fiscalCode: customerDraft.value.fiscalCode || '',
    sdi: customerDraft.value.sdi || '',
    pec: customerDraft.value.pec || '',
    registeredAddress: customerDraft.value.registeredAddress || '',
    billingAddress: customerDraft.value.billingAddress || '',
    shippingAddress: customerDraft.value.shippingAddress || '',
    status: customerDraft.value.status || 'pending',
    tier: customerDraft.value.tier || 'standard',
    priceGroupId: customerDraft.value.priceGroupId || '',
    monthlyPurchase: customerDraft.value.monthlyPurchase || '',
    creditLimit: customerDraft.value.creditLimit || 0,
    paymentTerms: customerDraft.value.paymentTerms || '',
    adminNote: customerDraft.value.adminNote || '',
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

function readTabQuery(value: unknown): CustomerTabKey {
  const tab = readRouteQuery(value)
  if (tab === 'new' || tab === 'approvals' || tab === 'archived') {
    return tab
  }

  return 'accounts'
}

function handleTabChange(tab: string | number) {
  const nextTab = tab === 'new' || tab === 'approvals' || tab === 'archived' ? tab : 'accounts'
  activeTab.value = nextTab

  const nextQuery = { ...route.query }
  if (nextTab === 'accounts') {
    delete nextQuery.tab
  } else {
    nextQuery.tab = nextTab
  }

  router.replace({ query: nextQuery })
}

function syncCustomerSearch(value: string) {
  router.replace({ query: withSearchQuery(route.query, 'q', value) })
}

function syncApprovalSearch(value: string) {
  router.replace({
    query: {
      ...withSearchQuery(route.query, 'approvalQ', value, ['q']),
      tab: 'approvals',
    },
  })
}

function handleCustomerSearch(value: string) {
  query.value = value
  syncCustomerSearch(value)
}

function handleApprovalSearch(value: string) {
  approvalQuery.value = value
  syncApprovalSearch(value)
}

function handleCustomerSearchChange(event: Event) {
  const value = event.target instanceof HTMLInputElement ? event.target.value : query.value

  if (!value.trim()) {
    syncCustomerSearch('')
  }
}

function handleApprovalSearchChange(event: Event) {
  const value = event.target instanceof HTMLInputElement ? event.target.value : approvalQuery.value

  if (!value.trim()) {
    syncApprovalSearch('')
  }
}

async function loadCustomerTimeline(customer: CustomerAccount) {
  isTimelineLoading.value = true
  customerTimeline.value = []
  try {
    customerTimeline.value = await fetchCustomerTimeline(customer)
  } catch (error) {
    customerTimeline.value = []
    console.warn('[PartsPro] customer timeline failed', error)
  } finally {
    isTimelineLoading.value = false
  }
}

async function openCustomer(customer: CustomerAccount) {
  selectedCustomer.value = customer
  syncCustomerDraft(customer)
  syncStaffAccessDraft()
  isCustomerDrawerOpen.value = true
  await loadCustomerTimeline(customer)
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

async function refreshCustomerWorkspace() {
  await Promise.all([loadCustomers(), loadApprovals()])
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
    const savedCustomer = await saveCustomerProfileAdmin(selectedCustomer.value.id, buildCustomerPatch())
    replaceCustomer(savedCustomer)
    await loadCustomerTimeline(savedCustomer)
    message.success('客户主数据已保存。')
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
        await loadCustomerTimeline(savedCustomer)
        message.success('客户已通过审核。')
      } catch (error) {
        message.error(errorMessage(error))
      } finally {
        isSavingCustomer.value = false
      }
    },
  })
}

function enableSelectedCustomerStaffAccess() {
  if (!selectedCustomer.value) {
    return
  }

  const customer = selectedCustomer.value

  if (!customer.userId) {
    message.warning('该客户尚未绑定登录账号，不能开通后台员工。')
    return
  }

  Modal.confirm({
    title: `为 ${customer.companyName || customer.email} 开通后台员工？`,
    content: `将分配 ${staffAccessRole.value} 岗位与 ${buildStaffAccessPermissions().length} 项功能权限。`,
    okText: '开通 / 更新',
    cancelText: '取消',
    async onOk() {
      isEnablingStaffAccess.value = true
      try {
        await enableCustomerStaffAccess(
          customer.id,
          staffAccessRole.value,
          buildStaffAccessPermissions(),
        )
        await loadCustomerTimeline(customer)
        message.success('后台员工权限已开通。')
      } catch (error) {
        message.error(errorMessage(error))
      } finally {
        isEnablingStaffAccess.value = false
      }
    },
  })
}

function archiveSelectedCustomer() {
  if (!selectedCustomer.value) return

  const customer = selectedCustomer.value
  Modal.confirm({
    title: `归档 ${customer.companyName || customer.email}？`,
    content: `该客户有 ${customer.ordersCount} 个订单，历史订单、RMA、库存流水和销售额不会删除。归档后客户前台资料不再作为活跃客户使用。`,
    okText: '归档客户',
    cancelText: '取消',
    async onOk() {
      isSavingCustomer.value = true
      try {
        const savedCustomer = await archiveCustomer(customer.id, '后台客户管理手动归档')
        if (savedCustomer) replaceCustomer(savedCustomer)
        await loadCustomers()
        message.success('客户已归档。')
      } catch (error) {
        message.error(errorMessage(error))
      } finally {
        isSavingCustomer.value = false
      }
    },
  })
}

function restoreSelectedCustomer() {
  if (!selectedCustomer.value) return

  const customer = selectedCustomer.value
  Modal.confirm({
    title: `恢复 ${customer.companyName || customer.email}？`,
    content: '恢复后客户会重新回到客户主数据，是否能下单仍由客户状态和权限决定。',
    okText: '恢复客户',
    cancelText: '取消',
    async onOk() {
      isSavingCustomer.value = true
      try {
        const savedCustomer = await restoreCustomer(customer.id)
        if (savedCustomer) replaceCustomer(savedCustomer)
        await loadCustomers()
        message.success('客户已恢复。')
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
      await refreshCustomerWorkspace()
      isApprovalDrawerOpen.value = false
      message.success(status === 'approved' ? 'B2B 申请已通过，客户主数据已同步。' : 'B2B 申请已拒绝。')
    },
  })
}

function timelineDescription(item: CustomerTimelineItem) {
  const amount = item.amount === undefined ? '' : ` / ${formatCurrency(item.amount)}`
  return `${formatDate(item.createdAt)} / ${item.description}${amount}`
}

function openCustomerDetail(customer = selectedCustomer.value) {
  if (!customer) {
    return
  }

  router.push(`/admin/customers/${customer.id}`)
}

onMounted(async () => {
  await refreshCustomerWorkspace()
})

watch(
  () => route.query.q,
  (value) => {
    query.value = readRouteQuery(value)
  },
  { immediate: true },
)

watch(
  () => [route.query.approvalQ, route.query.q, route.query.tab],
  ([approvalValue, legacyValue, tabValue]) => {
    const directApprovalQuery = readRouteQuery(approvalValue)
    const legacyApprovalQuery = readTabQuery(tabValue) === 'approvals' ? readRouteQuery(legacyValue) : ''
    approvalQuery.value = directApprovalQuery || legacyApprovalQuery
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

watch(query, (value, previousValue) => {
  if (!value.trim() && previousValue.trim() && readRouteQuery(route.query.q)) {
    syncCustomerSearch('')
  }
})

watch(approvalQuery, (value, previousValue) => {
  const hasLegacyApprovalQuery =
    readTabQuery(route.query.tab) === 'approvals' && Boolean(readRouteQuery(route.query.q))
  const hasApprovalQuery = Boolean(readRouteQuery(route.query.approvalQ)) || hasLegacyApprovalQuery

  if (!value.trim() && previousValue.trim() && hasApprovalQuery) {
    syncApprovalSearch('')
  }
})
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="客户管理"
      sub-title="真实客户主数据、新用户审批、B2B 审核、权限、信用和客户时间线"
    >
      <template #extra>
        <a-button @click="refreshCustomerWorkspace">刷新</a-button>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="客户总数" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="正常客户" :value="stats.active" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="新用户待审核" :value="stats.pendingCustomers" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="归档客户" :value="stats.archived" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
        <a-tab-pane key="accounts" tab="客户主数据" />
        <a-tab-pane key="new" tab="新用户待审核" />
        <a-tab-pane key="approvals" tab="B2B 审核" />
        <a-tab-pane key="archived" tab="归档客户" />
      </a-tabs>

      <template v-if="activeTab !== 'approvals'">
        <div class="admin-toolbar">
          <a-input-search
            v-model:value="query"
            class="admin-toolbar-search"
            :placeholder="customerSearchPlaceholder"
            allow-clear
            @search="handleCustomerSearch"
            @change="handleCustomerSearchChange"
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
            description="Google 登录、邮箱注册和 B2B 审核同步后的客户都会在这里以数据库状态展示。"
          />
        </div>

        <a-table
          class="admin-desktop-data-table"
          :columns="customerColumns"
          :data-source="filteredVisibleCustomers"
          :loading="isCustomersLoading"
          row-key="id"
          :scroll="{ x: 1490 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'customer'">
              <strong>{{ record.companyName || '未完善公司资料' }}</strong>
              <a-tag v-if="isNewCustomer(record)" color="orange">新用户</a-tag>
              <a-tag v-if="record.archivedAt" color="default">已归档</a-tag>
              <span class="admin-muted-line">{{ record.contactName || '未填写联系人' }} / {{ record.email }}</span>
              <span class="admin-muted-line">{{ record.phone || '未填写电话' }}</span>
              <span v-if="record.adminNote" class="admin-muted-line">备注 {{ record.adminNote }}</span>
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
              <span v-if="record.archivedAt" class="admin-muted-line">
                {{ formatDate(record.archivedAt) }}
              </span>
            </template>

            <template v-else-if="column.key === 'actions'">
              <a-button size="small" type="primary" ghost @click="openCustomer(record)">
                {{ record.status === 'pending' ? '审批' : '详情' }}
              </a-button>
            </template>
          </template>
        </a-table>

        <div class="admin-mobile-data-list admin-mobile-customer-list">
          <a-empty
            v-if="filteredVisibleCustomers.length === 0"
            class="admin-mobile-empty"
            description="暂无客户"
          />
          <article
            v-for="customer in filteredVisibleCustomers"
            :key="customer.id"
            class="admin-mobile-data-card admin-mobile-customer-card"
          >
            <header>
              <div>
                <strong>{{ customer.companyName || '未完善公司资料' }}</strong>
                <a-tag v-if="isNewCustomer(customer)" color="orange">新用户</a-tag>
                <a-tag v-if="customer.archivedAt" color="default">已归档</a-tag>
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
                <dd>{{ formatCurrency(customer.revenue) }} / {{ customer.ordersCount }} 单</dd>
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
      </template>

      <template v-else>
        <div class="admin-toolbar">
          <a-input-search
            v-model:value="approvalQuery"
            class="admin-toolbar-search"
            placeholder="搜索申请公司、联系人、邮箱、电话、P.IVA、采购量、价格组..."
            allow-clear
            @search="handleApprovalSearch"
            @change="handleApprovalSearchChange"
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
      </template>
    </a-card>

    <a-drawer
      v-model:open="isCustomerDrawerOpen"
      class="admin-data-drawer"
      width="760"
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
            注册 {{ selectedCustomer.registeredAddress || '未填写' }} / 账单
            {{ selectedCustomer.billingAddress || '未填写' }} / 发货
            {{ selectedCustomer.shippingAddress || '未填写' }}
          </a-descriptions-item>
          <a-descriptions-item label="历史采购">
            {{ selectedCustomer.ordersCount }} 个订单，{{ formatCurrency(selectedCustomer.revenue) }}，最近
            {{ formatDate(selectedCustomer.lastOrderAt) }}
          </a-descriptions-item>
          <a-descriptions-item v-if="selectedCustomer.archivedAt" label="归档">
            {{ formatDate(selectedCustomer.archivedAt) }} / {{ selectedCustomer.archiveReason || '未填写原因' }}
          </a-descriptions-item>
        </a-descriptions>

        <a-divider />
        <a-form layout="vertical">
          <a-row :gutter="[12, 0]">
            <a-col :xs="24" :md="12">
              <a-form-item label="公司名称">
                <a-input v-model:value="customerDraft.companyName" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="联系人">
                <a-input v-model:value="customerDraft.contactName" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="邮箱">
                <a-input v-model:value="customerDraft.email" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="电话">
                <a-input v-model:value="customerDraft.phone" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="P.IVA">
                <a-input v-model:value="customerDraft.vatNumber" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="Codice Fiscale">
                <a-input v-model:value="customerDraft.fiscalCode" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="SDI">
                <a-input v-model:value="customerDraft.sdi" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="PEC">
                <a-input v-model:value="customerDraft.pec" />
              </a-form-item>
            </a-col>
            <a-col :xs="24">
              <a-form-item label="注册地址">
                <a-input v-model:value="customerDraft.registeredAddress" />
              </a-form-item>
            </a-col>
            <a-col :xs="24">
              <a-form-item label="账单地址">
                <a-input v-model:value="customerDraft.billingAddress" />
              </a-form-item>
            </a-col>
            <a-col :xs="24">
              <a-form-item label="发货地址">
                <a-input v-model:value="customerDraft.shippingAddress" />
              </a-form-item>
            </a-col>
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
                <a-select :value="customerDraft.priceGroupId" @change="handleCustomerPriceGroupChange">
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
                <a-input-number v-model:value="customerDraft.creditLimit" style="width: 100%" :min="0" :step="100" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="付款条款">
                <a-input v-model:value="customerDraft.paymentTerms" placeholder="例如 预付银行转账" />
              </a-form-item>
            </a-col>
            <a-col :xs="24">
              <a-form-item label="后台备注">
                <a-textarea v-model:value="customerDraft.adminNote" :rows="3" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>

        <a-divider />
        <section class="admin-staff-access-panel">
          <header class="admin-section-heading">
            <div>
              <h2>后台员工开通</h2>
              <p>客户账号绑定登录用户后，可以从这里开通后台岗位和功能权限。</p>
            </div>
          </header>

          <a-alert
            v-if="!authStore.canManageStaffPermissions"
            type="warning"
            show-icon
            message="当前账号没有员工权限管理权限"
            description="需要 staff_settings.manage 后，才能为客户账号开通后台员工。"
          />
          <a-alert
            v-else-if="!selectedCustomer.userId"
            type="warning"
            show-icon
            message="该客户尚未绑定登录账号"
            description="请先让客户完成邮箱或 Google 登录绑定，再开通后台员工。"
          />
          <a-form v-else layout="vertical" class="admin-staff-access-form">
            <a-row :gutter="[12, 0]">
              <a-col :xs="24" :md="8">
                <a-form-item label="岗位角色">
                  <a-select :value="staffAccessRole" @change="handleStaffAccessRoleChange">
                    <a-select-option
                      v-for="role in staffRoleOptions"
                      :key="role.value"
                      :value="role.value"
                      :disabled="role.disabled"
                    >
                      {{ role.label }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="16">
                <a-form-item label="初始功能权限包">
                  <a-checkbox-group
                    v-model:value="staffAccessPermissions"
                    class="admin-permission-checks"
                    :options="customerStaffPermissionOptions"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24">
                <a-checkbox
                  v-model:checked="allowStaffPermissionManagement"
                  :disabled="authStore.role !== 'admin' || staffAccessRole === 'admin'"
                >
                  允许管理员工权限
                </a-checkbox>
                <span class="admin-muted-line">
                  非超级管理员只能分配普通业务权限；管理员角色默认拥有全部权限。
                </span>
              </a-col>
            </a-row>
            <a-button
              type="primary"
              ghost
              :loading="isEnablingStaffAccess"
              @click="enableSelectedCustomerStaffAccess"
            >
              开通 / 更新后台员工
            </a-button>
          </a-form>
        </section>

        <a-divider />
        <a-row :gutter="[16, 16]">
          <a-col :xs="24" :lg="12">
            <a-list :data-source="drawerOrderTimelineItems" :loading="isTimelineLoading" size="small">
              <template #header>
                <strong>最近订单</strong>
              </template>
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta :description="timelineDescription(item)">
                    <template #title>
                      <RouterLink v-if="item.targetRoute" :to="item.targetRoute">{{ item.title }}</RouterLink>
                      <span v-else>{{ item.title }}</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
              <template #emptyText>暂无订单记录</template>
            </a-list>
          </a-col>

          <a-col :xs="24" :lg="12">
            <a-list :data-source="drawerRmaTimelineItems" :loading="isTimelineLoading" size="small">
              <template #header>
                <strong>最近 RMA</strong>
              </template>
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta :description="timelineDescription(item)">
                    <template #title>
                      <RouterLink v-if="item.targetRoute" :to="item.targetRoute">{{ item.title }}</RouterLink>
                      <span v-else>{{ item.title }}</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
              <template #emptyText>暂无 RMA 记录</template>
            </a-list>
          </a-col>

          <a-col :xs="24">
            <a-list :data-source="drawerAuditTimelineItems" :loading="isTimelineLoading" size="small">
              <template #header>
                <strong>最近后台操作</strong>
              </template>
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta :description="timelineDescription(item)">
                    <template #title>
                      <RouterLink v-if="item.targetRoute" :to="item.targetRoute">{{ item.title }}</RouterLink>
                      <span v-else>{{ item.title }}</span>
                    </template>
                  </a-list-item-meta>
                </a-list-item>
              </template>
              <template #emptyText>暂无后台操作记录</template>
            </a-list>
          </a-col>
        </a-row>

        <a-space class="admin-drawer-actions" wrap>
          <a-button @click="isCustomerDrawerOpen = false">关闭</a-button>
          <a-button @click="openCustomerDetail()">查看完整详情</a-button>
          <a-button v-if="selectedCustomer.archivedAt" type="primary" :loading="isSavingCustomer" @click="restoreSelectedCustomer">
            恢复客户
          </a-button>
          <a-button v-else danger :loading="isSavingCustomer" @click="archiveSelectedCustomer">
            归档客户
          </a-button>
          <a-button :loading="isSavingCustomer" @click="saveSelectedCustomer">保存主数据</a-button>
          <a-button
            type="primary"
            :loading="isSavingCustomer"
            :disabled="selectedCustomer.status !== 'pending' || Boolean(selectedCustomer.archivedAt)"
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
