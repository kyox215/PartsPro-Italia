<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  archiveAdminProduct,
  bulkImportProducts,
  createAdminProduct,
  fetchAdminProducts,
  restoreAdminProduct,
  saveAdminProduct,
  uploadProductImage,
} from '@/services/admin.service'
import { useTaxonomyStore } from '@/stores/taxonomy.store'
import type {
  AdminProduct,
  AdminProductPatch,
  AdminProductStatus,
  AdminProductStockStatus,
  AdminProductVatMode,
  PriceTier,
  ProductImportPreview,
} from '@/types/admin'
import {
  labelCategory,
  labelFrame,
  labelProductStatus,
  labelProductStockStatus,
} from '@/utils/adminLabels'
import { matchesSearchTokens, readRouteQuery, withSearchQuery } from '@/utils/adminSearch'

type ProductTabKey = 'products' | 'import' | 'archived' | 'taxonomy'
type ProductEditorMode = 'create' | 'edit' | 'duplicate'

type ProductFormState = {
  skuCode: string
  name: string
  brand: string
  model: string
  modelCode: string
  modelCodesText: string
  category: string
  qualityGrade: string
  color: string
  frame: AdminProduct['frame']
  stockStatus: AdminProductStockStatus
  moq: number
  costPrice: number
  retailPrice: number
  b2bPrice: number
  vatMode: AdminProductVatMode
  tierPricesText: string
  stockQty: number
  location: string
  batchCode: string
  supplier: string
  warrantyDays: number
  weightGram: number
  imagePath: string
  imageAlt: string
  galleryText: string
  isBattery: boolean
  isDangerousGoods: boolean
  msdsUrl: string
  un38Url: string
  compatibilityText: string
  alternativeSkuText: string
  addOnSkuText: string
  highlightsText: string
  status: AdminProductStatus
  taxonomyPath: string[]
}

const route = useRoute()
const router = useRouter()
const taxonomyStore = useTaxonomyStore()
const products = ref<AdminProduct[]>([])
const isLoading = ref(false)
const isSaving = ref(false)
const isUploadingImage = ref(false)
const productDataError = ref('')
const query = ref('')
const isDrawerOpen = ref(false)
const selectedProductId = ref('')
const activeTab = ref<ProductTabKey>('products')
const editorMode = ref<ProductEditorMode>('edit')
const importCsvText = ref('')
const importPreview = ref<ProductImportPreview[]>([])
const selectedTaxonomyBrandId = ref('')
const selectedTaxonomyModelId = ref('')

const formState = reactive<ProductFormState>({
  skuCode: '',
  name: '',
  brand: '',
  model: '',
  modelCode: '',
  modelCodesText: '',
  category: '',
  qualityGrade: '',
  color: '',
  frame: 'N/A',
  stockStatus: 'incoming',
  moq: 1,
  costPrice: 0,
  retailPrice: 0,
  b2bPrice: 0,
  vatMode: 'IVA esclusa',
  tierPricesText: '',
  stockQty: 0,
  location: '',
  batchCode: '',
  supplier: '',
  warrantyDays: 180,
  weightGram: 0,
  imagePath: '',
  imageAlt: '',
  galleryText: '',
  isBattery: false,
  isDangerousGoods: false,
  msdsUrl: '',
  un38Url: '',
  compatibilityText: '',
  alternativeSkuText: '',
  addOnSkuText: '',
  highlightsText: '',
  status: 'draft',
  taxonomyPath: [],
})

const columns = [
  { title: 'SKU / 商品', dataIndex: 'skuCode', key: 'product', width: 320 },
  { title: '品牌 / 机型', key: 'model', width: 210 },
  { title: '分类 / 品质', key: 'category', width: 220 },
  { title: '价格', key: 'prices', width: 170 },
  { title: '库存 / 批次', key: 'stock', width: 210 },
  { title: '合规', key: 'compliance', width: 210 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 220 },
]

const activeProducts = computed(() => products.value.filter((product) => !product.archivedAt))
const archivedProducts = computed(() => products.value.filter((product) => product.archivedAt))
const validImportRows = computed(() => importPreview.value.filter((row) => row.errors.length === 0).length)
const invalidImportRows = computed(() => importPreview.value.length - validImportRows.value)

