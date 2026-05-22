<script setup lang="ts">
import { computed } from 'vue'
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons-vue'
import { useCartStore } from '@/stores/cart.store'

const cartStore = useCartStore()

const currency = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

const canCheckout = computed(() => cartStore.lines.length > 0 && !cartStore.hasBlockingIssues)

function handleQuantityChange(skuCode: string, value: number | string | null) {
  cartStore.updateQuantity(skuCode, Number(value || 1))
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
      <div class="cart-lines">
        <a-card v-for="line in cartStore.lines" :key="line.product.skuCode" class="cart-line-card">
          <div class="cart-line">
            <div class="cart-line-image">
              <span>{{ line.product.brand }}</span>
              <strong>{{ line.product.category }}</strong>
            </div>
            <div class="cart-line-info">
              <a-space wrap>
                <a-tag color="blue">{{ line.product.qualityGrade }}</a-tag>
                <a-tag :color="line.isOutOfStock ? 'error' : 'success'">
                  {{ line.isOutOfStock ? 'Esaurito' : 'Disponibile' }}
                </a-tag>
              </a-space>
              <h2>{{ line.product.name }}</h2>
              <p>SKU: {{ line.product.skuCode }} - MOQ {{ line.product.moq }}</p>
              <a-alert
                v-if="line.isBelowMoq"
                type="warning"
                show-icon
                message="Quantita sotto MOQ"
                :description="`Questo SKU richiede almeno ${line.product.moq} pezzi.`"
              />
              <a-alert
                v-if="line.isOutOfStock"
                type="error"
                show-icon
                message="Prodotto esaurito"
                description="Rimuovi la riga o scegli un'alternativa prima del checkout."
              />
            </div>
            <div class="cart-line-price">
              <strong>{{ currency.format(line.unitPrice) }}</strong>
              <span>IVA esclusa</span>
              <a-input-number
                :min="1"
                :value="line.quantity"
                @change="(value: number | string | null) => handleQuantityChange(line.product.skuCode, value)"
              />
              <strong>{{ currency.format(line.subtotal) }}</strong>
              <a-button danger @click="cartStore.removeItem(line.product.skuCode)">
                <DeleteOutlined />
              </a-button>
            </div>
          </div>
        </a-card>
      </div>

      <aside class="order-summary">
        <a-card title="Riepilogo ordine">
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="Subtotale">
              {{ currency.format(cartStore.summary.subtotal) }}
            </a-descriptions-item>
            <a-descriptions-item label="IVA 22%">
              {{ currency.format(cartStore.summary.vat) }}
            </a-descriptions-item>
            <a-descriptions-item label="Spedizione">
              {{ currency.format(cartStore.summary.shipping) }}
            </a-descriptions-item>
            <a-descriptions-item label="Totale">
              <strong>{{ currency.format(cartStore.summary.total) }}</strong>
            </a-descriptions-item>
          </a-descriptions>
          <a-alert
            class="summary-alert"
            type="info"
            show-icon
            message="Prezzi ricalcolati al checkout"
            description="Il prezzo finale deve essere ricalcolato dal backend RPC."
          />
          <RouterLink to="/checkout">
            <a-button type="primary" block size="large" :disabled="!canCheckout">
              Vai al checkout
            </a-button>
          </RouterLink>
        </a-card>
      </aside>
    </section>
  </main>
</template>
