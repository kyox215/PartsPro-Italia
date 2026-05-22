<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LockOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue'
import { fetchProductBySku } from '@/services/products.service'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import type { Product } from '@/types/product'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const product = ref<Product>()
const isLoading = ref(false)

const skuCode = computed(() => String(route.params.skuCode || ''))
const canViewPrice = computed(() => authStore.canViewCustomerPrices)

async function loadProduct() {
  isLoading.value = true
  try {
    product.value = await fetchProductBySku(skuCode.value)
  } finally {
    isLoading.value = false
  }
}

function handleAddToCart() {
  if (!canViewPrice.value) {
    router.push({
      name: 'login',
      query: {
        returnUrl: route.fullPath,
      },
    })
    return
  }

  if (!product.value) {
    return
  }

  cartStore.addItem(product.value.skuCode, product.value.moq)
  message.success(`${product.value.skuCode} aggiunto al carrello`)
}

onMounted(loadProduct)
watch(skuCode, loadProduct)
</script>

<template>
  <a-spin :spinning="isLoading">
  <main v-if="product" class="product-detail-page">
    <a-breadcrumb>
      <a-breadcrumb-item>Home</a-breadcrumb-item>
      <a-breadcrumb-item>Catalogo</a-breadcrumb-item>
      <a-breadcrumb-item>{{ product.skuCode }}</a-breadcrumb-item>
    </a-breadcrumb>

    <section class="product-detail-hero">
      <div class="detail-gallery">
        <div class="detail-image">
          <span>{{ product.brand }}</span>
          <strong>{{ product.category }}</strong>
          <small>{{ product.skuCode }}</small>
        </div>
        <div class="thumb-row">
          <div v-for="item in 4" :key="item" class="thumb-box" />
        </div>
      </div>

      <aside class="purchase-panel">
        <a-space wrap>
          <a-tag color="purple">{{ product.qualityGrade }}</a-tag>
          <a-tag>{{ product.stockStatus }}</a-tag>
        </a-space>
        <h1>{{ product.name }}</h1>
        <p class="sku-line">SKU: {{ product.skuCode }}</p>

        <div class="detail-price">
          <template v-if="canViewPrice">
            <strong>€{{ product.b2bPrice.toFixed(2) }}</strong>
            <span>{{ product.vatMode }}</span>
          </template>
          <a-alert v-else type="info" show-icon>
            <template #icon>
              <LockOutlined />
            </template>
            <template #message>Accedi per vedere il prezzo B2B</template>
            <template #description>
              I visitatori possono consultare il catalogo pubblico; i prezzi sono riservati
              ai clienti approvati.
            </template>
          </a-alert>
        </div>

        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item label="MOQ">{{ product.moq }}</a-descriptions-item>
          <a-descriptions-item label="Colore">{{ product.color }}</a-descriptions-item>
          <a-descriptions-item label="Frame">{{ product.frame }}</a-descriptions-item>
          <a-descriptions-item label="Garanzia">{{ product.warrantyDays }} giorni</a-descriptions-item>
        </a-descriptions>

        <a-space class="purchase-actions" wrap>
          <a-input-number :min="product.moq" :value="product.moq" />
          <a-button type="primary" size="large" @click="handleAddToCart">
            <ShoppingCartOutlined />
            {{ canViewPrice ? 'Add to Cart' : 'Accedi per aggiungere' }}
          </a-button>
        </a-space>
      </aside>
    </section>

    <a-tabs class="detail-tabs">
      <a-tab-pane key="compatibility" tab="Compatibilita">
        <a-table
          :columns="[
            { title: 'Modello', dataIndex: 'model' },
            { title: 'Codice', dataIndex: 'code' },
            { title: 'Note', dataIndex: 'note' },
          ]"
          :data-source="product.compatibility"
          :pagination="false"
          row-key="model"
        />
      </a-tab-pane>
      <a-tab-pane key="quality" tab="Qualita">
        <a-alert
          type="info"
          show-icon
          message="Qualita dichiarata"
          :description="`${product.qualityGrade}: verificare sempre modello, codice e versione prima dell'ordine.`"
        />
      </a-tab-pane>
      <a-tab-pane key="rma" tab="Installazione e RMA">
        <a-space direction="vertical" :size="16">
          <a-alert
            type="warning"
            show-icon
            message="Testare prima dell'installazione"
            description="Collegare il componente alla scheda madre e verificare display, touch, luminosita, sensori e connettori prima dell'installazione definitiva."
          />
          <a-alert
            v-if="product.category === 'Batteries'"
            type="error"
            show-icon
            message="Sicurezza batteria"
            description="Non piegare, forare, schiacciare, cortocircuitare o riscaldare la batteria."
          />
        </a-space>
      </a-tab-pane>
    </a-tabs>
  </main>

  <a-result
    v-else-if="!isLoading"
    status="404"
    title="SKU non trovato"
    sub-title="Il prodotto richiesto non esiste."
  />
  </a-spin>
</template>
