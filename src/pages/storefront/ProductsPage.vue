<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FilterOutlined } from '@ant-design/icons-vue'
import ProductCard from '@/components/ProductCard.vue'
import { fetchProducts } from '@/services/products.service'
import { useAuthStore } from '@/stores/auth.store'
import type { Product } from '@/types/product'

const route = useRoute()
const authStore = useAuthStore()
const isFilterDrawerOpen = ref(false)
const selectedBrand = ref<string>()
const selectedCategory = ref<string>()
const selectedStock = ref<string>()
const isLoading = ref(false)

const products = ref<Product[]>([])

const brands = computed(() => [...new Set(products.value.map((product) => product.brand))])
const categories = computed(() => [...new Set(products.value.map((product) => product.category))])

const query = computed(() => String(route.query.q || ''))
const canViewPrice = computed(() => authStore.canViewCustomerPrices)

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
      (!selectedCategory.value || product.category === selectedCategory.value) &&
      (!selectedStock.value || product.stockStatus === selectedStock.value)
    )
  })
})

function clearFilters() {
  selectedBrand.value = undefined
  selectedCategory.value = undefined
  selectedStock.value = undefined
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
</script>

<template>
  <main class="products-page">
    <section class="catalog-heading">
      <div>
        <a-breadcrumb>
          <a-breadcrumb-item>Home</a-breadcrumb-item>
          <a-breadcrumb-item>Catalogo</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>Catalogo prodotti</h1>
        <p>
          Cerca per modello, SKU, qualita e disponibilita. I prezzi B2B sono visibili
          solo dopo login.
        </p>
      </div>
      <a-button class="mobile-filter-button" @click="isFilterDrawerOpen = true">
        <FilterOutlined />
        Filtri
      </a-button>
    </section>

    <section class="catalog-layout">
      <aside class="filter-panel">
        <div class="filter-heading">
          <h2>Filtri</h2>
          <a-button type="link" @click="clearFilters">Cancella</a-button>
        </div>
        <a-form layout="vertical">
          <a-form-item label="Brand">
            <a-select
              v-model:value="selectedBrand"
              allow-clear
              placeholder="Tutti i brand"
              :options="brands.map((brand) => ({ label: brand, value: brand }))"
            />
          </a-form-item>
          <a-form-item label="Categoria">
            <a-select
              v-model:value="selectedCategory"
              allow-clear
              placeholder="Tutte le categorie"
              :options="categories.map((category) => ({ label: category, value: category }))"
            />
          </a-form-item>
          <a-form-item label="Disponibilita">
            <a-select
              v-model:value="selectedStock"
              allow-clear
              placeholder="Tutti gli stock"
              :options="[
                { label: 'Disponibile', value: 'in_stock' },
                { label: 'Scorte limitate', value: 'low_stock' },
                { label: 'Esaurito', value: 'out_of_stock' },
                { label: 'In arrivo', value: 'incoming' },
              ]"
            />
          </a-form-item>
        </a-form>
      </aside>

      <div class="catalog-results">
        <div class="results-toolbar">
          <span>{{ filteredProducts.length }} SKU</span>
          <a-segmented :options="['Grid', 'List']" value="Grid" />
        </div>
        <a-spin :spinning="isLoading">
        <div class="product-grid">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.skuCode"
            :product="product"
            :can-view-price="canViewPrice"
          />
        </div>
        </a-spin>
        <a-empty v-if="filteredProducts.length === 0" description="Nessun prodotto trovato" />
      </div>
    </section>

    <a-drawer v-model:open="isFilterDrawerOpen" title="Filtri" placement="bottom" height="80%">
      <a-form layout="vertical">
        <a-form-item label="Brand">
          <a-select
            v-model:value="selectedBrand"
            allow-clear
            placeholder="Tutti i brand"
            :options="brands.map((brand) => ({ label: brand, value: brand }))"
          />
        </a-form-item>
        <a-form-item label="Categoria">
          <a-select
            v-model:value="selectedCategory"
            allow-clear
            placeholder="Tutte le categorie"
            :options="categories.map((category) => ({ label: category, value: category }))"
          />
        </a-form-item>
        <a-form-item label="Disponibilita">
          <a-select
            v-model:value="selectedStock"
            allow-clear
            placeholder="Tutti gli stock"
            :options="[
              { label: 'Disponibile', value: 'in_stock' },
              { label: 'Scorte limitate', value: 'low_stock' },
              { label: 'Esaurito', value: 'out_of_stock' },
              { label: 'In arrivo', value: 'incoming' },
            ]"
          />
        </a-form-item>
        <a-button block @click="clearFilters">Cancella filtri</a-button>
      </a-form>
    </a-drawer>
  </main>
</template>
