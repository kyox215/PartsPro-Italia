<script setup lang="ts">
import { computed, ref } from 'vue'
import { getStockMovements } from '@/services/admin.service'
import type { StockMovementType } from '@/types/admin'
import { labelMovementType, movementTypeLabels } from '@/utils/adminLabels'

const movements = ref(getStockMovements())
const selectedType = ref<'all' | StockMovementType>('all')

const columns = [
  { title: '时间', dataIndex: 'createdAt', key: 'createdAt', width: 150 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 150 },
  { title: 'SKU', dataIndex: 'skuCode', key: 'skuCode', width: 180 },
  { title: '批次 / 库位', key: 'batch', width: 220 },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100 },
  { title: '关联单据', dataIndex: 'reference', key: 'reference', width: 180 },
  { title: '操作人', dataIndex: 'operator', key: 'operator', width: 220 },
  { title: '备注', dataIndex: 'note', key: 'note' },
]

const movementTypes: StockMovementType[] = [
  'purchase_in',
  'order_lock',
  'ship_out',
  'rma_in',
  'qc_hold',
  'adjustment',
]

const typeOptions = computed(() => [
  { label: `全部 (${movements.value.length})`, value: 'all' },
  ...movementTypes.map((type) => ({
    label: `${movementTypeLabels[type]} (${movements.value.filter((movement) => movement.type === type).length})`,
    value: type,
  })),
])

const filteredMovements = computed(() => {
  if (selectedType.value === 'all') {
    return movements.value
  }

  return movements.value.filter((movement) => movement.type === selectedType.value)
})

function movementColor(type: StockMovementType) {
  const colors: Record<StockMovementType, string> = {
    purchase_in: 'green',
    order_lock: 'gold',
    ship_out: 'blue',
    rma_in: 'purple',
    qc_hold: 'orange',
    adjustment: 'red',
  }

  return colors[type]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="库存流水"
      sub-title="入库、订单锁定、发货、RMA、QC 和库存调整"
    />

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-segmented v-model:value="selectedType" :options="typeOptions" />
        <a-alert
          type="info"
          show-icon
          message="批次可追踪"
          description="每条流水关联 SKU、批次、库位、来源单据和操作人。"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredMovements"
        row-key="id"
        :scroll="{ x: 1280 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>

          <template v-else-if="column.key === 'type'">
            <a-tag :color="movementColor(record.type)">{{ labelMovementType(record.type) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'batch'">
            <a-tag>{{ record.batchCode }}</a-tag>
            <span class="admin-muted-line">{{ record.location }}</span>
          </template>

          <template v-else-if="column.key === 'quantity'">
            <a-tag :color="record.quantity >= 0 ? 'green' : 'red'">
              {{ record.quantity > 0 ? `+${record.quantity}` : record.quantity }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </main>
</template>
