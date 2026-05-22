<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { DeleteOutlined } from '@ant-design/icons-vue'
import ProductCard from '@/components/ProductCard.vue'
import { fetchProducts } from '@/services/products.service'
import { useAuthStore } from '@/stores/auth.store'
import { useFavoritesStore } from '@/stores/favorites.store'
import { useUiStore } from '@/stores/ui.store'
import type { Product } from '@/types/product'

const authStore = useAuthStore()
const favoritesStore = useFavoritesStore()
const uiStore = useUiStore()
const products = ref<Product[]>([])
const isLoading = ref(false)

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      home: '首页',
      account: '客户中心',
      title: '常购清单',
      description: '保存维修门店经常采购的配件，快速复购并减少重复搜索。',
      count: '款常购商品',
      clear: '清空常购',
      empty: '还没有常购商品',
      emptyDescription: '在商品卡片点击星标后，会出现在这里。',
      browse: '去商品目录',
    }
  }

  return {
    home: 'Home',
    account: 'Area cliente',
    title: 'Lista frequenti',
    description: 'Salva i ricambi acquistati spesso e riordina senza ripetere la ricerca.',
    count: 'articoli frequenti',
    clear: 'Svuota lista',
    empty: 'Nessun articolo frequente',
    emptyDescription: 'Clicca la stella nelle schede prodotto per aggiungerli qui.',
    browse: 'Vai al catalogo',
  }
})

const favoriteProducts = computed(() => {
  const favoriteSet = new Set(favoritesStore.skuCodes)
  return products.value.filter((product) => favoriteSet.has(product.skuCode))
})

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
  <main class="frequent-page">
    <section class="frequent-head">
      <div>
        <a-breadcrumb>
          <a-breadcrumb-item>{{ copy.home }}</a-breadcrumb-item>
          <a-breadcrumb-item>{{ copy.account }}</a-breadcrumb-item>
          <a-breadcrumb-item>{{ copy.title }}</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.description }}</p>
      </div>
      <a-button
        v-if="favoriteProducts.length"
        danger
        size="small"
        @click="favoritesStore.clearFavorites"
      >
        <DeleteOutlined />
        {{ copy.clear }}
      </a-button>
    </section>

    <a-spin :spinning="isLoading">
      <section v-if="favoriteProducts.length" class="frequent-panel">
        <div class="frequent-toolbar">
          <strong>{{ favoriteProducts.length }} {{ copy.count }}</strong>
          <RouterLink to="/products">
            <a-button size="small">{{ copy.browse }}</a-button>
          </RouterLink>
        </div>
        <div class="product-grid is-grid-view frequent-product-grid">
          <ProductCard
            v-for="product in favoriteProducts"
            :key="product.skuCode"
            :product="product"
            :can-view-price="authStore.canViewCustomerPrices"
          />
        </div>
      </section>

      <a-empty v-else :description="copy.empty" class="frequent-empty">
        <template #description>
          <strong>{{ copy.empty }}</strong>
          <span>{{ copy.emptyDescription }}</span>
        </template>
        <RouterLink to="/products">
          <a-button type="primary">{{ copy.browse }}</a-button>
        </RouterLink>
      </a-empty>
    </a-spin>
  </main>
</template>
