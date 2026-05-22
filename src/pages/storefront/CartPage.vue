<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons-vue'
import { useCartStore } from '@/stores/cart.store'
import { useUiStore } from '@/stores/ui.store'
import { resolveProductImageUrl } from '@/services/products.service'
import type { Product } from '@/types/product'

const cartStore = useCartStore()
const uiStore = useUiStore()
const failedImages = ref(new Set<string>())
const fallbackImages: Record<string, string> = {
  Screens: '/assets/product-screen.svg',
  Batteries: '/assets/product-battery.svg',
  'Charging Ports': '/assets/product-connector.svg',
  'Back Covers': '/assets/product-back-cover.svg',
  Cameras: '/assets/product-camera.svg',
  Tools: '/assets/product-part.svg',
}

const currency = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

const canCheckout = computed(() => cartStore.lines.length > 0 && !cartStore.hasBlockingIssues)
const blockingLinesCount = computed(
  () => cartStore.lines.filter((line) => line.isBelowMoq || line.isOutOfStock).length,
)
const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      home: '首页',
      cart: '购物车',
      title: '购物车',
      description: '结账前确认数量、MOQ、VAT 和库存状态。',
      continueShopping: '继续采购',
      empty: '购物车为空',
      goCatalog: '进入商品目录',
      itemTypes: '款商品',
      pieces: '件',
      toFix: '项需处理',
      ready: '可结账',
      product: '商品',
      quantity: '数量',
      price: '价格',
      total: '合计',
      outOfStock: '缺货',
      available: '有库存',
      moqIssue: '最低需要',
      piecesRequired: '件',
      removeOrAlternative: '请移除或选择替代商品',
      setMoq: '补足 MOQ',
      vatExcluded: '不含 VAT',
      summary: '汇总',
      subtotal: '小计',
      shipping: '配送',
      note: '最终价格将在结账时由后端重新计算。',
      checkout: '去结账',
      removeTitle: '移除此商品？',
      removeDescription: '数量低于 1 会从购物车移除此商品。',
      removeOk: '移除',
      clearTitle: '清空购物车？',
      clearDescription: '此操作会移除购物车内所有商品。',
      clearOk: '清空',
      cancel: '取消',
      clearCart: '清空购物车',
    }
  }

  return {
    home: 'Home',
    cart: 'Carrello',
    title: 'Carrello',
    description: 'Controlla quantita, MOQ, VAT e disponibilita prima del checkout.',
    continueShopping: 'Continua acquisti',
    empty: 'Il carrello e vuoto',
    goCatalog: 'Vai al catalogo',
    itemTypes: 'articoli',
    pieces: 'pezzi',
    toFix: 'da correggere',
    ready: 'Pronto checkout',
    product: 'Prodotto',
    quantity: 'Quantita',
    price: 'Prezzo',
    total: 'Totale',
    outOfStock: 'Esaurito',
    available: 'Disponibile',
    moqIssue: 'Minimo',
    piecesRequired: 'pezzi richiesto',
    removeOrAlternative: 'Rimuovi o scegli alternativa',
    setMoq: 'Porta a MOQ',
    vatExcluded: 'IVA escl.',
    summary: 'Riepilogo',
    subtotal: 'Subtotale',
    shipping: 'Spedizione',
    note: 'Prezzi ricalcolati dal backend RPC in checkout.',
    checkout: 'Vai al checkout',
    removeTitle: 'Rimuovere questo articolo?',
    removeDescription: 'Se la quantita scende sotto 1, l’articolo viene rimosso dal carrello.',
    removeOk: 'Rimuovi',
    clearTitle: 'Svuotare il carrello?',
    clearDescription: 'Questa azione rimuove tutti gli articoli dal carrello.',
    clearOk: 'Svuota',
    cancel: 'Annulla',
    clearCart: 'Svuota carrello',
  }
})

function handleQuantityChange(skuCode: string, value: number | string | null) {
  cartStore.updateQuantity(skuCode, Number(value || 1))
}

function increaseQuantity(skuCode: string) {
  const line = cartStore.lines.find((item) => item.product.skuCode === skuCode)
  cartStore.updateQuantity(skuCode, (line?.quantity || 0) + 1)
}

