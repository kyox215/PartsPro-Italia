<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  MinusOutlined,
  PlusOutlined,
  LockOutlined,
  ShoppingCartOutlined,
  StarOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import type { Product, StockStatus } from '@/types/product'
import { useCartStore } from '@/stores/cart.store'

const props = defineProps<{
  product: Product
  canViewPrice: boolean
}>()

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const hasImageError = ref(false)
const cartQuantity = computed(
  () => cartStore.items.find((item) => item.skuCode === props.product.skuCode)?.quantity || 0,
)
const productImageAlt = computed(
  () => props.product.imageAlt || `${props.product.brand} ${props.product.model} ${props.product.category}`,
)
const shouldShowImage = computed(() => Boolean(props.product.imageUrl) && !hasImageError.value)
const fallbackInitials = computed(() =>
  props.product.category
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase(),
)

const stockMeta: Record<StockStatus, { label: string; color: string }> = {
  in_stock: { label: 'Disponibile', color: 'success' },
  low_stock: { label: 'Scorte limitate', color: 'warning' },
  out_of_stock: { label: 'Esaurito', color: 'error' },
  incoming: { label: 'In arrivo', color: 'purple' },
}

const qualityColors: Record<string, string> = {
  'Original Pull': 'green',
  'Refurbished Original': 'blue',
  'Service Pack': 'geekblue',
  'Soft OLED': 'purple',
  'Hard OLED': 'indigo',
  'TFT / Incell': 'orange',
  'High Quality Compatible': 'cyan',
  'Compatible High Quality': 'cyan',
  Consumable: 'default',
}

function handleAddToCart() {
  if (!props.canViewPrice) {
    router.push({
      name: 'login',
      query: {
        returnUrl: route.fullPath,
      },
    })
    return
  }

  cartStore.addItem(props.product.skuCode, props.product.moq)
  message.success(`${props.product.skuCode} aggiunto al carrello`)
}

function handleIncreaseQuantity() {
  cartStore.addItem(props.product.skuCode, 1)
}

function handleDecreaseQuantity() {
  if (cartQuantity.value <= 1) {
    cartStore.removeItem(props.product.skuCode)
    return
  }

  cartStore.updateQuantity(props.product.skuCode, cartQuantity.value - 1)
}

watch(
  () => props.product.imageUrl,
  () => {
    hasImageError.value = false
  },
)
</script>

<template>
  <a-card class="product-card" hoverable>
    <RouterLink :to="`/products/${product.skuCode}`" class="product-card-link">
      <div class="product-media">
        <img
          v-if="shouldShowImage"
          :src="product.imageUrl"
          :alt="productImageAlt"
          loading="lazy"
          decoding="async"
          @error="hasImageError = true"
        />
        <div v-else class="product-media-fallback" aria-hidden="true">
          <span>{{ product.brand }}</span>
          <strong>{{ fallbackInitials }}</strong>
        </div>
        <a-tag :color="stockMeta[product.stockStatus].color" class="product-stock-pill">
          <span class="product-stock-dot" />
          {{ stockMeta[product.stockStatus].label }}
        </a-tag>
      </div>
      <div class="product-tags">
        <a-tag :color="qualityColors[product.qualityGrade] || 'blue'">
          {{ product.qualityGrade }}
        </a-tag>
      </div>
      <h3>{{ product.name }}</h3>
      <dl class="product-meta">
        <div>
          <dt>Modello</dt>
          <dd>{{ product.model }}</dd>
        </div>
      </dl>
    </RouterLink>

    <div class="product-buy-row">
      <div class="product-price">
        <template v-if="canViewPrice">
          <strong>€{{ product.b2bPrice.toFixed(2) }}</strong>
          <span>{{ product.vatMode }}</span>
        </template>
        <div v-else class="product-price-lock">
          <LockOutlined />
          <span>Login prezzo B2B</span>
        </div>
      </div>

      <div class="product-actions">
        <div v-if="canViewPrice && cartQuantity > 0" class="product-qty-control">
          <a-button size="small" @click="handleDecreaseQuantity">
            <MinusOutlined />
          </a-button>
          <strong>{{ cartQuantity }}</strong>
          <a-button size="small" @click="handleIncreaseQuantity">
            <PlusOutlined />
          </a-button>
        </div>
        <a-button
          v-else
          size="small"
          type="primary"
          :disabled="product.stockStatus === 'out_of_stock'"
          @click="handleAddToCart"
        >
          <ShoppingCartOutlined />
          {{ canViewPrice ? 'Add' : 'Login' }}
        </a-button>
        <a-button size="small" class="product-favorite-button">
          <StarOutlined />
        </a-button>
      </div>
    </div>
  </a-card>
</template>
