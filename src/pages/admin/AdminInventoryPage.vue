<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  fetchAdminBatches,
  fetchInventoryItems,
  fetchStockMovements,
  getAdminBatches,
  getInventoryItems,
  getStockMovements,
} from '@/services/admin.service'
import type { AdminBatch, BatchStatus, InventoryItem, StockMovementType } from '@/types/admin'
import {
  labelBatchStatus,
  labelMovementType,
  labelQcStatus,
  movementTypeLabels,
} from '@/utils/adminLabels'

type InventoryTabKey = 'stock' | 'batches' | 'movements'

const route = useRoute()
const router = useRouter()
const inventory = ref(getInventoryItems())
const batches = ref<AdminBatch[]>(getAdminBatches())
const movements = ref(getStockMovements())
const query = ref('')
const activeTab = ref<InventoryTabKey>('stock')
const selectedBatchStatus = ref<'all' | BatchStatus>('all')
const selectedMovementType = ref<'all' | StockMovementType>('all')
const isInventoryLoading = ref(false)
const isBatchesLoading = ref(false)
const isMovementsLoading = ref(false)

const inventoryColumns = [
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

const batchColumns = [
  { title: '批次', dataIndex: 'batchCode', key: 'batch', width: 240 },
  { title: '供应商 / 采购单', key: 'supplier', width: 260 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 130 },
  { title: 'QC', dataIndex: 'qcStatus', key: 'qc', width: 120 },
  { title: 'SKU', dataIndex: 'skuCount', key: 'skuCount', width: 100 },
  { title: '库位', dataIndex: 'warehouseLocation', key: 'warehouseLocation', width: 180 },
  { title: '电池合规', key: 'battery', width: 220 },
  { title: '备注', dataIndex: 'notes', key: 'notes' },
]

const movementColumns = [
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

const batchStatusOptions = computed(() => [
  { label: `全部 (${batches.value.length})`, value: 'all' },
  { label: `在途 (${batches.value.filter((batch) => batch.status === 'incoming').length})`, value: 'incoming' },
  { label: `质检暂挂 (${batches.value.filter((batch) => batch.status === 'qc_hold').length})`, value: 'qc_hold' },
  { label: `已放行 (${batches.value.filter((batch) => batch.status === 'released').length})`, value: 'released' },
  { label: `已阻塞 (${batches.value.filter((batch) => batch.status === 'blocked').length})`, value: 'blocked' },
])

const movementTypeOptions = computed(() => [
  { label: `全部 (${movements.value.length})`, value: 'all' },
  ...movementTypes.map((type) => ({
    label: `${movementTypeLabels[type]} (${movements.value.filter((movement) => movement.type === type).length})`,
    value: type,
  })),
])

const filteredInventory = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  if (!normalizedQuery) {
    return inventory.value
  }

  return inventory.value.filter((item) =>
    [item.skuCode, item.productName, item.brand, item.model, item.batchCode, item.location, item.supplier].some(
      (value) => value.toLowerCase().includes(normalizedQuery),
    ),
  )
})

const filteredBatches = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()
  const statusFiltered =
    selectedBatchStatus.value === 'all'
      ? batches.value
      : batches.value.filter((batch) => batch.status === selectedBatchStatus.value)

  if (!normalizedQuery) {
    return statusFiltered
  }

  return statusFiltered.filter((batch) =>
    [
      batch.batchCode,
      batch.supplier,
      batch.purchaseOrder,
      batch.warehouseLocation,
      batch.notes,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  )
})

const filteredMovements = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()
  const typeFiltered =
    selectedMovementType.value === 'all'
      ? movements.value
      : movements.value.filter((movement) => movement.type === selectedMovementType.value)

  if (!normalizedQuery) {
    return typeFiltered
  }

  return typeFiltered.filter((movement) =>
    [
      movement.skuCode,
      movement.batchCode,
      movement.location,
      movement.reference,
      movement.operator,
      movement.note,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  )
})

const stats = computed(() => ({
  actual: inventory.value.reduce((total, item) => total + item.actualQty, 0),
  available: inventory.value.reduce((total, item) => total + item.availableQty, 0),
  batches: batches.value.length,
  movements: movements.value.length,
}))

function readRouteQuery(value: unknown) {
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
}

