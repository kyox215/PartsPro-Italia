<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LockOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue'
import { fetchProductByRef, resolveProductImageUrl } from '@/services/products.service'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { useUiStore } from '@/stores/ui.store'
import type { Product } from '@/types/product'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const uiStore = useUiStore()
const product = ref<Product>()
const isLoading = ref(false)
const purchaseQuantity = ref(1)
const failedImage = ref(false)

const productRef = computed(() => String(route.params.productRef || ''))
const canViewPrice = computed(() => authStore.canViewCustomerPrices)
const vatLabel = computed(() => (uiStore.language === 'zh' ? '不含 VAT' : product.value?.vatMode || ''))
const stockLabel = computed(() => {
  if (!product.value) {
    return ''
  }

  const zhStockLabels: Record<Product['stockStatus'], string> = {
    in_stock: '有库存',
    low_stock: '库存紧张',
    out_of_stock: '缺货',
    incoming: '即将到货',
  }

  const itStockLabels: Record<Product['stockStatus'], string> = {
    in_stock: 'Disponibile',
    low_stock: 'Scorte limitate',
    out_of_stock: 'Esaurito',
    incoming: 'In arrivo',
  }

  return uiStore.language === 'zh' ? zhStockLabels[product.value.stockStatus] : itStockLabels[product.value.stockStatus]
})
const frameLabel = computed(() => {
  if (!product.value || uiStore.language !== 'zh') {
    return product.value?.frame || ''
  }

  return {
    'With Frame': '带框',
    'Without Frame': '不带框',
    'N/A': '不适用',
  }[product.value.frame]
})
const compatibilityRows = computed(() =>
  (product.value?.compatibility || []).map((item) => ({
    ...item,
    note:
      uiStore.language === 'zh'
        ? item.note
            .replace('Compatibile', '兼容')
            .replace('Non compatibile', '不兼容')
            .replace('Verificare connettore', '请确认接口')
            .replace('Verificare versione', '请确认版本')
        : item.note,
  })),
)
const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      home: '首页',
      catalog: '商品目录',
      loginPrice: '登录查看 B2B 批发价',
      loginPriceDescription: '访客可以浏览公开目录；价格仅对已审核客户开放。',
      moq: 'MOQ',
      color: '颜色',
      frame: '边框',
      warranty: '质保',
      days: '天',
      addToCart: '加入购物车',
      loginToAdd: '登录后加购',
      compatibility: '兼容性',
      model: '型号',
      code: '机型代码',
      note: '备注',
      quality: '质量说明',
      qualityMessage: '质量等级',
      qualityDescription: '下单前请确认型号、机型代码和版本。',
      rma: '安装与 RMA',
      installTitle: '安装前先测试',
      installText: '最终安装前请连接主板并检查显示、触控、亮度、传感器和接口。',
      batteryTitle: '电池安全',
      batteryText: '不要弯折、刺穿、挤压、短路或加热电池。',
      notFoundTitle: '商品未找到',
      notFoundSubtitle: '请求的商品不存在或已下架。',
    }
  }

  return {
    home: 'Home',
    catalog: 'Catalogo',
    loginPrice: 'Accedi per vedere il prezzo B2B',
    loginPriceDescription: 'I visitatori possono consultare il catalogo pubblico; i prezzi sono riservati ai clienti approvati.',
    moq: 'MOQ',
    color: 'Colore',
    frame: 'Frame',
    warranty: 'Garanzia',
    days: 'giorni',
    addToCart: 'Aggiungi',
    loginToAdd: 'Accedi per aggiungere',
    compatibility: 'Compatibilita',
    model: 'Modello',
    code: 'Codice modello',
    note: 'Note',
    quality: 'Qualita',
    qualityMessage: 'Qualita dichiarata',
    qualityDescription: 'Verificare sempre modello, codice e versione prima dell ordine.',
    rma: 'Installazione e RMA',
    installTitle: 'Testare prima dell installazione',
    installText: 'Collegare il componente alla scheda madre e verificare display, touch, luminosita, sensori e connettori prima dell installazione definitiva.',
    batteryTitle: 'Sicurezza batteria',
    batteryText: 'Non piegare, forare, schiacciare, cortocircuitare o riscaldare la batteria.',
    notFoundTitle: 'Prodotto non trovato',
    notFoundSubtitle: 'Il prodotto richiesto non esiste o non e piu disponibile.',
  }
})

