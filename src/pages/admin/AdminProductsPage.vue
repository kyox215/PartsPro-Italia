<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { fetchAdminProducts, saveAdminProduct } from '@/services/admin.service'
import type { AdminProduct, AdminProductStatus } from '@/types/admin'

type ProductFormState = {
  name: string
  brand: string
  model: string
  modelCode: string
  category: string
  qualityGrade: string
  color: string
  frame: AdminProduct['frame']
  costPrice: number
  retailPrice: number
  b2bPrice: number
  stockQty: number
  location: string
  batchCode: string
  supplier: string
  warrantyDays: number
  weightGram: number
  isBattery: boolean
  isDangerousGoods: boolean
  msdsUrl: string
  un38Url: string
  compatibilityText: string
  alternativeSkuText: string
  addOnSkuText: string
  status: AdminProductStatus
}

const products = ref<AdminProduct[]>([])
const isLoading = ref(false)
const query = ref('')
const isDrawerOpen = ref(false)
const selectedProductId = ref('')

const formState = reactive<ProductFormState>({
  name: '',
  brand: '',
  model: '',
  modelCode: '',
  category: '',
  qualityGrade: '',
  color: '',
  frame: 'N/A',
  costPrice: 0,
  retailPrice: 0,
  b2bPrice: 0,
  stockQty: 0,
  location: '',
  batchCode: '',
  supplier: '',
  warrantyDays: 0,
  weightGram: 0,
  isBattery: false,
  isDangerousGoods: false,
  msdsUrl: '',
  un38Url: '',
  compatibilityText: '',
  alternativeSkuText: '',
  addOnSkuText: '',
  status: 'draft',
})

const columns = [
  { title: 'SKU / prodotto', dataIndex: 'skuCode', key: 'product', width: 320 },
  { title: 'Brand / modello', key: 'model', width: 210 },
  { title: 'Categoria / qualita', key: 'category', width: 220 },
  { title: 'Prezzi', key: 'prices', width: 170 },
  { title: 'Stock / batch', key: 'stock', width: 210 },
  { title: 'Compliance', key: 'compliance', width: 210 },
  { title: 'Stato', dataIndex: 'status', key: 'status', width: 120 },
  { title: 'Azioni', key: 'actions', fixed: 'right' as const, width: 120 },
]

const filteredProducts = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  if (!normalizedQuery) {
    return products.value
  }

  return products.value.filter((product) =>
    [
      product.skuCode,
      product.name,
      product.brand,
      product.model,
      product.modelCode,
      product.category,
      product.qualityGrade,
      product.batchCode,
      product.supplier,
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  )
})

const stats = computed(() => ({
  total: products.value.length,
  active: products.value.filter((product) => product.status === 'active').length,
  batteries: products.value.filter((product) => product.isBattery).length,
  lowStock: products.value.filter((product) => product.stockQty <= 10).length,
}))