const filteredProducts = computed(() => {
  if (!query.value.trim()) {
    return activeProducts.value
  }

  return activeProducts.value.filter((product) =>
    matchesSearchTokens(
      [
        product.skuCode,
        product.name,
        product.brand,
        product.model,
        product.modelCode,
        product.modelCodes,
        product.category,
        labelCategory(product.category),
        product.qualityGrade,
        product.color,
        product.frame,
        labelFrame(product.frame),
        product.stockStatus,
        labelProductStockStatus(product.stockStatus),
        product.batchCode,
        product.location,
        product.supplier,
        product.compatibility,
        product.compatibilityModels,
        product.alternativeSkus,
        product.addOnSkus,
        product.highlights,
        product.imagePath,
        product.galleryImagePaths,
        product.status,
        labelProductStatus(product.status),
        product.isBattery ? '电池 battery' : '非电池',
        product.isDangerousGoods ? '危险品 dangerous goods' : '普通货',
      ],
      query.value,
    ),
  )
})

const filteredArchivedProducts = computed(() => {
  if (!query.value.trim()) {
    return archivedProducts.value
  }

  return archivedProducts.value.filter((product) =>
    matchesSearchTokens(
      [product.skuCode, product.name, product.brand, product.model, product.category, product.archiveReason],
      query.value,
    ),
  )
})

const stats = computed(() => ({
  total: activeProducts.value.length,
  active: activeProducts.value.filter((product) => product.status === 'active').length,
  batteries: activeProducts.value.filter((product) => product.isBattery).length,
  lowStock: activeProducts.value.filter((product) => product.stockQty <= 10).length,
  archived: archivedProducts.value.length,
}))
const taxonomyCascaderOptions = computed(() => taxonomyStore.cascaderOptions)
const selectedTaxonomyBrand = computed(
  () => taxonomyStore.groups.find((brand) => brand.id === selectedTaxonomyBrandId.value) || taxonomyStore.groups[0],
)
const selectedTaxonomyModel = computed(
  () =>
    selectedTaxonomyBrand.value?.children.find((model) => model.id === selectedTaxonomyModelId.value) ||
    selectedTaxonomyBrand.value?.children[0],
)
const selectedTaxonomyProductCount = computed(() =>
  activeProducts.value.filter(
    (product) =>
      product.brand === selectedTaxonomyBrand.value?.value &&
      (!selectedTaxonomyModel.value || product.model === selectedTaxonomyModel.value.value),
  ).length,
)
const selectedTaxonomyPathLabel = computed(() => {
  const brand = selectedTaxonomyBrand.value?.labelZh
  const model = selectedTaxonomyModel.value?.labelZh

  return [brand, model].filter(Boolean).join(' / ')
})

async function refreshProducts() {
  isLoading.value = true
  productDataError.value = ''
  try {
    products.value = await fetchAdminProducts()
  } catch (error) {
    products.value = []
    productDataError.value = error instanceof Error ? error.message : '无法读取 Supabase 商品真实数据。'
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

function parseTierPrices(value: string): PriceTier[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [minQty, unitPrice] = line.split(/[,\s=]+/).map(Number)
      return Number.isFinite(minQty) && Number.isFinite(unitPrice) ? { minQty, unitPrice } : null
    })
    .filter((tier): tier is PriceTier => Boolean(tier))
}

function formatTierPrices(tiers: PriceTier[]) {
  return tiers.map((tier) => `${tier.minQty},${tier.unitPrice}`).join('\n')
}

function resetForm() {
  Object.assign(formState, {
    skuCode: '',
    name: '',
    brand: '',
    model: '',
    modelCode: '',
    modelCodesText: '',
    category: '',
    qualityGrade: '',
    color: '',
    frame: 'N/A' as AdminProduct['frame'],
    stockStatus: 'incoming' as AdminProductStockStatus,
    moq: 1,
    costPrice: 0,
    retailPrice: 0,
    b2bPrice: 0,
    vatMode: 'IVA esclusa' as AdminProductVatMode,
    tierPricesText: '',
    stockQty: 0,
    location: '',
    batchCode: '',
    supplier: '',
    warrantyDays: 180,
    weightGram: 0,
    imagePath: '',
    imageAlt: '',
    galleryText: '',
    isBattery: false,
    isDangerousGoods: false,
    msdsUrl: '',
    un38Url: '',
    compatibilityText: '',
    alternativeSkuText: '',
    addOnSkuText: '',
    highlightsText: '',
    status: 'draft' as AdminProductStatus,
    taxonomyPath: [],
  })
}