async function loadProduct() {
  isLoading.value = true
  try {
    product.value = await fetchProductByRef(productRef.value, { includePrices: canViewPrice.value })
    purchaseQuantity.value = product.value?.moq || 1
    failedImage.value = false
  } finally {
    isLoading.value = false
  }
}

function getProductImageSrc() {
  if (!product.value || failedImage.value) {
    return ''
  }

  return resolveProductImageUrl(product.value)
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

  cartStore.addItem(product.value.skuCode, purchaseQuantity.value)
  message.success(uiStore.language === 'zh' ? '已加入购物车' : 'Articolo aggiunto al carrello')
}

onMounted(loadProduct)
watch(productRef, loadProduct)
</script>

<template>
  <a-spin :spinning="isLoading">
  <main v-if="product" class="product-detail-page">
    <a-breadcrumb>
      <a-breadcrumb-item>{{ copy.home }}</a-breadcrumb-item>
      <a-breadcrumb-item>{{ copy.catalog }}</a-breadcrumb-item>
      <a-breadcrumb-item>{{ product.model }}</a-breadcrumb-item>
    </a-breadcrumb>

    <section class="product-detail-hero">
      <div class="detail-gallery">
        <div class="detail-image">
          <img
            v-if="getProductImageSrc()"
            :src="getProductImageSrc()"
            :alt="product.imageAlt || product.name"
            loading="eager"
            @error="failedImage = true"
          />
          <template v-else>
            <span>{{ product.brand }}</span>
            <strong>{{ product.category }}</strong>
          </template>
        </div>
        <div class="thumb-row">
          <div v-for="item in 4" :key="item" class="thumb-box" />
        </div>
      </div>

      <aside class="purchase-panel">
        <a-space wrap>
          <a-tag color="purple">{{ product.qualityGrade }}</a-tag>
          <a-tag>{{ stockLabel }}</a-tag>
        </a-space>
        <h1>{{ product.name }}</h1>

        <div class="detail-price">
          <template v-if="canViewPrice">
            <strong>€{{ product.b2bPrice.toFixed(2) }}</strong>
            <span>{{ vatLabel }}</span>
          </template>
          <a-alert v-else type="info" show-icon>
            <template #icon>
              <LockOutlined />
            </template>
            <template #message>{{ copy.loginPrice }}</template>
            <template #description>{{ copy.loginPriceDescription }}</template>
          </a-alert>
        </div>

        <a-descriptions :column="1" size="small" bordered>
          <a-descriptions-item :label="copy.moq">{{ product.moq }}</a-descriptions-item>
          <a-descriptions-item :label="copy.color">{{ product.color }}</a-descriptions-item>
          <a-descriptions-item :label="copy.frame">{{ frameLabel }}</a-descriptions-item>
          <a-descriptions-item :label="copy.warranty">{{ product.warrantyDays }} {{ copy.days }}</a-descriptions-item>
        </a-descriptions>

        <a-space class="purchase-actions" wrap>
          <a-input-number v-model:value="purchaseQuantity" :min="product.moq" />
          <a-button type="primary" size="large" @click="handleAddToCart">
            <ShoppingCartOutlined />
            {{ canViewPrice ? copy.addToCart : copy.loginToAdd }}
          </a-button>
        </a-space>
      </aside>
    </section>

    <a-tabs class="detail-tabs">
      <a-tab-pane key="compatibility" :tab="copy.compatibility">
        <a-table
          :columns="[
            { title: copy.model, dataIndex: 'model' },
            { title: copy.code, dataIndex: 'code' },
            { title: copy.note, dataIndex: 'note' },
          ]"
          :data-source="compatibilityRows"
          :pagination="false"
          row-key="model"
        />
      </a-tab-pane>
      <a-tab-pane key="quality" :tab="copy.quality">
        <a-alert
          type="info"
          show-icon
          :message="copy.qualityMessage"
          :description="`${product.qualityGrade}: ${copy.qualityDescription}`"
        />
      </a-tab-pane>
      <a-tab-pane key="rma" :tab="copy.rma">
        <a-space direction="vertical" :size="16">
          <a-alert
            type="warning"
            show-icon
            :message="copy.installTitle"
            :description="copy.installText"
          />
          <a-alert
            v-if="product.category === 'Batteries'"
            type="error"
            show-icon
            :message="copy.batteryTitle"
            :description="copy.batteryText"
          />
        </a-space>
      </a-tab-pane>
    </a-tabs>
  </main>

  <a-result
    v-else-if="!isLoading"
    status="404"
    :title="copy.notFoundTitle"
    :sub-title="copy.notFoundSubtitle"
  />
  </a-spin>
</template>
