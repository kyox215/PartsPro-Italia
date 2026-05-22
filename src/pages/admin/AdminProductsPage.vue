<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { fetchAdminProducts, saveAdminProduct } from '@/services/admin.service'
import type { AdminProduct, AdminProductStatus } from '@/types/admin'
import { labelCategory, labelFrame, labelProductStatus } from '@/utils/adminLabels'

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
  { title: 'SKU / 商品', dataIndex: 'skuCode', key: 'product', width: 320 },
  { title: '品牌 / 机型', key: 'model', width: 210 },
  { title: '分类 / 品质', key: 'category', width: 220 },
  { title: '价格', key: 'prices', width: 170 },
  { title: '库存 / 批次', key: 'stock', width: 210 },
  { title: '合规', key: 'compliance', width: 210 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 120 },
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
  message.success('商品 PIM 已更新。')
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
        <a-card><a-statistic title="SKU 总数" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="已上架" :value="stats.active" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="电池 SKU" :value="stats.batteries" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="低库存" :value="stats.lowStock" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="搜索 SKU、机型、批次、供应商..."
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
            <span class="admin-muted-line">重量 {{ record.weightGram }}g / 质保 {{ record.warrantyDays }} 天</span>
          </template>

          <template v-else-if="column.key === 'model'">
            <strong>{{ record.brand }}</strong>
            <span class="admin-muted-line">{{ record.model }}</span>
            <span class="admin-muted-line">{{ record.modelCode }}</span>
          </template>

          <template v-else-if="column.key === 'category'">
            <a-tag color="blue">{{ labelCategory(record.category) }}</a-tag>
            <a-tag>{{ record.qualityGrade }}</a-tag>
            <span class="admin-muted-line">{{ record.color }} / {{ labelFrame(record.frame) }}</span>
          </template>

          <template v-else-if="column.key === 'prices'">
            <strong>B2B {{ formatCurrency(record.b2bPrice) }}</strong>
            <span class="admin-muted-line">成本 {{ formatCurrency(record.costPrice) }}</span>
            <span class="admin-muted-line">零售 {{ formatCurrency(record.retailPrice) }}</span>
          </template>

          <template v-else-if="column.key === 'stock'">
            <a-tag :color="record.stockQty > 10 ? 'green' : 'orange'">库存 {{ record.stockQty }}</a-tag>
            <span class="admin-muted-line">{{ record.location }}</span>
            <span class="admin-muted-line">{{ record.batchCode }} / {{ record.supplier }}</span>
          </template>

          <template v-else-if="column.key === 'compliance'">
            <a-space wrap>
              <a-tag :color="record.isBattery ? 'red' : 'default'">
                {{ record.isBattery ? '电池' : '非电池' }}
              </a-tag>
              <a-tag :color="record.isDangerousGoods ? 'orange' : 'default'">
                {{ record.isDangerousGoods ? '危险品' : '普通货' }}
              </a-tag>
              <a-tag v-if="record.msdsUrl">MSDS</a-tag>
              <a-tag v-if="record.un38Url">UN38.3</a-tag>
            </a-space>
          </template>

          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ labelProductStatus(record.status) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-button size="small" type="primary" @click="openEditor(record)">编辑</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
      class="admin-data-drawer admin-product-drawer"
      width="960"
      title="编辑商品 PIM"
    >
      <a-form class="admin-product-form" layout="vertical">
        <section class="admin-product-form-section">
          <h3>基础信息</h3>
          <a-row :gutter="[8, 4]">
            <a-col :xs="24" :md="16">
              <a-form-item label="商品名称">
                <a-input v-model:value="formState.name" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="8">
              <a-form-item label="状态">
                <a-select v-model:value="formState.status">
                  <a-select-option value="active">已上架</a-select-option>
                  <a-select-option value="draft">草稿</a-select-option>
                  <a-select-option value="hidden">已隐藏</a-select-option>
                  <a-select-option value="blocked">已冻结</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="8">
              <a-form-item label="品牌"><a-input v-model:value="formState.brand" /></a-form-item>
            </a-col>
            <a-col :xs="12" :md="8">
              <a-form-item label="机型"><a-input v-model:value="formState.model" /></a-form-item>
            </a-col>
            <a-col :xs="12" :md="8">
              <a-form-item label="机型代码">
                <a-input v-model:value="formState.modelCode" />
              </a-form-item>
            </a-col>
          </a-row>
        </section>

        <section class="admin-product-form-section">
          <h3>分类属性</h3>
          <a-row :gutter="[8, 4]">
            <a-col :xs="12" :md="6">
              <a-form-item label="分类"><a-input v-model:value="formState.category" /></a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="品质">
                <a-input v-model:value="formState.qualityGrade" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="颜色"><a-input v-model:value="formState.color" /></a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="是否带框">
                <a-select v-model:value="formState.frame">
                  <a-select-option value="With Frame">带框</a-select-option>
                  <a-select-option value="Without Frame">不带框</a-select-option>
                  <a-select-option value="N/A">不适用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </section>

        <section class="admin-product-form-section">
          <h3>价格库存</h3>
          <a-row :gutter="[8, 4]">
            <a-col :xs="12" :md="6">
              <a-form-item label="成本">
                <a-input-number v-model:value="formState.costPrice" :min="0" class="full-width" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="B2B 价">
                <a-input-number v-model:value="formState.b2bPrice" :min="0" class="full-width" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="零售价">
                <a-input-number v-model:value="formState.retailPrice" :min="0" class="full-width" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="库存">
                <a-input-number v-model:value="formState.stockQty" :min="0" class="full-width" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="库位"><a-input v-model:value="formState.location" /></a-form-item>
            </a-col>
            <a-col :xs="12" :md="6">
              <a-form-item label="批次"><a-input v-model:value="formState.batchCode" /></a-form-item>
            </a-col>
            <a-col :xs="24" :md="6">
              <a-form-item label="供应商"><a-input v-model:value="formState.supplier" /></a-form-item>
            </a-col>
            <a-col :xs="12" :md="3">
              <a-form-item label="质保天">
                <a-input-number v-model:value="formState.warrantyDays" :min="0" class="full-width" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="3">
              <a-form-item label="重量 g">
                <a-input-number v-model:value="formState.weightGram" :min="0" class="full-width" />
              </a-form-item>
            </a-col>
          </a-row>
        </section>

        <section class="admin-product-form-section">
          <h3>合规资料</h3>
          <a-row :gutter="[8, 4]">
            <a-col :xs="24" :md="8">
              <a-form-item label="合规">
                <a-space class="admin-product-switches" wrap>
                  <a-switch v-model:checked="formState.isBattery" checked-children="电池" />
                  <a-switch
                    v-model:checked="formState.isDangerousGoods"
                    checked-children="危险品"
                  />
                </a-space>
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="8">
              <a-form-item label="MSDS"><a-input v-model:value="formState.msdsUrl" /></a-form-item>
            </a-col>
            <a-col :xs="12" :md="8">
              <a-form-item label="UN38.3"><a-input v-model:value="formState.un38Url" /></a-form-item>
            </a-col>
          </a-row>
        </section>

        <section class="admin-product-form-section">
          <h3>关联销售</h3>
          <a-row :gutter="[8, 4]">
            <a-col :xs="24" :md="8">
              <a-form-item label="兼容型号">
                <a-textarea v-model:value="formState.compatibilityText" :rows="3" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="8">
              <a-form-item label="替代 SKU">
                <a-textarea v-model:value="formState.alternativeSkuText" :rows="3" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="8">
              <a-form-item label="加购 SKU">
                <a-textarea v-model:value="formState.addOnSkuText" :rows="3" />
              </a-form-item>
            </a-col>
          </a-row>
        </section>
      </a-form>

      <div class="admin-drawer-actions admin-product-actions">
        <a-space>
          <a-button @click="isDrawerOpen = false">取消</a-button>
          <a-button type="primary" @click="saveProduct">保存商品</a-button>
        </a-space>
      </div>
    </a-drawer>
  </main>
</template>