function decreaseQuantity(skuCode: string) {
  const line = cartStore.lines.find((item) => item.product.skuCode === skuCode)

  if (!line || line.quantity <= 1) {
    return
  }

  cartStore.updateQuantity(skuCode, line.quantity - 1)
}

function setToMoq(skuCode: string, moq: number) {
  cartStore.updateQuantity(skuCode, moq)
}

function getProductImageSrc(product: Product) {
  return resolveProductImageUrl(product)
}

function shouldShowImage(product: Product) {
  return Boolean(getProductImageSrc(product)) && !failedImages.value.has(product.skuCode)
}

function markImageFailed(skuCode: string) {
  failedImages.value = new Set([...failedImages.value, skuCode])
}

function getProductFallbackSrc(product: Product) {
  return fallbackImages[product.category] || '/assets/product-part.svg'
}
</script>

<template>
  <main class="cart-page" :class="{ 'has-fixed-summary': cartStore.lines.length > 0 }">
    <section class="cart-heading">
      <div>
        <a-breadcrumb>
          <a-breadcrumb-item>{{ copy.home }}</a-breadcrumb-item>
          <a-breadcrumb-item>{{ copy.cart }}</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.description }}</p>
      </div>
      <RouterLink to="/products">
        <a-button>{{ copy.continueShopping }}</a-button>
      </RouterLink>
    </section>

    <a-empty v-if="cartStore.lines.length === 0" :description="copy.empty">
      <RouterLink to="/products">
        <a-button type="primary">
          <ShoppingCartOutlined />
          {{ copy.goCatalog }}
        </a-button>
      </RouterLink>
    </a-empty>

    <section v-else class="cart-layout">
      <div class="cart-main">
        <div class="cart-compact-toolbar">
          <a-space wrap class="cart-status-chips">
            <a-tag color="blue">{{ cartStore.lines.length }} {{ copy.itemTypes }}</a-tag>
            <a-tag color="green">{{ cartStore.summary.totalQuantity }} {{ copy.pieces }}</a-tag>
            <a-tag :color="blockingLinesCount ? 'orange' : 'success'">
              {{ blockingLinesCount ? `${blockingLinesCount} ${copy.toFix}` : copy.ready }}
            </a-tag>
          </a-space>
        </div>

        <div class="cart-list-head">
          <span>{{ copy.product }}</span>
          <span>{{ copy.quantity }}</span>
          <span>{{ copy.price }}</span>
          <span>{{ copy.total }}</span>
          <span></span>
        </div>

        <div class="cart-lines">
          <a-card
            v-for="line in cartStore.lines"
            :key="line.product.skuCode"
            class="cart-line-card compact-cart-line-card"
          >
            <div
              class="cart-line"
              :class="{
                'cart-line-warning': line.isBelowMoq,
                'cart-line-error': line.isOutOfStock,
              }"
            >
              <div class="cart-line-info">
                <div class="cart-product-main">
                  <div
                    class="cart-line-media"
                    :style="{ '--cart-fallback-image': `url(${getProductFallbackSrc(line.product)})` }"
                  >
                    <img
                      v-if="shouldShowImage(line.product)"
                      :src="getProductImageSrc(line.product)"
                      :alt="line.product.imageAlt || line.product.name"
                      loading="lazy"
                      decoding="async"
                      @error="markImageFailed(line.product.skuCode)"
                    />
                    <img
                      v-else
                      class="cart-line-fallback-image"
                      :src="getProductFallbackSrc(line.product)"
                      :alt="line.product.name"
                      loading="lazy"
                      decoding="async"
                    />
                    <i
                      class="cart-line-stock-dot"
                      :class="{
                        'is-warning': line.product.stockStatus === 'low_stock',
                        'is-error': line.isOutOfStock,
                        'is-incoming': line.product.stockStatus === 'incoming',
                      }"
                      aria-hidden="true"
                    />
                  </div>
                  <div class="cart-product-copy">
                    <div class="cart-line-tags">
                      <a-tag color="blue">{{ line.product.brand }}</a-tag>
                      <a-tag>{{ line.product.category }}</a-tag>
                      <a-tag :color="line.isOutOfStock ? 'error' : 'success'">
                        {{ line.isOutOfStock ? copy.outOfStock : copy.available }}
                      </a-tag>
                    </div>
                    <h2>{{ line.product.name }}</h2>
                    <p>
                      <span>{{ line.product.qualityGrade }}</span>
                      <span>{{ line.product.model }}</span>
                      <span v-if="line.product.moq > 1">MOQ {{ line.product.moq }}</span>
                    </p>
                    <div v-if="line.isBelowMoq || line.isOutOfStock" class="cart-line-issue">
                      <span v-if="line.isBelowMoq">
                        {{ copy.moqIssue }} {{ line.product.moq }} {{ copy.piecesRequired }}
                      </span>
                      <span v-if="line.isOutOfStock">{{ copy.removeOrAlternative }}</span>
                      <a-button
                        v-if="line.isBelowMoq"
                        size="small"
                        type="link"
                        @click="setToMoq(line.product.skuCode, line.product.moq)"
                      >
                        {{ copy.setMoq }}
                      </a-button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="cart-line-qty">
                <a-popconfirm
                  v-if="line.quantity <= 1"
                  :title="copy.removeTitle"
                  :description="copy.removeDescription"
                  :ok-text="copy.removeOk"
                  :cancel-text="copy.cancel"
                  placement="top"
                  @confirm="cartStore.removeItem(line.product.skuCode)"
                >
                  <a-button size="small">
                    <MinusOutlined />
                  </a-button>
                </a-popconfirm>
                <a-button v-else size="small" @click="decreaseQuantity(line.product.skuCode)">
                  <MinusOutlined />
                </a-button>
                <a-input-number
                  size="small"
                  :min="1"
                  :value="line.quantity"
                  @change="(value: number | string | null) => handleQuantityChange(line.product.skuCode, value)"
                />
                <a-button size="small" @click="increaseQuantity(line.product.skuCode)">
                  <PlusOutlined />
                </a-button>
              </div>

              <div class="cart-line-unit">
                <strong>{{ currency.format(line.unitPrice) }}</strong>
                <span>{{ copy.vatExcluded }}</span>
              </div>

              <div class="cart-line-subtotal">
                <strong>{{ currency.format(line.subtotal) }}</strong>
              </div>

              <a-popconfirm
                :title="copy.removeTitle"
                :description="copy.removeDescription"
                :ok-text="copy.removeOk"
                :cancel-text="copy.cancel"
                placement="topRight"
                @confirm="cartStore.removeItem(line.product.skuCode)"
              >
                <a-button
                  class="cart-line-remove"
                  size="small"
                  danger
                >
                  <DeleteOutlined />
                </a-button>
              </a-popconfirm>
            </div>
          </a-card>
        </div>
      </div>

      <aside class="order-summary">
        <a-card class="summary-card" :title="copy.summary">
          <div class="summary-line">
            <span>{{ copy.subtotal }}</span>
            <strong>{{ currency.format(cartStore.summary.subtotal) }}</strong>
          </div>
          <div class="summary-line">
            <span>IVA 22%</span>
            <strong>{{ currency.format(cartStore.summary.vat) }}</strong>
          </div>
          <div class="summary-line">
            <span>{{ copy.shipping }}</span>
            <strong>{{ currency.format(cartStore.summary.shipping) }}</strong>
          </div>
          <div class="summary-line summary-total">
            <span>{{ copy.total }}</span>
            <strong>{{ currency.format(cartStore.summary.total) }}</strong>
          </div>
          <div class="summary-note">
            {{ copy.note }}
          </div>
          <RouterLink to="/checkout">
            <a-button type="primary" block size="large" :disabled="!canCheckout">
              {{ copy.checkout }}
            </a-button>
          </RouterLink>
          <div class="summary-danger-zone">
            <a-popconfirm
              :title="copy.clearTitle"
              :description="copy.clearDescription"
              :ok-text="copy.clearOk"
              :cancel-text="copy.cancel"
              placement="topRight"
              @confirm="cartStore.clearCart"
            >
              <a-button type="link" danger size="small">
                <DeleteOutlined />
                {{ copy.clearCart }}
              </a-button>
            </a-popconfirm>
          </div>
        </a-card>
      </aside>
    </section>
  </main>
</template>
