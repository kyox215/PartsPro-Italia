<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { FilterOutlined } from '@ant-design/icons-vue'
import ProductCard from '@/components/ProductCard.vue'
import { fetchProducts } from '@/services/products.service'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { Product } from '@/types/product'

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUiStore()
const isFilterDrawerOpen = ref(false)
const selectedBrand = ref<string>()
const selectedModel = ref<string>()
const selectedCategory = ref<string>()
const selectedStock = ref<string>()
const isLoading = ref(false)
const viewMode = ref<'grid' | 'list'>('grid')

const products = ref<Product[]>([])

const categorySlugMap: Record<string, string> = {
  screens: 'Screens',
  batteries: 'Batteries',
  'charging-ports': 'Charging Ports',
  tools: 'Tools',
  cameras: 'Cameras',
  'back-cover': 'Back Covers',
  'back-covers': 'Back Covers',
}

const brands = computed(() => [...new Set(products.value.map((product) => product.brand))])
const models = computed(() =>
  [
    ...new Set(
      products.value
        .filter((product) => !selectedBrand.value || product.brand === selectedBrand.value)
        .map((product) => product.model),
    ),
  ],
)
const categories = computed(() => [...new Set(products.value.map((product) => product.category))])

const query = computed(() => String(route.query.q || ''))
const canViewPrice = computed(() => authStore.canViewCustomerPrices)
const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      home: '首页',
      catalog: '商品目录',
      title: '商品目录',
      description: '按型号、品质和库存状态筛选商品。B2B 批发价仅登录后可见。',
      filters: '筛选',
      clear: '清空',
      brand: '品牌',
      allBrands: '全部品牌',
      model: '机型',
      allModels: '全部机型',
      category: '品类',
      allCategories: '全部品类',
      availability: '库存状态',
      allStock: '全部库存',
      inStock: '有库存',
      lowStock: '库存紧张',
      outOfStock: '缺货',
      incoming: '即将到货',
      products: '款商品',
      grid: '网格',
      list: '列表',
      empty: '没有找到商品',
      clearFilters: '清空筛选',
    }
  }

  return {
    home: 'Home',
    catalog: 'Catalogo',
    title: 'Catalogo prodotti',
    description: 'Cerca per modello, qualita e disponibilita. I prezzi B2B sono visibili solo dopo login.',
    filters: 'Filtri',
    clear: 'Cancella',
    brand: 'Brand',
    allBrands: 'Tutti i brand',
    model: 'Modello',
    allModels: 'Tutti i modelli',
    category: 'Categoria',
    allCategories: 'Tutte le categorie',
    availability: 'Disponibilita',
    allStock: 'Tutti gli stock',
    inStock: 'Disponibile',
    lowStock: 'Scorte limitate',
    outOfStock: 'Esaurito',
    incoming: 'In arrivo',
    products: 'articoli',
    grid: 'Grid',
    list: 'List',
    empty: 'Nessun prodotto trovato',
    clearFilters: 'Cancella filtri',
  }
})

const filteredProducts = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()

  return products.value.filter((product) => {
    const haystack = [
      product.name,
      product.skuCode,
      product.brand,
      product.model,
      product.category,
      product.qualityGrade,
      product.color,
      ...product.modelCodes,
    ]
      .join(' ')
      .toLowerCase()

    return (
      (!normalizedQuery || haystack.includes(normalizedQuery)) &&
      (!selectedBrand.value || product.brand === selectedBrand.value) &&
      (!selectedModel.value || product.model === selectedModel.value) &&
      (!selectedCategory.value || product.category === selectedCategory.value) &&
      (!selectedStock.value || product.stockStatus === selectedStock.value)
    )
  })
})
const viewModeOptions = computed(() => [
  { label: copy.value.grid, value: 'grid' },
  { label: copy.value.list, value: 'list' },
])

function clearFilters() {
  selectedBrand.value = undefined
  selectedModel.value = undefined
  selectedCategory.value = undefined
  selectedStock.value = undefined
}

function syncRouteFilters() {
  selectedBrand.value = String(route.query.brand || '') || undefined
  selectedModel.value = String(route.query.model || '') || undefined
  const category = String(route.query.category || '')
  selectedCategory.value = category ? categorySlugMap[category] || category : undefined
}

async function loadProducts() {
  isLoading.value = true
  try {
    products.value = await fetchProducts()
  } finally {
    isLoading.value = false
  }
}

