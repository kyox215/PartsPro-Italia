<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchCustomerDetail } from '@/services/admin.service'
import type {
  AdminOrder,
  AdminOrderStatus,
  B2BApprovalStatus,
  CustomerDetail,
  CustomerStatus,
  CustomerTier,
  PaymentStatus,
  StockRisk,
} from '@/types/admin'
import {
  labelApprovalStatus,
  labelCategory,
  labelCustomerStatus,
  labelCustomerTier,
  labelOrderStatus,
  labelPaymentStatus,
  labelStockRisk,
} from '@/utils/adminLabels'
import { readRouteQuery, withSearchQuery } from '@/utils/adminSearch'

type CustomerDetailTabKey = 'overview' | 'orders' | 'rmas' | 'approvals' | 'business' | 'audit'

const route = useRoute()
const router = useRouter()
const detail = ref<CustomerDetail | null>(null)
const isLoading = ref(false)
const dataError = ref('')
const activeTab = ref<CustomerDetailTabKey>('overview')

const customerId = computed(() => String(route.params.id || ''))
const profile = computed(() => detail.value?.profile || null)
const metrics = computed(() => detail.value?.metrics || null)

const orderColumns = [
  { title: '订单', dataIndex: 'orderNo', key: 'order', width: 260 },
  { title: '状态', key: 'status', width: 210 },
  { title: '金额', key: 'amount', width: 150 },
  { title: '商品行', key: 'lines', width: 420 },
  { title: '日期', dataIndex: 'createdAt', key: 'createdAt', width: 190 },
]

const rmaColumns = [
  { title: 'RMA', dataIndex: 'id', key: 'rma', width: 260 },
  { title: '订单 / SKU', key: 'order', width: 260 },
  { title: '问题', key: 'problem', width: 360 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '日期', dataIndex: 'createdAt', key: 'createdAt', width: 190 },
]

const approvalColumns = [
  { title: '申请', key: 'request', width: 280 },
  { title: '税务资料', key: 'fiscal', width: 280 },
  { title: '采购与分类', key: 'purchase', width: 320 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 140 },
  { title: '日期', dataIndex: 'submittedAt', key: 'submittedAt', width: 190 },
]

const auditColumns = [
  { title: '操作', key: 'action', width: 320 },
  { title: '执行人', dataIndex: 'actorEmail', key: 'actor', width: 220 },
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 190 },
]

const recentOrders = computed(() => detail.value?.orders.slice(0, 5) || [])
const recentRmas = computed(() => detail.value?.rmas.slice(0, 5) || [])
const recentAuditLogs = computed(() => detail.value?.auditLogs.slice(0, 5) || [])