function buildProductPatch(includeStockQty = false): AdminProductPatch {
  const compatibilityModels = splitList(formState.compatibilityText)
  const patch: AdminProductPatch = {
    skuCode: formState.skuCode.trim().toUpperCase(),
    name: formState.name.trim(),
    brand: formState.brand.trim(),
    model: formState.model.trim(),
    modelCode: formState.modelCode.trim(),
    modelCodes: splitList(formState.modelCodesText),
    category: formState.category.trim(),
    qualityGrade: formState.qualityGrade.trim(),
    color: formState.color.trim(),
    frame: formState.frame,
    stockStatus: formState.stockStatus,
    moq: formState.moq,
    costPrice: formState.costPrice,
    retailPrice: formState.retailPrice,
    b2bPrice: formState.b2bPrice,
    vatMode: formState.vatMode,
    tierPrices: parseTierPrices(formState.tierPricesText),
    location: formState.location.trim(),
    batchCode: formState.batchCode.trim(),
    supplier: formState.supplier.trim(),
    warrantyDays: formState.warrantyDays,
    weightGram: formState.weightGram,
    imagePath: formState.imagePath.trim(),
    imageAlt: formState.imageAlt.trim() || formState.name.trim(),
    galleryImagePaths: splitList(formState.galleryText),
    isBattery: formState.isBattery,
    isDangerousGoods: formState.isDangerousGoods,
    msdsUrl: formState.msdsUrl.trim(),
    un38Url: formState.un38Url.trim(),
    compatibility: compatibilityModels.map((model) => ({ model, code: model, note: '' })),
    compatibilityModels,
    alternativeSkus: splitList(formState.alternativeSkuText),
    addOnSkus: splitList(formState.addOnSkuText),
    highlights: splitList(formState.highlightsText),
    status: formState.status,
  }

  if (includeStockQty) {
    patch.stockQty = formState.stockQty
  }

  return patch
}

function validateProductPatch(patch: AdminProductPatch) {
  if (!patch.skuCode || !patch.name || !patch.brand || !patch.model || !patch.category) {
    throw new Error('SKU、名称、品牌、机型和分类不能为空。')
  }

  if ((patch.moq || 0) < 1) {
    throw new Error('MOQ 必须大于 0。')
  }

  if (patch.isBattery && (!patch.msdsUrl || !patch.un38Url)) {
    throw new Error('电池 SKU 需要填写 MSDS 和 UN38.3。')
  }
}

function syncProductSearch(value: string) {
  router.replace({ query: withSearchQuery(route.query, 'q', value) })
}

function handleProductSearch(value: string) {
  query.value = value
  syncProductSearch(value)
}

function handleProductSearchChange(event: Event) {
  const value = event.target instanceof HTMLInputElement ? event.target.value : query.value

  if (!value.trim()) {
    syncProductSearch('')
  }
}

function ensureTaxonomySelection() {
  if (!taxonomyStore.groups.length) {
    selectedTaxonomyBrandId.value = ''
    selectedTaxonomyModelId.value = ''
    return
  }

  const hasSelectedBrand = taxonomyStore.groups.some((brand) => brand.id === selectedTaxonomyBrandId.value)

  if (!hasSelectedBrand) {
    selectedTaxonomyBrandId.value = taxonomyStore.groups[0].id
  }

  const brand = taxonomyStore.groups.find((item) => item.id === selectedTaxonomyBrandId.value)
  const hasSelectedModel = brand?.children.some((model) => model.id === selectedTaxonomyModelId.value)

  if (!hasSelectedModel) {
    selectedTaxonomyModelId.value = brand?.children[0]?.id || ''
  }
}

function selectTaxonomyBrand(brandId: string) {
  selectedTaxonomyBrandId.value = brandId
  selectedTaxonomyModelId.value =
    taxonomyStore.groups.find((brand) => brand.id === brandId)?.children[0]?.id || ''
}

function selectTaxonomyModel(modelId: string) {
  selectedTaxonomyModelId.value = modelId
}

