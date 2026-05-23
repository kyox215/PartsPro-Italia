<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getInventoryItems } from '@/services/admin.service'
import type { InventoryItem } from '@/types/admin'

const route = useRoute()
const inventory = ref(getInventoryItems())
const query = ref('')

const columns = [
  { title: 'SKU / 商品', dataIndex: 'skuCode', key: 'product', width: 280 },
  { title: '品牌 / 机型', dataIndex: 'brand', key: 'brand', width: 180 },
  { title: '批次', dataIndex: 'batchCode', key: 'batch', width: 160 },
  { title: '库位', dataIndex: 'location', key: 'location', width: 130 },
  { title: '实际', dataIndex: 'actualQty', key: 'actualQty', width: 100 },
  { title: '锁定', dataIndex: 'lockedQty', key: 'lockedQty', width: 100 },
  { title: '可用', dataIndex: 'availableQty', key: 'availableQty', width: 110 },
  { title: '在途', dataIndex: 'incomingQty', key: 'incomingQty', width: 110 },
  { title: 'QC / RMA / 瑕疵', key: 'exceptions', width: 190 },
  { title: '供应商', dataIndex: 'supplier', key: 'supplier', width: 180 },
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

function readRouteQuery(value: unknown) {
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
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
  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

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
      title="库存管理"
      sub-title="实际、锁定、可用、在途、质检、RMA、瑕疵、批次和库位"
    >
      <template #extra>
        <a-button @click="refreshInventory">刷新</a-button>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="实际库存" :value="stats.actual" />
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="可用库存" :value="stats.available" />
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="锁定库存" :value="stats.locked" />
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="在途库存" :value="stats.incoming" />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="搜索 SKU、商品、品牌、批次或库位..."
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
        class="admin-desktop-data-table"
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
            <span class="admin-muted-line">最后流水 {{ formatDate(record.lastMovementAt) }}</span>
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
                瑕疵 {{ record.defectiveQty }}
              </a-tag>
            </a-space>
          </template>
        </template>
      </a-table>

      <div class="admin-mobile-data-list admin-mobile-inventory-list">
        <a-empty v-if="filteredInventory.length === 0" class="admin-mobile-empty" description="暂无库存" />
        <article
          v-for="item in filteredInventory"
          :key="item.id"
          class="admin-mobile-data-card admin-mobile-inventory-card"
        >
          <header>
            <div>
              <strong>{{ item.skuCode }}</strong>
              <span>{{ item.productName }}</span>
            </div>
            <a-tag :color="stockColor(item)">可用 {{ item.availableQty }}</a-tag>
          </header>

          <div class="admin-mobile-data-tags">
            <a-tag color="blue">{{ item.brand }}</a-tag>
            <a-tag>{{ item.model }}</a-tag>
            <a-tag>{{ item.qualityGrade }}</a-tag>
          </div>

          <dl class="admin-mobile-data-grid admin-mobile-inventory-grid">
            <div>
              <dt>批次</dt>
              <dd>{{ item.batchCode }}</dd>
            </div>
            <div>
              <dt>库位</dt>
              <dd>{{ item.location }}</dd>
            </div>
            <div>
              <dt>实际</dt>
              <dd>{{ item.actualQty }}</dd>
            </div>
            <div>
              <dt>锁定</dt>
              <dd>{{ item.lockedQty }}</dd>
            </div>
            <div>
              <dt>在途</dt>
              <dd>{{ item.incomingQty }}</dd>
            </div>
            <div>
              <dt>最后流水</dt>
              <dd>{{ formatDate(item.lastMovementAt) }}</dd>
            </div>
          </dl>

          <div class="admin-mobile-data-tags">
            <a-tag :color="item.qcQty > 0 ? 'gold' : 'default'">QC {{ item.qcQty }}</a-tag>
            <a-tag :color="item.rmaQty > 0 ? 'blue' : 'default'">RMA {{ item.rmaQty }}</a-tag>
            <a-tag :color="item.defectiveQty > 0 ? 'red' : 'default'">
              瑕疵 {{ item.defectiveQty }}
            </a-tag>
            <a-tag>{{ item.supplier }}</a-tag>
          </div>
        </article>
      </div>
    </a-card>
  </main>
</template>