function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(value: string | null) {
  if (!value) {
    return '暂无'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function customerStatusColor(status: CustomerStatus) {
  const colors: Record<CustomerStatus, string> = {
    active: 'green',
    pending: 'orange',
    suspended: 'red',
  }

  return colors[status]
}

function tierColor(tier: CustomerTier) {
  const colors: Record<CustomerTier, string> = {
    standard: 'blue',
    silver: 'purple',
    gold: 'gold',
  }

  return colors[tier]
}

function orderStatusColor(status: AdminOrderStatus) {
  const colors: Record<AdminOrderStatus, string> = {
    submitted: 'orange',
    accepted: 'blue',
    picking: 'purple',
    packed: 'cyan',
    shipped: 'green',
    completed: 'default',
  }

  return colors[status]
}

function paymentStatusColor(status: PaymentStatus) {
  const colors: Record<PaymentStatus, string> = {
    pending: 'orange',
    paid: 'green',
    bank_waiting: 'blue',
    failed: 'red',
  }

  return colors[status]
}

function stockRiskColor(risk: StockRisk) {
  const colors: Record<StockRisk, string> = {
    clear: 'green',
    low: 'orange',
    split: 'blue',
    blocked: 'red',
  }

  return colors[risk]
}

function approvalStatusColor(status: B2BApprovalStatus) {
  const colors: Record<B2BApprovalStatus, string> = {
    submitted: 'orange',
    approved: 'green',
    rejected: 'red',
  }

  return colors[status]
}

function rmaStatusColor(status: string) {
  if (status === 'approved' || status === 'completed') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'in_review') return 'blue'
  return 'orange'
}

function orderLineSummary(order: AdminOrder) {
  const visibleLines = order.lines.slice(0, 3).map((line) => `${line.skuCode} x${line.quantity}`)
  const extraCount = order.lines.length - visibleLines.length

  return extraCount > 0 ? `${visibleLines.join(' / ')} / +${extraCount}` : visibleLines.join(' / ') || '无商品行'
}

function readDetailTab(value: unknown): CustomerDetailTabKey {
  const tab = readRouteQuery(value)

  if (tab === 'orders' || tab === 'rmas' || tab === 'approvals' || tab === 'business' || tab === 'audit') {
    return tab
  }

  return 'overview'
}

function handleTabChange(tab: string | number) {
  const nextTab = readDetailTab(String(tab))
  activeTab.value = nextTab

  const nextQuery = { ...route.query }
  if (nextTab === 'overview') {
    delete nextQuery.tab
  } else {
    nextQuery.tab = nextTab
  }

  router.replace({ query: nextQuery })
}

function jumpToTab(tab: CustomerDetailTabKey) {
  activeTab.value = tab
  router.replace({ query: tab === 'overview' ? withSearchQuery(route.query, 'tab', '') : { ...route.query, tab } })
}

async function loadCustomerDetail() {
  if (!customerId.value) {
    return
  }

  isLoading.value = true
  dataError.value = ''
  try {
    detail.value = await fetchCustomerDetail(customerId.value)
  } catch (error) {
    detail.value = null
    dataError.value = error instanceof Error ? error.message : '无法读取 Supabase 客户详情。'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadCustomerDetail)

watch(
  () => route.params.id,
  () => loadCustomerDetail(),
)

watch(
  () => route.query.tab,
  (value) => {
    activeTab.value = readDetailTab(value)
  },
  { immediate: true },
)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      :title="profile?.companyName || profile?.email || '客户详情'"
      sub-title="客户主档、订单历史、售后、B2B 审核、商务信用和操作审计"
      @back="router.push('/admin/customers')"
    >
      <template #extra>
        <a-space wrap>
          <a-button @click="loadCustomerDetail">刷新</a-button>
          <a-button type="primary" @click="router.push({ name: 'admin-customers', query: { q: profile?.email || '' } })">
            回客户列表
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-alert
      v-if="dataError"
      type="error"
      show-icon
      message="无法读取 Supabase 客户详情"
      :description="dataError"
    />

    <template v-else>
      <a-row :gutter="[16, 16]" class="admin-metric-row">
        <a-col :xs="12" :md="6">
          <a-card><a-statistic title="累计销售" :value="metrics?.revenue || 0" prefix="EUR" /></a-card>
        </a-col>
        <a-col :xs="12" :md="6">
          <a-card><a-statistic title="订单数" :value="metrics?.ordersCount || 0" /></a-card>
        </a-col>
        <a-col :xs="12" :md="6">
          <a-card><a-statistic title="未完成订单" :value="metrics?.openOrdersCount || 0" /></a-card>
        </a-col>
        <a-col :xs="12" :md="6">
          <a-card><a-statistic title="RMA" :value="metrics?.rmaCount || 0" /></a-card>
        </a-col>
      </a-row>

      <a-card class="admin-table-card" :loading="isLoading">
        <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
          <a-tab-pane key="overview" tab="概览">
            <template v-if="detail">
              <a-descriptions bordered size="small" :column="1">
                <a-descriptions-item label="客户状态">
                  <a-space wrap>
                    <a-tag :color="customerStatusColor(detail.profile.status)">
                      {{ labelCustomerStatus(detail.profile.status) }}
                    </a-tag>
                    <a-tag :color="tierColor(detail.profile.tier)">
                      {{ labelCustomerTier(detail.profile.tier) }}
                    </a-tag>
                    <a-tag color="blue">{{ detail.priceGroup?.name || detail.profile.priceGroupId || '未分配价格组' }}</a-tag>
                    <a-tag v-if="detail.profile.archivedAt" color="default">已归档</a-tag>
                  </a-space>
                </a-descriptions-item>
                <a-descriptions-item label="联系人">
                  {{ detail.profile.contactName || '未填写' }} / {{ detail.profile.email }} /
                  {{ detail.profile.phone || '未填写电话' }}
                </a-descriptions-item>
                <a-descriptions-item label="税务资料">
                  P.IVA {{ detail.profile.vatNumber || '未填写' }} / CF
                  {{ detail.profile.fiscalCode || '未填写' }} / SDI {{ detail.profile.sdi || '-' }} / PEC
                  {{ detail.profile.pec || '-' }}
                </a-descriptions-item>
                <a-descriptions-item label="地址">
                  注册 {{ detail.profile.registeredAddress || '未填写' }} / 账单
                  {{ detail.profile.billingAddress || '未填写' }} / 发货
                  {{ detail.profile.shippingAddress || '未填写' }}
                </a-descriptions-item>
                <a-descriptions-item label="商务">
                  信用额度 {{ formatCurrency(detail.profile.creditLimit) }} / 付款条款
                  {{ detail.profile.paymentTerms || '未设置' }} / 月采购
                  {{ detail.profile.monthlyPurchase || '未设置' }}
                </a-descriptions-item>
                <a-descriptions-item label="最近下单">
                  {{ formatDate(detail.metrics.lastOrderAt) }} / 平均客单
                  {{ formatCurrency(detail.metrics.averageOrderValue) }} / 待付款
                  {{ formatCurrency(detail.metrics.pendingPaymentAmount) }}
                </a-descriptions-item>
              </a-descriptions>

              <a-divider />
              <a-row :gutter="[16, 16]">
                <a-col :xs="24" :lg="12">
                  <a-list :data-source="recentOrders" size="small">
                    <template #header>
                      <a-space>
                        <strong>最近订单</strong>
                        <a-button size="small" type="link" @click="jumpToTab('orders')">查看全部</a-button>
                      </a-space>
                    </template>
                    <template #renderItem="{ item }">
                      <a-list-item>
                        <RouterLink :to="`/admin/orders/${item.id}`">{{ item.orderNo }}</RouterLink>
                        <span>{{ formatCurrency(item.totalNet) }} / {{ labelOrderStatus(item.status) }}</span>
                      </a-list-item>
                    </template>
                    <template #emptyText>暂无订单</template>
                  </a-list>
                </a-col>
                <a-col :xs="24" :lg="12">
                  <a-list :data-source="recentRmas" size="small">
                    <template #header>
                      <a-space>
                        <strong>最近 RMA</strong>
                        <a-button size="small" type="link" @click="jumpToTab('rmas')">查看全部</a-button>
                      </a-space>
                    </template>
                    <template #renderItem="{ item }">
                      <a-list-item>
                        <span>{{ item.orderNo }} / {{ item.skuCode }}</span>
                        <a-tag :color="rmaStatusColor(item.status)">{{ item.status }}</a-tag>
                      </a-list-item>
                    </template>
                    <template #emptyText>暂无 RMA</template>
                  </a-list>
                </a-col>
              </a-row>
              <a-list :data-source="recentAuditLogs" size="small">
                <template #header>
                  <a-space>
                    <strong>最近后台操作</strong>
                    <a-button size="small" type="link" @click="jumpToTab('audit')">查看全部</a-button>
                  </a-space>
                </template>
                <template #renderItem="{ item }">
                  <a-list-item>
                    <span>{{ item.summary || item.action }}</span>
                    <span>{{ formatDate(item.createdAt) }} / {{ item.actorEmail || '系统' }}</span>
                  </a-list-item>
                </template>
                <template #emptyText>暂无后台操作记录</template>
              </a-list>
            </template>
          </a-tab-pane>

          <a-tab-pane key="orders" tab="订单记录">
            <a-table :columns="orderColumns" :data-source="detail?.orders || []" row-key="id" :scroll="{ x: 1230 }">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'order'">
                  <RouterLink class="admin-strong-link" :to="`/admin/orders/${record.id}`">
                    {{ record.orderNo }}
                  </RouterLink>
                  <span class="admin-muted-line">{{ record.shippingMethod || '未设置配送' }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-space wrap>
                    <a-tag :color="orderStatusColor(record.status)">{{ labelOrderStatus(record.status) }}</a-tag>
                    <a-tag :color="paymentStatusColor(record.paymentStatus)">
                      {{ labelPaymentStatus(record.paymentStatus) }}
                    </a-tag>
                    <a-tag :color="stockRiskColor(record.stockRisk)">{{ labelStockRisk(record.stockRisk) }}</a-tag>
                  </a-space>
                </template>
                <template v-else-if="column.key === 'amount'">
                  <strong>{{ formatCurrency(record.totalNet) }}</strong>
                  <span class="admin-muted-line">IVA {{ formatCurrency(record.vat) }}</span>
                </template>
                <template v-else-if="column.key === 'lines'">
                  {{ orderLineSummary(record) }}
                </template>
                <template v-else-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="rmas" tab="售后/RMA">
            <a-table :columns="rmaColumns" :data-source="detail?.rmas || []" row-key="id" :scroll="{ x: 1230 }">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'rma'">
                  <strong>{{ record.id }}</strong>
                  <span class="admin-muted-line">数量 {{ record.quantity }} / {{ record.requestedResolution }}</span>
                </template>
                <template v-else-if="column.key === 'order'">
                  <span>{{ record.orderNo }}</span>
                  <span class="admin-muted-line">{{ record.skuCode }}</span>
                </template>
                <template v-else-if="column.key === 'problem'">
                  <strong>{{ record.problemType || '未分类' }}</strong>
                  <span class="admin-muted-line">{{ record.description || '无描述' }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag :color="rmaStatusColor(record.status)">{{ record.status }}</a-tag>
                </template>
                <template v-else-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="approvals" tab="B2B 审核">
            <a-table
              :columns="approvalColumns"
              :data-source="detail?.b2bApplications || []"
              row-key="id"
              :scroll="{ x: 1190 }"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'request'">
                  <strong>{{ record.companyName }}</strong>
                  <span class="admin-muted-line">{{ record.contactName }} / {{ record.email }}</span>
                </template>
                <template v-else-if="column.key === 'fiscal'">
                  <span>P.IVA {{ record.vatNumber || '-' }}</span>
                  <span class="admin-muted-line">SDI {{ record.sdi || '-' }} / PEC {{ record.pec || '-' }}</span>
                </template>
                <template v-else-if="column.key === 'purchase'">
                  <span>{{ record.companyType }} / {{ record.monthlyPurchase }}</span>
                  <span class="admin-muted-line">{{ record.interestedCategories.map(labelCategory).join(', ') }}</span>
                </template>
                <template v-else-if="column.key === 'status'">
                  <a-tag :color="approvalStatusColor(record.status)">{{ labelApprovalStatus(record.status) }}</a-tag>
                  <span class="admin-muted-line">{{ record.reviewNote || '无备注' }}</span>
                </template>
                <template v-else-if="column.key === 'submittedAt'">
                  {{ formatDate(record.submittedAt) }}
                </template>
              </template>
            </a-table>
          </a-tab-pane>

          <a-tab-pane key="business" tab="商务与信用">
            <template v-if="detail">
              <a-descriptions bordered size="small" :column="1">
                <a-descriptions-item label="价格组">
                  {{ detail.priceGroup?.name || detail.profile.priceGroupId || '未分配' }}
                </a-descriptions-item>
                <a-descriptions-item label="价格组说明">
                  {{ detail.priceGroup?.description || '暂无说明' }}
                </a-descriptions-item>
                <a-descriptions-item label="默认毛利">
                  {{ detail.priceGroup ? `${detail.priceGroup.defaultMarginPercent}%` : '未设置' }}
                </a-descriptions-item>
                <a-descriptions-item label="付款条款">
                  {{ detail.profile.paymentTerms || detail.priceGroup?.paymentTerms || '未设置' }}
                </a-descriptions-item>
                <a-descriptions-item label="信用额度">
                  {{ formatCurrency(detail.profile.creditLimit) }}
                </a-descriptions-item>
                <a-descriptions-item label="待付款金额">
                  {{ formatCurrency(detail.metrics.pendingPaymentAmount) }}
                </a-descriptions-item>
                <a-descriptions-item label="后台备注">
                  {{ detail.profile.adminNote || '暂无备注' }}
                </a-descriptions-item>
              </a-descriptions>
            </template>
          </a-tab-pane>

          <a-tab-pane key="audit" tab="操作审计">
            <a-table :columns="auditColumns" :data-source="detail?.auditLogs || []" row-key="id" :scroll="{ x: 900 }">
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'action'">
                  <strong>{{ record.summary || record.action }}</strong>
                  <span class="admin-muted-line">{{ record.action }}</span>
                </template>
                <template v-else-if="column.key === 'actor'">
                  {{ record.actorEmail || '系统' }}
                </template>
                <template v-else-if="column.key === 'createdAt'">
                  {{ formatDate(record.createdAt) }}
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </a-card>
    </template>
  </main>
</template>
