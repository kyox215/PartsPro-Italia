<script setup lang="ts">
import { computed } from 'vue'
import {
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons-vue'
import { useCartStore } from '@/stores/cart.store'

const cartStore = useCartStore()

const currency = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

const canCheckout = computed(() => cartStore.lines.length > 0 && !cartStore.hasBlockingIssues)
const blockingLinesCount = computed(
  () => cartStore.lines.filter((line) => line.isBelowMoq || line.isOutOfStock).length,
)

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
    cartStore.removeItem(skuCode)
    return
  }

  cartStore.updateQuantity(skuCode, line.quantity - 1)
}

function setToMoq(skuCode: string, moq: number) {
  cartStore.updateQuantity(skuCode, moq)
}
</script>

<template>
  <main class="cart-page">
    <section class="cart-heading">
      <div>
        <a-breadcrumb>
          <a-breadcrumb-item>Home</a-breadcrumb-item>
          <a-breadcrumb-item>Carrello</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>Carrello</h1>
        <p>Controlla quantita, MOQ, VAT e disponibilita prima del checkout.</p>
      </div>
      <RouterLink to="/products">
        <a-button>Continua acquisti</a-button>
      </RouterLink>
    </section>

    <a-empty v-if="cartStore.lines.length === 0" description="Il carrello e vuoto">
      <RouterLink to="/products">
        <a-button type="primary">
          <ShoppingCartOutlined />
          Vai al catalogo
        </a-button>
      </RouterLink>
    </a-empty>

    <section v-else class="cart-layout">
      <div class="cart-main">
        <div class="cart-compact-toolbar">
          <a-space wrap>
            <a-tag color="blue">{{ cartStore.lines.length }} SKU</a-tag>
            <a-tag color="green">{{ cartStore.summary.totalQuantity }} pezzi</a-tag>
            <a-tag :color="blockingLinesCount ? 'orange' : 'success'">
              {{ blockingLinesCount ? `${blockingLinesCount} da correggere` : 'Pronto checkout' }}
            </a-tag>
          </a-space>
        </div>

        <div class="cart-list-head">
          <span>Prodotto</span>
          <span>Quantita</span>
          <span>Prezzo</span>
          <span>Totale</span>
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
                <div class="cart-line-tags">
                  <a-tag color="blue">{{ line.product.brand }}</a-tag>
                  <a-tag>{{ line.product.category }}</a-tag>
                  <a-tag :color="line.isOutOfStock ? 'error' : 'success'">
                    {{ line.isOutOfStock ? 'Esaurito' : 'Disponibile' }}
                  </a-tag>
                </div>
                <h2>{{ line.product.name }}</h2>
                <p>
                  <strong>{{ line.product.skuCode }}</strong>
                  <span>{{ line.product.qualityGrade }}</span>
                  <span>{{ line.product.model }}</span>
                  <span>MOQ {{ line.product.moq }}</span>
                </p>
                <div v-if="line.isBelowMoq || line.isOutOfStock" class="cart-line-issue">
                  <span v-if="line.isBelowMoq">Minimo {{ line.product.moq }} pezzi richiesto</span>
                  <span v-if="line.isOutOfStock">Rimuovi o scegli alternativa</span>
                  <a-button
                    v-if="line.isBelowMoq"
                    size="small"
                    type="link"
                    @click="setToMoq(line.product.skuCode, line.product.moq)"
                  >
                    Porta a MOQ
                  </a-button>
                </div>
              </div>

              <div class="cart-line-qty">
                <a-button size="small" @click="decreaseQuantity(line.product.skuCode)">
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
                <span>IVA escl.</span>
              </div>

              <div class="cart-line-subtotal">
                <strong>{{ currency.format(line.subtotal) }}</strong>
              </div>

              <a-button
                class="cart-line-remove"
                size="small"
                danger
                @click="cartStore.removeItem(line.product.skuCode)"
              >
                <DeleteOutlined />
              </a-button>
            </div>
          </a-card>
        </div>
      </div>

      <aside class="order-summary">
        <a-card class="summary-card" title="Riepilogo">
          <div class="summary-line">
            <span>Subtotale</span>
            <strong>{{ currency.format(cartStore.summary.subtotal) }}</strong>
          </div>
          <div class="summary-line">
            <span>IVA 22%</span>
            <strong>{{ currency.format(cartStore.summary.vat) }}</strong>
          </div>
          <div class="summary-line">
            <span>Spedizione</span>
            <strong>{{ currency.format(cartStore.summary.shipping) }}</strong>
          </div>
          <div class="summary-line summary-total">
            <span>Totale</span>
            <strong>{{ currency.format(cartStore.summary.total) }}</strong>
          </div>
          <div class="summary-note">
            Prezzi ricalcolati dal backend RPC in checkout.
          </div>
          <RouterLink to="/checkout">
            <a-button type="primary" block size="large" :disabled="!canCheckout">
              Vai al checkout
            </a-button>
          </RouterLink>
          <div class="summary-danger-zone">
            <a-popconfirm
              title="Svuotare il carrello?"
              description="Questa azione rimuove tutti gli articoli dal carrello."
              ok-text="Svuota"
              cancel-text="Annulla"
              placement="topRight"
              @confirm="cartStore.clearCart"
            >
              <a-button type="link" danger size="small">
                <DeleteOutlined />
                Svuota carrello
              </a-button>
            </a-popconfirm>
          </div>
        </a-card>
      </aside>
    </section>
  </main>
</template>
