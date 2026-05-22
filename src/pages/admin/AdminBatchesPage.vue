<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchAdminBatches, getAdminBatches } from '@/services/admin.service'
import type { AdminBatch, BatchStatus } from '@/types/admin'

const batches = ref<AdminBatch[]>(getAdminBatches())
const selectedStatus = ref<'all' | BatchStatus>('all')
const isLoading = ref(false)

const columns = [
  { title: 'Lotto', dataIndex: 'batchCode', key: 'batch', width: 240 },
  { title: 'Fornitore / PO', key: 'supplier', width: 260 },
  { title: 'Stato', dataIndex: 'status', key: 'status', width: 130 },
  { title: 'QC', dataIndex: 'qcStatus', key: 'qc', width: 120 },
  { title: 'SKU', dataIndex: 'skuCount', key: 'skuCount', width: 100 },
  { title: 'Ubicazione', dataIndex: 'warehouseLocation', key: 'warehouseLocation', width: 180 },
  { title: 'Compliance batterie', key: 'battery', width: 220 },
  { title: 'Note', dataIndex: 'notes', key: 'notes' },
]

const statusOptions = computed(() => [
  { label: `Tutti (${batches.value.length})`, value: 'all' },
  { label: `Incoming (${batches.value.filter((batch) => batch.status === 'incoming').length})`, value: 'incoming' },
  { label: `QC hold (${batches.value.filter((batch) => batch.status === 'qc_hold').length})`, value: 'qc_hold' },
  { label: `Released (${batches.value.filter((batch) => batch.status === 'released').length})`, value: 'released' },
  { label: `Blocked (${batches.value.filter((batch) => batch.status === 'blocked').length})`, value: 'blocked' },
])

const filteredBatches = computed(() => {
  if (selectedStatus.value === 'all') {
    return batches.value
  }

  return batches.value.filter((batch) => batch.status === selectedStatus.value)
})

const stats = computed(() => ({
  total: batches.value.length,
  battery: batches.value.filter((batch) => batch.isBatteryBatch).length,
  qcHold: batches.value.filter((batch) => batch.status === 'qc_hold').length,
  released: batches.value.filter((batch) => batch.status === 'released').length,
}))

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function statusColor(status: BatchStatus) {
  const colors: Record<BatchStatus, string> = {
    incoming: 'purple',
    qc_hold: 'gold',
    released: 'green',
    blocked: 'red',
  }

  return colors[status]
}

function qcColor(status: 'pending' | 'passed' | 'failed') {
  const colors = {
    pending: 'orange',
    passed: 'green',
    failed: 'red',
  }

  return colors[status]
}

async function loadBatches() {
  isLoading.value = true
  try {
    batches.value = await fetchAdminBatches()
  } finally {
    isLoading.value = false
  }
}

onMounted(loadBatches)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="批次管理"
      sub-title="批次、供应商、QC、MSDS/UN38.3 和货品追踪"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Lotti" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Batterie" :value="stats.battery" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="QC hold" :value="stats.qcHold" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Released" :value="stats.released" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-segmented v-model:value="selectedStatus" :options="statusOptions" />
        <a-alert
          type="warning"
          show-icon
          message="电池安全"
          description="电池批次在销售和发货前必须保存 MSDS 与 UN38.3 文件。"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredBatches"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1280 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'batch'">
            <strong>{{ record.batchCode }}</strong>
            <span class="admin-muted-line">Ricezione {{ formatDate(record.receivedAt) }}</span>
          </template>

          <template v-else-if="column.key === 'supplier'">
            <span>{{ record.supplier }}</span>
            <span class="admin-muted-line">{{ record.purchaseOrder }}</span>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>

          <template v-else-if="column.key === 'qc'">
            <a-tag :color="qcColor(record.qcStatus)">{{ record.qcStatus }}</a-tag>
          </template>

          <template v-else-if="column.key === 'battery'">
            <a-space wrap>
              <a-tag :color="record.isBatteryBatch ? 'red' : 'default'">
                {{ record.isBatteryBatch ? 'Battery batch' : 'No battery' }}
              </a-tag>
              <a-tag v-if="record.msdsUrl">MSDS</a-tag>
              <a-tag v-if="record.un38Url">UN38.3</a-tag>
            </a-space>
            <span v-if="record.msdsUrl" class="admin-muted-line">{{ record.msdsUrl }}</span>
            <span v-if="record.un38Url" class="admin-muted-line">{{ record.un38Url }}</span>
          </template>
        </template>
      </a-table>
    </a-card>
  </main>
</template>