function handleTaxonomyPathChange(value: unknown) {
  const path = Array.isArray(value) ? value.map(String) : []
  const values = taxonomyStore.getValuesForPath(path)

  if (!values) {
    return
  }

  formState.brand = values.brand
  formState.model = values.model
  formState.category = values.category
}

function openEditor(product: AdminProduct) {
  editorMode.value = 'edit'
  selectedProductId.value = product.id
  Object.assign(formState, {
    skuCode: product.skuCode,
    name: product.name,
    brand: product.brand,
    model: product.model,
    modelCode: product.modelCode,
    modelCodesText: product.modelCodes.join('\n'),
    category: product.category,
    qualityGrade: product.qualityGrade,
    color: product.color,
    frame: product.frame,
    stockStatus: product.stockStatus,
    moq: product.moq,
    costPrice: product.costPrice,
    retailPrice: product.retailPrice,
    b2bPrice: product.b2bPrice,
    vatMode: product.vatMode,
    tierPricesText: formatTierPrices(product.tierPrices),
    stockQty: product.stockQty,
    location: product.location,
    batchCode: product.batchCode,
    supplier: product.supplier,
    warrantyDays: product.warrantyDays,
    weightGram: product.weightGram,
    imagePath: product.imagePath,
    imageAlt: product.imageAlt,
    galleryText: product.galleryImagePaths.join('\n'),
    isBattery: product.isBattery,
    isDangerousGoods: product.isDangerousGoods,
    msdsUrl: product.msdsUrl,
    un38Url: product.un38Url,
    compatibilityText: product.compatibilityModels.join('\n'),
    alternativeSkuText: product.alternativeSkus.join('\n'),
    addOnSkuText: product.addOnSkus.join('\n'),
    highlightsText: product.highlights.join('\n'),
    status: product.status,
    taxonomyPath: taxonomyStore.findPathForProduct(product.brand, product.model, product.category),
  })
  isDrawerOpen.value = true
}

function openCreateEditor() {
  editorMode.value = 'create'
  selectedProductId.value = ''
  resetForm()
  isDrawerOpen.value = true
}

function openDuplicateEditor(product: AdminProduct) {
  editorMode.value = 'duplicate'
  selectedProductId.value = ''
  openEditor(product)
  editorMode.value = 'duplicate'
  selectedProductId.value = ''
  formState.skuCode = `${product.skuCode}-COPY`
  formState.name = `${product.name} Copy`
  formState.status = 'draft'
}

async function saveProduct() {
  const patch = buildProductPatch(editorMode.value !== 'edit')
  validateProductPatch(patch)

  isSaving.value = true
  try {
    if (editorMode.value === 'edit' && selectedProductId.value) {
      await saveAdminProduct(selectedProductId.value, patch)
      message.success('商品 PIM 已更新。')
    } else {
      await createAdminProduct(patch)
      message.success(editorMode.value === 'duplicate' ? 'SKU 已复制为草稿。' : '商品已新增。')
    }

    await refreshProducts()
    isDrawerOpen.value = false
  } catch (error) {
    message.error(error instanceof Error ? error.message : '商品保存失败。')
  } finally {
    isSaving.value = false
  }
}

function archiveProduct(product: AdminProduct) {
  Modal.confirm({
    title: `归档 ${product.skuCode}？`,
    content: '归档后商城不再展示该商品，历史订单和库存流水会保留。',
    okText: '归档',
    cancelText: '取消',
    async onOk() {
      await archiveAdminProduct(product.id, '后台商品管理手动归档')
      await refreshProducts()
      message.success('商品已归档。')
    },
  })
}

function restoreProduct(product: AdminProduct) {
  Modal.confirm({
    title: `恢复 ${product.skuCode}？`,
    content: '恢复后商品会回到商品列表，是否展示仍由商品状态控制。',
    okText: '恢复',
    cancelText: '取消',
    async onOk() {
      await restoreAdminProduct(product.id)
      await refreshProducts()
      message.success('商品已恢复。')
    },
  })
}

async function handleImageChange(event: Event, slot: 'main' | 'gallery') {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return
  if (!formState.skuCode.trim()) {
    message.warning('请先填写 SKU。')
    input.value = ''
    return
  }

  isUploadingImage.value = true
  try {
    const path = await uploadProductImage(file, formState.skuCode, slot)
    if (slot === 'main') {
      formState.imagePath = path
      formState.imageAlt = formState.imageAlt || formState.name
    } else {
      formState.galleryText = [...splitList(formState.galleryText), path].join('\n')
    }
    message.success('图片已上传。')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '图片上传失败。')
  } finally {
    isUploadingImage.value = false
    input.value = ''
  }
}