function readTabQuery(value: unknown): InventoryTabKey {
  const tab = readRouteQuery(value)

  if (tab === 'batches' || tab === 'movements') {
    return tab
  }

  return 'stock'
}

function handleTabChange(tab: string | number) {
  const nextTab = tab === 'batches' || tab === 'movements' ? tab : 'stock'
  activeTab.value = nextTab

  const nextQuery = { ...route.query }
  if (nextTab === 'stock') {
    delete nextQuery.tab
  } else {
    nextQuery.tab = nextTab
  }

  router.replace({ query: nextQuery })
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

function batchStatusColor(status: BatchStatus) {
  const colors: Record<BatchStatus, string> = {
    incoming: 'purple',
    qc_hold: 'gold',
    released: 'green',
    blocked: 'red',
  }

  return colors[status]
}

function qcColor(status: AdminBatch['qcStatus']) {
  const colors: Record<AdminBatch['qcStatus'], string> = {
    pending: 'orange',
    passed: 'green',
    failed: 'red',
  }

  return colors[status]
}

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

function formatDate(value: string | null) {
  if (!value) {
    return '未记录'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function loadInventory() {
  isInventoryLoading.value = true
  try {
    inventory.value = await fetchInventoryItems()
  } finally {
    isInventoryLoading.value = false
  }
}

async function loadBatches() {
  isBatchesLoading.value = true
  try {
    batches.value = await fetchAdminBatches()
  } finally {
    isBatchesLoading.value = false
  }
}

async function loadMovements() {
  isMovementsLoading.value = true
  try {
    movements.value = await fetchStockMovements()
  } finally {
    isMovementsLoading.value = false
  }
}

async function refreshInventoryWorkspace() {
  await Promise.all([loadInventory(), loadBatches(), loadMovements()])
}

onMounted(refreshInventoryWorkspace)

watch(
  () => route.query.q,
  (value) => {
    query.value = readRouteQuery(value)
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
      title="库存管理"
      sub-title="库存总览、批次、库存流水、QC、RMA、瑕疵、供应商和库位"
    >
      <template #extra>
        <a-button @click="refreshInventoryWorkspace">刷新</a-button>
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
          <a-statistic title="批次数" :value="stats.batches" />
        </a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card>
          <a-statistic title="流水记录" :value="stats.movements" />
        </a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
        <a-tab-pane key="stock" tab="库存总览">
          <div class="admin-toolbar">
            <a-input-search
              v-model:value="query"
              class="admin-toolbar-search"
              placeholder="搜索 SKU、商品、品牌、批次、库位或供应商..."
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
            :columns="inventoryColumns"
            :data-source="filteredInventory"
            :loading="isInventoryLoading"
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
        </a-tab-pane>

        <a-tab-pane key="batches" tab="批次">
          <div class="admin-toolbar">
            <a-input-search
              v-model:value="query"
              class="admin-toolbar-search"
              placeholder="搜索批次、供应商、采购单、库位..."
              allow-clear
            />
            <a-segmented v-model:value="selectedBatchStatus" :options="batchStatusOptions" />
            <a-alert
              type="warning"
              show-icon
              message="电池安全"
              description="电池批次在销售和发货前必须保存 MSDS 与 UN38.3 文件。"
            />
          </div>

          <a-table
            class="admin-desktop-data-table"
            :columns="batchColumns"
            :data-source="filteredBatches"
            :loading="isBatchesLoading"
            row-key="id"
            :scroll="{ x: 1280 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'batch'">
                <strong>{{ record.batchCode }}</strong>
                <span class="admin-muted-line">收货 {{ formatDate(record.receivedAt) }}</span>
              </template>

              <template v-else-if="column.key === 'supplier'">
                <span>{{ record.supplier }}</span>
                <span class="admin-muted-line">{{ record.purchaseOrder }}</span>
              </template>

              <template v-else-if="column.key === 'status'">
                <a-tag :color="batchStatusColor(record.status)">{{ labelBatchStatus(record.status) }}</a-tag>
              </template>

              <template v-else-if="column.key === 'qc'">
                <a-tag :color="qcColor(record.qcStatus)">{{ labelQcStatus(record.qcStatus) }}</a-tag>
              </template>

              <template v-else-if="column.key === 'battery'">
                <a-space wrap>
                  <a-tag :color="record.isBatteryBatch ? 'red' : 'default'">
                    {{ record.isBatteryBatch ? '电池批次' : '非电池' }}
                  </a-tag>
                  <a-tag v-if="record.msdsUrl">MSDS</a-tag>
                  <a-tag v-if="record.un38Url">UN38.3</a-tag>
                </a-space>
                <span v-if="record.msdsUrl" class="admin-muted-line">{{ record.msdsUrl }}</span>
                <span v-if="record.un38Url" class="admin-muted-line">{{ record.un38Url }}</span>
              </template>
            </template>
          </a-table>

          <div class="admin-mobile-data-list admin-mobile-inventory-list">
            <a-empty v-if="filteredBatches.length === 0" class="admin-mobile-empty" description="暂无批次" />
            <article
              v-for="batch in filteredBatches"
              :key="batch.id"
              class="admin-mobile-data-card admin-mobile-inventory-card"
            >
              <header>
                <div>
                  <strong>{{ batch.batchCode }}</strong>
                  <span>{{ batch.supplier }} / {{ batch.purchaseOrder }}</span>
                </div>
                <a-tag :color="batchStatusColor(batch.status)">{{ labelBatchStatus(batch.status) }}</a-tag>
              </header>

              <dl class="admin-mobile-data-grid">
                <div>
                  <dt>QC</dt>
                  <dd>{{ labelQcStatus(batch.qcStatus) }}</dd>
                </div>
                <div>
                  <dt>SKU</dt>
                  <dd>{{ batch.skuCount }}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{{ batch.warehouseLocation }}</dd>
                </div>
                <div>
                  <dt>收货</dt>
                  <dd>{{ formatDate(batch.receivedAt) }}</dd>
                </div>
              </dl>

              <div class="admin-mobile-data-tags">
                <a-tag :color="batch.isBatteryBatch ? 'red' : 'default'">
                  {{ batch.isBatteryBatch ? '电池批次' : '非电池' }}
                </a-tag>
                <a-tag v-if="batch.msdsUrl">MSDS</a-tag>
                <a-tag v-if="batch.un38Url">UN38.3</a-tag>
              </div>
            </article>
          </div>
        </a-tab-pane>

        <a-tab-pane key="movements" tab="库存流水">
          <div class="admin-toolbar">
            <a-input-search
              v-model:value="query"
              class="admin-toolbar-search"
              placeholder="搜索 SKU、批次、库位、关联单据或操作人..."
              allow-clear
            />
            <a-segmented v-model:value="selectedMovementType" :options="movementTypeOptions" />
            <a-alert
              type="info"
              show-icon
              message="批次可追踪"
              description="每条流水关联 SKU、批次、库位、来源单据和操作人。"
            />
          </div>

          <a-table
            class="admin-desktop-data-table"
            :columns="movementColumns"
            :data-source="filteredMovements"
            :loading="isMovementsLoading"
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

          <div class="admin-mobile-data-list admin-mobile-inventory-list">
            <a-empty v-if="filteredMovements.length === 0" class="admin-mobile-empty" description="暂无流水" />
            <article
              v-for="movement in filteredMovements"
              :key="movement.id"
              class="admin-mobile-data-card admin-mobile-inventory-card"
            >
              <header>
                <div>
                  <strong>{{ movement.skuCode }}</strong>
                  <span>{{ movement.reference || '无关联单据' }} / {{ formatDate(movement.createdAt) }}</span>
                </div>
                <a-tag :color="movementColor(movement.type)">{{ labelMovementType(movement.type) }}</a-tag>
              </header>

              <dl class="admin-mobile-data-grid">
                <div>
                  <dt>批次</dt>
                  <dd>{{ movement.batchCode }}</dd>
                </div>
                <div>
                  <dt>库位</dt>
                  <dd>{{ movement.location }}</dd>
                </div>
                <div>
                  <dt>数量</dt>
                  <dd>{{ movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity }}</dd>
                </div>
                <div>
                  <dt>操作人</dt>
                  <dd>{{ movement.operator || '未记录' }}</dd>
                </div>
              </dl>
            </article>
          </div>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </main>
</template>