onMounted(loadProducts)
watch(() => [route.query.brand, route.query.model, route.query.category], syncRouteFilters, { immediate: true })
watch(selectedBrand, () => {
  if (selectedModel.value && !models.value.includes(selectedModel.value)) {
    selectedModel.value = undefined
  }
})
</script>

<template>
  <main class="products-page">
    <section class="catalog-heading">
      <div>
          <a-breadcrumb>
          <a-breadcrumb-item>{{ copy.home }}</a-breadcrumb-item>
          <a-breadcrumb-item>{{ copy.catalog }}</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.description }}</p>
      </div>
      <a-button class="mobile-filter-button" @click="isFilterDrawerOpen = true">
        <FilterOutlined />
        {{ copy.filters }}
      </a-button>
    </section>

    <section class="catalog-layout">
      <aside class="filter-panel">
        <div class="filter-heading">
          <h2>{{ copy.filters }}</h2>
          <a-button type="link" @click="clearFilters">{{ copy.clear }}</a-button>
        </div>
        <a-form layout="vertical">
          <a-form-item :label="copy.brand">
            <a-select
              v-model:value="selectedBrand"
              allow-clear
              :placeholder="copy.allBrands"
              :options="brands.map((brand) => ({ label: brand, value: brand }))"
            />
          </a-form-item>
          <a-form-item :label="copy.model">
            <a-select
              v-model:value="selectedModel"
              allow-clear
              :placeholder="copy.allModels"
              :options="models.map((model) => ({ label: model, value: model }))"
            />
          </a-form-item>
          <a-form-item :label="copy.category">
            <a-select
              v-model:value="selectedCategory"
              allow-clear
              :placeholder="copy.allCategories"
              :options="categories.map((category) => ({ label: category, value: category }))"
            />
          </a-form-item>
          <a-form-item :label="copy.availability">
            <a-select
              v-model:value="selectedStock"
              allow-clear
              :placeholder="copy.allStock"
              :options="[
                { label: copy.inStock, value: 'in_stock' },
                { label: copy.lowStock, value: 'low_stock' },
                { label: copy.outOfStock, value: 'out_of_stock' },
                { label: copy.incoming, value: 'incoming' },
              ]"
            />
          </a-form-item>
        </a-form>
      </aside>

      <div class="catalog-results">
        <div class="results-toolbar">
          <span>{{ filteredProducts.length }} {{ copy.products }}</span>
          <a-segmented v-model:value="viewMode" :options="viewModeOptions" />
        </div>
        <a-spin :spinning="isLoading">
        <div class="product-grid" :class="`is-${viewMode}-view`">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.skuCode"
            :product="product"
            :can-view-price="canViewPrice"
          />
        </div>
        </a-spin>
        <a-empty v-if="filteredProducts.length === 0" :description="copy.empty" />
      </div>
    </section>

    <a-drawer v-model:open="isFilterDrawerOpen" :title="copy.filters" placement="bottom" height="80%">
      <a-form layout="vertical">
        <a-form-item :label="copy.brand">
          <a-select
            v-model:value="selectedBrand"
            allow-clear
            :placeholder="copy.allBrands"
            :options="brands.map((brand) => ({ label: brand, value: brand }))"
          />
        </a-form-item>
        <a-form-item :label="copy.model">
          <a-select
            v-model:value="selectedModel"
            allow-clear
            :placeholder="copy.allModels"
            :options="models.map((model) => ({ label: model, value: model }))"
          />
        </a-form-item>
        <a-form-item :label="copy.category">
          <a-select
            v-model:value="selectedCategory"
            allow-clear
            :placeholder="copy.allCategories"
            :options="categories.map((category) => ({ label: category, value: category }))"
          />
        </a-form-item>
        <a-form-item :label="copy.availability">
          <a-select
            v-model:value="selectedStock"
            allow-clear
            :placeholder="copy.allStock"
            :options="[
              { label: copy.inStock, value: 'in_stock' },
              { label: copy.lowStock, value: 'low_stock' },
              { label: copy.outOfStock, value: 'out_of_stock' },
              { label: copy.incoming, value: 'incoming' },
            ]"
          />
        </a-form-item>
        <a-button block @click="clearFilters">{{ copy.clearFilters }}</a-button>
      </a-form>
    </a-drawer>
  </main>
</template>
