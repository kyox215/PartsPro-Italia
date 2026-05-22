<script setup lang="ts">
import { computed, ref } from 'vue'
import { getInventoryItems } from '@/services/admin.service'
import type { InventoryItem } from '@/types/admin'

const inventory = ref(getInventoryItems())
const query = ref('')

const columns = [
  { title: 'SKU / prodotto', dataIndex: 'skuCode', key: 'product', width: 280 },
  { title: 'Brand / modello', dataIndex: 'brand', key: 'brand', width: 180 },
  { title: 'Lotto', dataIndex: 'batchCode', key: 'batch', width: 160 },
  { title: 'Ubicazione', dataIndex: 'location', key: 'location', width: 130 },
  { title: 'Actual', dataIndex: 'actualQty', key: 'actualQty', width: 100 },
  { title: 'Locked', dataIndex: 'lockedQty', key: 'lockedQty', width: 100 },
  { title: 'Available', dataIndex: 'availableQty', key: 'availableQty', width: 110 },
  { title: 'Incoming', dataIndex: 'incomingQty', key: 'incomingQty', width: 110 },
  { title: 'QC / RMA / Difettosi', key: 'exceptions', width: 190 },
  { title: 'Fornitore', dataIndex: 'supplier', key: 'supplier', width: 180 },
]

const filteredInventory = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  if (!normalizedQuery) {
    return inventory.value
  }

  return inventory.value.filter((item) =>
    [item.skuCode, item.productName, item.brand, item.model, item.batchCode, item.location].some(
      (value) => value.toLowerCase().includes(normalizedQuery),
    ),
  )
})

const stats = computed(() => ({
  actual: inventory.value.reduce((total, item) => total + item.actualQty, 0),
  available: inventory.value.reduce((total, item) => total + item.availableQty, 0),
  locked: inventory.value.reduce((total, item) => total + item.lockedQty, 0),
  incoming: inventory.value.reduce((total, item) => total + item.incomingQty, 0),
}))

function refreshInventory() {
  inventory.value = getInventoryItems()
}

function stockColor(item: InventoryItem) {
  if (item.defectiveQty > 0 || item.availableQty === 0) {
    return 'red'
  }

  if (item.availableQty <= 10 || item.qcQty > 0) {
    return 'orange'
  }

  return 'green'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
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
      title="库存管理"
      sub-title="actual、locked、available、incoming、QC、RMA、defective、batch 和 location"
    >
      <template #extra>
        <a-button @click="refreshInventory">刷新</a-button>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="Actual qty" :value="stats.actual" />
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="Available" :value="stats.available" />
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="Locked" :value="stats.locked" />
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="Incoming" :value="stats.incoming" />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="Cerca SKU, prodotto, brand, lotto o ubicazione..."
          allow-clear
        />
        <a-alert
          type="warning"
          show-icon
          message="库存操作规则"
          description="库存变更必须通过库存流水或 RPC，不能直接在表格 UI 中修改。"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredInventory"
        row-key="id"
        :scroll="{ x: 1440 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'product'">
            <strong>{{ record.skuCode }}</strong>
            <span class="admin-muted-line">{{ record.productName }}</span>
            <span class="admin-muted-line">{{ record.qualityGrade }}</span>
          </template>

          <template v-else-if="column.key === 'brand'">
            <strong>{{ record.brand }}</strong>
            <span class="admin-muted-line">{{ record.model }}</span>
          </template>

          <template v-else-if="column.key === 'batch'">
            <a-tag>{{ record.batchCode }}</a-tag>
            <span class="admin-muted-line">Ultimo mov. {{ formatDate(record.lastMovementAt) }}</span>
          </template>

          <template v-else-if="column.key === 'availableQty'">
            <a-tag :color="stockColor(record)">{{ record.availableQty }}</a-tag>
          </template>

          <template v-else-if="column.key === 'incomingQty'">
            <a-tag :color="record.incomingQty > 0 ? 'purple' : 'default'">
              {{ record.incomingQty }}
            </a-tag>
          </template>

          <template v-else-if="column.key === 'exceptions'">
            <a-space wrap>
              <a-tag :color="record.qcQty > 0 ? 'gold' : 'default'">QC {{ record.qcQty }}</a-tag>
              <a-tag :color="record.rmaQty > 0 ? 'blue' : 'default'">RMA {{ record.rmaQty }}</a-tag>
              <a-tag :color="record.defectiveQty > 0 ? 'red' : 'default'">
                DEF {{ record.defectiveQty }}
              </a-tag>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </main>
</template>
