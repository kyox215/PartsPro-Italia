<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import {
  approveB2BApplication,
  fetchB2BApprovals,
  fetchPriceGroups,
  getB2BApprovals,
  getPriceGroups,
} from '@/services/admin.service'
import type { B2BApproval, B2BApprovalStatus } from '@/types/admin'
import { labelApprovalStatus, labelCategory } from '@/utils/adminLabels'

const approvals = ref(getB2BApprovals())
const priceGroups = ref(getPriceGroups())
const isLoading = ref(false)
const selectedStatus = ref<'all' | B2BApprovalStatus>('submitted')
const selectedPriceGroupId = ref('pg-standard-b2b')
const selectedApproval = ref<B2BApproval | null>(null)
const isDrawerOpen = ref(false)

const columns = [
  { title: '申请', dataIndex: 'companyName', key: 'request', width: 300 },
  { title: '税务资料', key: 'fiscal', width: 260 },
  { title: '采购量 / 分类', key: 'volume', width: 260 },
  { title: '价格组', dataIndex: 'requestedPriceGroupId', key: 'group', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 240 },
]

const statusOptions = computed(() => [
  { label: `全部 (${approvals.value.length})`, value: 'all' },
  { label: `待审核 (${approvals.value.filter((item) => item.status === 'submitted').length})`, value: 'submitted' },
  { label: `已通过 (${approvals.value.filter((item) => item.status === 'approved').length})`, value: 'approved' },
  { label: `已拒绝 (${approvals.value.filter((item) => item.status === 'rejected').length})`, value: 'rejected' },
])

const filteredApprovals = computed(() => {
  if (selectedStatus.value === 'all') {
    return approvals.value
  }

  return approvals.value.filter((approval) => approval.status === selectedStatus.value)
})

async function loadApprovals() {
  isLoading.value = true
  try {
    const [approvalRows, priceGroupRows] = await Promise.all([
      fetchB2BApprovals(),
      fetchPriceGroups(),
    ])
    approvals.value = approvalRows
    priceGroups.value = priceGroupRows
  } finally {
    isLoading.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusColor(status: B2BApprovalStatus) {
  const colors: Record<B2BApprovalStatus, string> = {
    submitted: 'orange',
    approved: 'green',
    rejected: 'red',
  }

  return colors[status]
}

function priceGroupName(priceGroupId: string) {
  return priceGroups.value.find((group) => group.id === priceGroupId)?.name || priceGroupId
}

function openApproval(approval: B2BApproval) {
  selectedApproval.value = approval
  selectedPriceGroupId.value = approval.requestedPriceGroupId
  isDrawerOpen.value = true
}

async function reviewApproval(approval: B2BApproval, status: 'approved' | 'rejected') {
  const actionText = status === 'approved' ? '通过' : '拒绝'

  Modal.confirm({
    title: `确认${actionText} ${approval.companyName}？`,
    content:
      status === 'approved'
        ? `客户将分配到价格组：${priceGroupName(selectedPriceGroupId.value)}。`
        : '该申请会保留为已拒绝记录，便于后续追踪。',
    okText: status === 'approved' ? '通过' : '拒绝',
    cancelText: '取消',
    async onOk() {
      await approveB2BApplication(approval.id, status, selectedPriceGroupId.value)
      await loadApprovals()
      isDrawerOpen.value = false
      message.success(status === 'approved' ? 'B2B 申请已通过。' : 'B2B 申请已拒绝。')
    },
  })
}

onMounted(loadApprovals)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="B2B 审核"
      sub-title="审核开户申请、核对 P.IVA、分配客户等级和价格组"
    />

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-segmented v-model:value="selectedStatus" :options="statusOptions" />
        <a-select v-model:value="selectedPriceGroupId" class="admin-toolbar-search">
          <a-select-option v-for="group in priceGroups" :key="group.id" :value="group.id">
            {{ group.name }}
          </a-select-option>
        </a-select>
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredApprovals"
        :loading="isLoading"
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
            <a-tag :color="statusColor(record.status)">{{ labelApprovalStatus(record.status) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button size="small" @click="openApproval(record)">详情</a-button>
              <a-button
                size="small"
                type="primary"
                :disabled="record.status !== 'submitted'"
                @click="reviewApproval(record, 'approved')"
              >
                通过
              </a-button>
              <a-button
                size="small"
                danger
                :disabled="record.status !== 'submitted'"
                @click="reviewApproval(record, 'rejected')"
              >
                拒绝
              </a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
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
          <a-descriptions-item label="公司">
            {{ selectedApproval.companyType }} / {{ selectedApproval.monthlyPurchase }}
          </a-descriptions-item>
          <a-descriptions-item label="意向分类">
            {{ selectedApproval.interestedCategories.map(labelCategory).join(', ') }}
          </a-descriptions-item>
          <a-descriptions-item label="审核备注">
            {{ selectedApproval.reviewNote }}
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
          <a-button @click="isDrawerOpen = false">关闭</a-button>
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
            通过 B2B
          </a-button>
        </a-space>
      </template>
    </a-drawer>
  </main>
</template>
