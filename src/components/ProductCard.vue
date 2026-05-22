<script setup lang="ts">
import {
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
</script>

<template>
  <a-card class="product-card" hoverable>
    <RouterLink :to="`/products/${product.skuCode}`" class="product-card-link">
      <div class="product-thumb">
        <span>{{ product.brand }}</span>
        <strong>{{ product.category }}</strong>
      </div>
      <div class="product-tags">
        <a-tag :color="qualityColors[product.qualityGrade] || 'blue'">
          {{ product.qualityGrade }}
        </a-tag>
        <a-tag :color="stockMeta[product.stockStatus].color">
          {{ stockMeta[product.stockStatus].label }}
        </a-tag>
      </div>
      <h3>{{ product.name }}</h3>
      <dl class="product-meta">
        <div>
          <dt>SKU</dt>
          <dd>{{ product.skuCode }}</dd>
        </div>
        <div>
          <dt>Modello</dt>
          <dd>{{ product.model }}</dd>
        </div>
        <div>
          <dt>Colore</dt>
          <dd>{{ product.color }}</dd>
        </div>
      </dl>
    </RouterLink>

    <div class="product-price">
      <template v-if="canViewPrice">
        <strong>€{{ product.b2bPrice.toFixed(2) }}</strong>
        <span>{{ product.vatMode }}</span>
      </template>
      <a-alert v-else type="info" show-icon>
        <template #icon>
          <LockOutlined />
        </template>
        <template #message>Accedi per vedere il prezzo B2B</template>
      </a-alert>
    </div>

    <div class="product-actions">
      <a-input-number :min="product.moq" :value="product.moq" />
      <a-button
        type="primary"
        :disabled="product.stockStatus === 'out_of_stock'"
        @click="handleAddToCart"
      >
        <ShoppingCartOutlined />
        {{ canViewPrice ? 'Add' : 'Login' }}
      </a-button>
      <a-button>
        <StarOutlined />
      </a-button>
    </div>
  </a-card>
</template>