async function refreshProducts() {
  isLoading.value = true
  try {
    products.value = await fetchAdminProducts()
  } finally {
    isLoading.value = false
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function statusColor(status: AdminProductStatus) {
  const colors: Record<AdminProductStatus, string> = {
    active: 'green',
    draft: 'gold',
    hidden: 'default',
    blocked: 'red',
  }

  return colors[status]
}

function splitList(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

function openEditor(product: AdminProduct) {
  selectedProductId.value = product.id
  Object.assign(formState, {
    name: product.name,
    brand: product.brand,
    model: product.model,
    modelCode: product.modelCode,
    category: product.category,
    qualityGrade: product.qualityGrade,
    color: product.color,
    frame: product.frame,
    costPrice: product.costPrice,
    retailPrice: product.retailPrice,
    b2bPrice: product.b2bPrice,
    stockQty: product.stockQty,
    location: product.location,
    batchCode: product.batchCode,
    supplier: product.supplier,
    warrantyDays: product.warrantyDays,
    weightGram: product.weightGram,
    isBattery: product.isBattery,
    isDangerousGoods: product.isDangerousGoods,
    msdsUrl: product.msdsUrl,
    un38Url: product.un38Url,
    compatibilityText: product.compatibilityModels.join('\n'),
    alternativeSkuText: product.alternativeSkus.join('\n'),
    addOnSkuText: product.addOnSkus.join('\n'),
    status: product.status,
  })
  isDrawerOpen.value = true
}

async function saveProduct() {
  if (!selectedProductId.value) {
    return
  }

  await saveAdminProduct(selectedProductId.value, {
    ...formState,
    compatibilityModels: splitList(formState.compatibilityText),
    alternativeSkus: splitList(formState.alternativeSkuText),
    addOnSkus: splitList(formState.addOnSkuText),
  })
  refreshProducts()
  isDrawerOpen.value = false
  message.success('Prodotto PIM aggiornato.')
}

onMounted(refreshProducts)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="商品 / PIM"
      sub-title="SKU、品牌、机型、品质、价格、批次、合规和关联销售"
    >
      <template #extra>
        <a-button @click="refreshProducts">刷新</a-button>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="SKU totali" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Attivi" :value="stats.active" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Batterie" :value="stats.batteries" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="Low stock" :value="stats.lowStock" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="Cerca SKU, modello, lotto, fornitore..."
          allow-clear
        />
        <a-alert
          type="info"
          show-icon
          message="PIM 数据管理"
          description="有 Supabase 配置时保存到数据库；无配置时回落到本地 mock。"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredProducts"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1560 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'product'">
            <strong>{{ record.skuCode }}</strong>
            <span class="admin-muted-line">{{ record.name }}</span>
            <span class="admin-muted-line">Peso {{ record.weightGram }}g / Garanzia {{ record.warrantyDays }}gg</span>
          </template>

          <template v-else-if="column.key === 'model'">
            <strong>{{ record.brand }}</strong>
            <span class="admin-muted-line">{{ record.model }}</span>
            <span class="admin-muted-line">{{ record.modelCode }}</span>
          </template>

          <template v-else-if="column.key === 'category'">
            <a-tag color="blue">{{ record.category }}</a-tag>
            <a-tag>{{ record.qualityGrade }}</a-tag>
            <span class="admin-muted-line">{{ record.color }} / {{ record.frame }}</span>
          </template>

          <template v-else-if="column.key === 'prices'">
            <strong>B2B {{ formatCurrency(record.b2bPrice) }}</strong>
            <span class="admin-muted-line">Cost {{ formatCurrency(record.costPrice) }}</span>
            <span class="admin-muted-line">Retail {{ formatCurrency(record.retailPrice) }}</span>
          </template>

          <template v-else-if="column.key === 'stock'">
            <a-tag :color="record.stockQty > 10 ? 'green' : 'orange'">Stock {{ record.stockQty }}</a-tag>
            <span class="admin-muted-line">{{ record.location }}</span>
            <span class="admin-muted-line">{{ record.batchCode }} / {{ record.supplier }}</span>
          </template>

          <template v-else-if="column.key === 'compliance'">
            <a-space wrap>
              <a-tag :color="record.isBattery ? 'red' : 'default'">
                {{ record.isBattery ? 'Battery' : 'No battery' }}
              </a-tag>
              <a-tag :color="record.isDangerousGoods ? 'orange' : 'default'">
                {{ record.isDangerousGoods ? 'Dangerous goods' : 'Standard' }}
              </a-tag>
              <a-tag v-if="record.msdsUrl">MSDS</a-tag>
              <a-tag v-if="record.un38Url">UN38.3</a-tag>
            </a-space>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ record.status }}</a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-button size="small" type="primary" @click="openEditor(record)">Modifica</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
      width="760"
      title="编辑商品 PIM"
    >
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12">
            <a-form-item label="Nome prodotto">
              <a-input v-model:value="formState.name" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="Status">
              <a-select v-model:value="formState.status">
                <a-select-option value="active">active</a-select-option>
                <a-select-option value="draft">draft</a-select-option>
                <a-select-option value="hidden">hidden</a-select-option>
                <a-select-option value="blocked">blocked</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Brand"><a-input v-model:value="formState.brand" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Modello"><a-input v-model:value="formState.model" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Codici modello">
              <a-input v-model:value="formState.modelCode" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Categoria"><a-input v-model:value="formState.category" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Qualita">
              <a-input v-model:value="formState.qualityGrade" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Colore"><a-input v-model:value="formState.color" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Con frame">
              <a-select v-model:value="formState.frame">
                <a-select-option value="With Frame">With Frame</a-select-option>
                <a-select-option value="Without Frame">Without Frame</a-select-option>
                <a-select-option value="N/A">N/A</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Costo">
              <a-input-number v-model:value="formState.costPrice" :min="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Prezzo B2B">
              <a-input-number v-model:value="formState.b2bPrice" :min="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Prezzo retail">
              <a-input-number v-model:value="formState.retailPrice" :min="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Stock">
              <a-input-number v-model:value="formState.stockQty" :min="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Ubicazione"><a-input v-model:value="formState.location" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Lotto"><a-input v-model:value="formState.batchCode" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="Fornitore"><a-input v-model:value="formState.supplier" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="6">
            <a-form-item label="Garanzia giorni">
              <a-input-number v-model:value="formState.warrantyDays" :min="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="6">
            <a-form-item label="Peso grammi">
              <a-input-number v-model:value="formState.weightGram" :min="0" class="full-width" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="Compliance">
              <a-space wrap>
                <a-switch v-model:checked="formState.isBattery" checked-children="Battery" />
                <a-switch
                  v-model:checked="formState.isDangerousGoods"
                  checked-children="Danger"
                />
              </a-space>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="MSDS"><a-input v-model:value="formState.msdsUrl" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="UN38.3"><a-input v-model:value="formState.un38Url" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Compatibilita">
              <a-textarea v-model:value="formState.compatibilityText" :rows="4" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="SKU alternativi">
              <a-textarea v-model:value="formState.alternativeSkuText" :rows="4" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="Add-on">
              <a-textarea v-model:value="formState.addOnSkuText" :rows="4" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <div class="admin-drawer-actions">
        <a-space>
          <a-button @click="isDrawerOpen = false">取消</a-button>
          <a-button type="primary" @click="saveProduct">保存商品</a-button>
        </a-space>
      </div>
    </a-drawer>
  </main>
</template>