function handleTabChange(tab: string | number) {
  activeTab.value = tab === 'import' || tab === 'archived' || tab === 'taxonomy' ? tab : 'products'
}

function parseImportCsv() {
  const lines = importCsvText.value.split(/\r?\n/).filter((line) => line.trim())
  const [headerLine = '', ...bodyLines] = lines
  const headers = headerLine.split(',').map((header) => header.trim().toLowerCase())
  const existingSkus = new Set(products.value.map((product) => product.skuCode.toLowerCase()))

  importPreview.value = bodyLines.map((line, index) => {
    const values = line.split(',').map((value) => value.trim())
    const row = Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex] || '']))
    const product: AdminProductPatch = {
      skuCode: String(row.sku_code || row.sku || '').toUpperCase(),
      name: String(row.name || ''),
      brand: String(row.brand || ''),
      model: String(row.model || ''),
      modelCode: String(row.model_code || ''),
      category: String(row.category || ''),
      qualityGrade: String(row.quality_grade || ''),
      color: String(row.color || ''),
      frame: (row.frame as AdminProduct['frame']) || 'N/A',
      stockStatus: (row.stock_status as AdminProductStockStatus) || 'incoming',
      moq: Number(row.moq || 1),
      costPrice: Number(row.cost_price || 0),
      retailPrice: Number(row.retail_price || 0),
      b2bPrice: Number(row.b2b_price || 0),
      vatMode: (row.vat_mode as AdminProductVatMode) || 'IVA esclusa',
      imagePath: String(row.image_path || ''),
      imageAlt: String(row.image_alt || row.name || ''),
      status: (row.status as AdminProductStatus) || 'draft',
    }
    const errors: string[] = []
    const warnings: string[] = []

    if (!product.skuCode) errors.push('SKU 不能为空')
    if (!product.name) errors.push('名称不能为空')
    if (!product.brand) errors.push('品牌不能为空')
    if (!product.model) errors.push('机型不能为空')
    if (!product.category) errors.push('分类不能为空')
    if ((product.moq || 0) < 1) errors.push('MOQ 必须大于 0')
    if (product.skuCode && existingSkus.has(product.skuCode.toLowerCase())) warnings.push('SKU 已存在，将更新')

    return { rowNumber: index + 2, product, errors, warnings }
  })
}

async function importProducts() {
  if (!importPreview.value.length) parseImportCsv()
  if (invalidImportRows.value) {
    message.error('请先修复 CSV 错误行。')
    return
  }

  const result = await bulkImportProducts(importPreview.value)
  await refreshProducts()
  message.success(`导入完成：新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}。`)
}

function exportProductsCsv(rows = activeProducts.value) {
  const headers = ['sku_code', 'name', 'brand', 'model', 'category', 'quality_grade', 'b2b_price', 'status']
  const body = rows.map((product) =>
    [
      product.skuCode,
      product.name,
      product.brand,
      product.model,
      product.category,
      product.qualityGrade,
      product.b2bPrice,
      product.status,
    ].join(','),
  )
  const blob = new Blob([[headers.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `partspro-products-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await taxonomyStore.load()
  await refreshProducts()
})

watch(
  () => taxonomyStore.groups.length,
  () => ensureTaxonomySelection(),
  { immediate: true },
)

watch(
  () => taxonomyStore.groups,
  () => {
    taxonomyStore.persist()
    ensureTaxonomySelection()
  },
  { deep: true },
)

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
    const tab = readRouteQuery(value)
    activeTab.value = tab === 'import' || tab === 'archived' || tab === 'taxonomy' ? tab : 'products'
  },
  { immediate: true },
)

watch(query, (value, previousValue) => {
  if (!value.trim() && previousValue.trim() && readRouteQuery(route.query.q)) {
    syncProductSearch('')
  }
})
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="商品 / PIM"
      sub-title="SKU 生命周期、PIM 字段、图片、批量导入、归档和目录"
    >
      <template #extra>
        <a-space wrap>
          <a-button @click="refreshProducts">刷新</a-button>
          <a-button @click="exportProductsCsv()">导出 CSV</a-button>
          <a-button type="primary" @click="openCreateEditor">新增商品</a-button>
        </a-space>
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
        <a-card><a-statistic title="归档 SKU" :value="stats.archived" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <a-tabs v-model:active-key="activeTab" @change="handleTabChange">
        <a-tab-pane key="products" tab="商品列表" />
        <a-tab-pane key="import" tab="批量导入" />
        <a-tab-pane key="archived" tab="归档商品" />
        <a-tab-pane key="taxonomy" tab="目录管理" />
      </a-tabs>
    </a-card>

    <a-card v-if="activeTab === 'taxonomy'" class="admin-taxonomy-card" title="三级目录管理">
      <template #extra>
        <a-space>
          <a-button size="small" type="primary" @click="taxonomyStore.addBrand">添加品牌</a-button>
          <a-button size="small" @click="taxonomyStore.resetDefaults">恢复默认</a-button>
        </a-space>
      </template>

      <div class="admin-taxonomy-workbench">
        <aside class="admin-taxonomy-column admin-taxonomy-brand-list">
          <header>
            <strong>品牌</strong>
            <span>{{ taxonomyStore.groups.length }} 个</span>
          </header>
          <button
            v-for="brand in taxonomyStore.groups"
            :key="brand.id"
            type="button"
            :class="{ 'is-active': brand.id === selectedTaxonomyBrand?.id }"
            @click="selectTaxonomyBrand(brand.id)"
          >
            <strong>{{ brand.labelZh }}</strong>
            <span>{{ brand.labelIt }} / {{ brand.value }}</span>
          </button>
        </aside>

        <section v-if="selectedTaxonomyBrand" class="admin-taxonomy-column admin-taxonomy-editor">
          <header>
            <strong>品牌信息</strong>
            <a-button size="small" @click="taxonomyStore.addModel(selectedTaxonomyBrand.id)">
              添加机型
            </a-button>
          </header>
          <div class="admin-taxonomy-form-grid">
            <a-input v-model:value="selectedTaxonomyBrand.labelZh" addon-before="中文" />
            <a-input v-model:value="selectedTaxonomyBrand.labelIt" addon-before="IT" />
            <a-input v-model:value="selectedTaxonomyBrand.value" addon-before="筛选值" />
          </div>

          <div class="admin-taxonomy-model-list">
            <button
              v-for="model in selectedTaxonomyBrand.children"
              :key="model.id"
              type="button"
              :class="{ 'is-active': model.id === selectedTaxonomyModel?.id }"
              @click="selectTaxonomyModel(model.id)"
            >
              <strong>{{ model.labelZh }}</strong>
              <span>{{ model.labelIt }} / {{ model.value }}</span>
            </button>
          </div>
        </section>

        <section v-if="selectedTaxonomyModel && selectedTaxonomyBrand" class="admin-taxonomy-column admin-taxonomy-editor">
          <header>
            <strong>机型与分类</strong>
            <a-tag color="blue">{{ selectedTaxonomyProductCount }} 个商品</a-tag>
          </header>
          <div class="admin-taxonomy-path-preview">
            <span>当前路径</span>
            <strong>{{ selectedTaxonomyPathLabel }}</strong>
          </div>
          <div class="admin-taxonomy-form-grid">
            <a-input v-model:value="selectedTaxonomyModel.labelZh" addon-before="中文" />
            <a-input v-model:value="selectedTaxonomyModel.labelIt" addon-before="IT" />
            <a-input v-model:value="selectedTaxonomyModel.value" addon-before="筛选值" />
          </div>

          <div class="admin-taxonomy-category-panel">
            <div class="admin-taxonomy-category-head">
              <strong>三级分类</strong>
              <a-button
                size="small"
                type="primary"
                @click="taxonomyStore.addCategory(selectedTaxonomyBrand.id, selectedTaxonomyModel.id)"
              >
                添加分类
              </a-button>
            </div>
            <div class="admin-taxonomy-category-list">
              <div
                v-for="category in selectedTaxonomyModel.children"
                :key="category.id"
                class="admin-taxonomy-category-edit-row"
              >
                <a-input v-model:value="category.labelZh" addon-before="中文" />
                <a-input v-model:value="category.labelIt" addon-before="IT" />
                <a-input v-model:value="category.value" addon-before="值" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </a-card>

    <a-card v-if="activeTab === 'import'" class="admin-table-card" title="CSV 批量导入">
      <div class="admin-toolbar">
        <a-button @click="parseImportCsv">预览校验</a-button>
        <a-button type="primary" :disabled="!validImportRows || invalidImportRows > 0" @click="importProducts">
          导入有效行
        </a-button>
        <a-alert
          type="info"
          show-icon
          message="支持 sku_code,name,brand,model,category,quality_grade,b2b_price,status 等字段"
        />
      </div>
      <a-textarea v-model:value="importCsvText" :rows="8" placeholder="粘贴 CSV 内容，第一行为表头。" />
      <a-table :data-source="importPreview" row-key="rowNumber" :pagination="{ pageSize: 8 }" :scroll="{ x: 960 }">
        <a-table-column title="行号" data-index="rowNumber" width="80" />
        <a-table-column title="SKU" width="180">
          <template #default="{ record }">{{ record.product.skuCode }}</template>
        </a-table-column>
        <a-table-column title="商品">
          <template #default="{ record }">
            <strong>{{ record.product.name }}</strong>
            <span class="admin-muted-line">{{ record.product.brand }} / {{ record.product.model }}</span>
          </template>
        </a-table-column>
        <a-table-column title="校验" width="320">
          <template #default="{ record }">
            <a-space wrap>
              <a-tag v-if="record.errors.length === 0" color="green">可导入</a-tag>
              <a-tag v-for="error in record.errors" :key="error" color="red">{{ error }}</a-tag>
              <a-tag v-for="warning in record.warnings" :key="warning" color="orange">{{ warning }}</a-tag>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <a-card v-if="activeTab === 'products'" class="admin-table-card">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="搜索 SKU、商品名、品牌、机型、分类、批次、供应商、兼容型号..."
          allow-clear
          @search="handleProductSearch"
          @change="handleProductSearchChange"
        />
        <a-alert
          v-if="productDataError"
          type="error"
          show-icon
          message="无法读取 Supabase 商品真实数据"
          :description="productDataError"
        />
        <a-alert
          v-else
          type="info"
          show-icon
          message="Supabase 商品真实数据"
          description="商品新增、复制、编辑、归档和批量导入都需要真实管理员会话，库存数量请通过库存模块生成流水。"
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
            <a-space wrap>
              <a-button size="small" type="primary" @click="openEditor(record)">编辑</a-button>
              <a-button size="small" @click="openDuplicateEditor(record)">复制</a-button>
              <a-button size="small" danger @click="archiveProduct(record)">归档</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-card v-if="activeTab === 'archived'" class="admin-table-card" title="归档商品">
      <div class="admin-toolbar">
        <a-input-search
          v-model:value="query"
          class="admin-toolbar-search"
          placeholder="搜索已归档 SKU、商品名、归档原因..."
          allow-clear
        />
        <a-button @click="exportProductsCsv(archivedProducts)">导出归档 CSV</a-button>
      </div>
      <a-table
        :columns="columns"
        :data-source="filteredArchivedProducts"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1560 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'product'">
            <strong>{{ record.skuCode }}</strong>
            <span class="admin-muted-line">{{ record.name }}</span>
            <span class="admin-muted-line">{{ record.archiveReason || '未填写归档原因' }}</span>
          </template>
          <template v-else-if="column.key === 'model'">
            <strong>{{ record.brand }}</strong>
            <span class="admin-muted-line">{{ record.model }}</span>
            <span class="admin-muted-line">{{ record.modelCode }}</span>
          </template>
          <template v-else-if="column.key === 'category'">
            <a-tag color="blue">{{ labelCategory(record.category) }}</a-tag>
            <a-tag>{{ record.qualityGrade }}</a-tag>
          </template>
          <template v-else-if="column.key === 'prices'">
            <strong>B2B {{ formatCurrency(record.b2bPrice) }}</strong>
            <span class="admin-muted-line">零售 {{ formatCurrency(record.retailPrice) }}</span>
          </template>
          <template v-else-if="column.key === 'stock'">
            <span>库存快照 {{ record.stockQty }}</span>
            <span class="admin-muted-line">{{ record.location || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'compliance'">
            <a-tag :color="record.isBattery ? 'red' : 'default'">{{ record.isBattery ? '电池' : '非电池' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">{{ labelProductStatus(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space wrap>
              <a-button size="small" @click="openEditor(record)">查看</a-button>
              <a-button size="small" type="primary" @click="restoreProduct(record)">恢复</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-drawer
      v-model:open="isDrawerOpen"
      class="admin-data-drawer admin-product-drawer"
      width="960"
      :title="editorMode === 'edit' ? '编辑商品 PIM' : editorMode === 'duplicate' ? '复制 SKU' : '新增商品'"
    >
      <a-form class="admin-product-form" layout="vertical">
        <section class="admin-product-form-section">
          <h3>基础信息</h3>
          <a-row :gutter="[8, 4]">
            <a-col :xs="24" :md="8">
              <a-form-item label="SKU">
                <a-input v-model:value="formState.skuCode" :disabled="editorMode === 'edit'" />
              </a-form-item>
            </a-col>
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
              <a-form-item label="库存状态">
                <a-select v-model:value="formState.stockStatus">
                  <a-select-option value="in_stock">现货</a-select-option>
                  <a-select-option value="low_stock">低库存</a-select-option>
                  <a-select-option value="out_of_stock">缺货</a-select-option>
                  <a-select-option value="incoming">在途</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="4">
              <a-form-item label="MOQ">
                <a-input-number v-model:value="formState.moq" :min="1" class="full-width" />
              </a-form-item>
            </a-col>
            <a-col :xs="12" :md="4">
              <a-form-item label="VAT">
                <a-select v-model:value="formState.vatMode">
                  <a-select-option value="IVA esclusa">IVA esclusa</a-select-option>
                  <a-select-option value="IVA inclusa">IVA inclusa</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="8">
              <a-form-item label="三级目录">
                <a-cascader
                  v-model:value="formState.taxonomyPath"
                  :options="taxonomyCascaderOptions"
                  placeholder="品牌 / 机型 / 分类"
                  change-on-select
                  class="full-width"
                  @change="handleTaxonomyPathChange"
                />
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
            <a-col :xs="24" :md="16">
              <a-form-item label="机型代码列表（每行一个）">
                <a-textarea v-model:value="formState.modelCodesText" :rows="2" />
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
            <a-col :xs="24" :md="8">
              <a-form-item label="阶梯价（minQty,unitPrice）">
                <a-textarea v-model:value="formState.tierPricesText" :rows="3" />
              </a-form-item>
            </a-col>
          </a-row>
        </section>

        <section class="admin-product-form-section">
          <h3>图片与合规资料</h3>
          <a-row :gutter="[8, 4]">
            <a-col :xs="24" :md="12">
              <a-form-item label="主图路径">
                <a-input v-model:value="formState.imagePath" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="图片 Alt">
                <a-input v-model:value="formState.imageAlt" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="上传主图">
                <label class="admin-upload-button">
                  {{ isUploadingImage ? '上传中...' : '选择图片' }}
                  <input type="file" accept="image/*" :disabled="isUploadingImage" @change="handleImageChange($event, 'main')" />
                </label>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :md="12">
              <a-form-item label="上传图库图片">
                <label class="admin-upload-button">
                  {{ isUploadingImage ? '上传中...' : '添加图库' }}
                  <input type="file" accept="image/*" :disabled="isUploadingImage" @change="handleImageChange($event, 'gallery')" />
                </label>
              </a-form-item>
            </a-col>
            <a-col :xs="24">
              <a-form-item label="图库路径（每行一个）">
                <a-textarea v-model:value="formState.galleryText" :rows="2" />
              </a-form-item>
            </a-col>
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
            <a-col :xs="24" :md="8">
              <a-form-item label="商品卖点">
                <a-textarea v-model:value="formState.highlightsText" :rows="3" />
              </a-form-item>
            </a-col>
          </a-row>
        </section>
      </a-form>

      <div class="admin-drawer-actions admin-product-actions">
        <a-space>
          <a-button @click="isDrawerOpen = false">取消</a-button>
          <a-button type="primary" :loading="isSaving" @click="saveProduct">保存商品</a-button>
        </a-space>
      </div>
    </a-drawer>
  </main>
</template>
