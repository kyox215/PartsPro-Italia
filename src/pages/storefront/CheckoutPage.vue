<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { createOrderFromCart } from '@/services/cart.service'
import { useCartStore } from '@/stores/cart.store'
import type { CheckoutPayload } from '@/types/cart'

const cartStore = useCartStore()
const currentStep = ref(0)
const isSubmitting = ref(false)
const createdOrderId = ref('')

const currency = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

const checkout = reactive<CheckoutPayload>({
  items: [],
  billing: {
    companyName: 'PartsPro Demo Customer',
    vatNumber: 'IT00000000000',
    fiscalCode: '',
    sdi: '0000000',
    pec: 'cliente@examplepec.it',
    address: 'Via Roma 1, Milano, Italia',
  },
  shipping: {
    contactName: 'Demo Customer',
    phone: '+39 000 000 0000',
    address: 'Via Roma 1, Milano, Italia',
    method: 'GLS/BRT 24-48h',
  },
  paymentMethod: 'bank_transfer',
  customerNote: '',
})

const acceptsTerms = ref(false)
const acceptsPrivacy = ref(false)

const canSubmit = computed(
  () => cartStore.lines.length > 0 && !cartStore.hasBlockingIssues && acceptsTerms.value && acceptsPrivacy.value,
)

function nextStep() {
  currentStep.value = Math.min(currentStep.value + 1, 3)
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

async function submitOrder() {
  checkout.items = cartStore.items
  isSubmitting.value = true

  try {
    const order = await createOrderFromCart(checkout)
    createdOrderId.value = order.orderId
    cartStore.clearCart()
    message.success(`Ordine ${order.orderId} inviato`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : 'Checkout non riuscito')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="checkout-page">
    <a-result
      v-if="createdOrderId"
      status="success"
      title="Ordine inviato"
      :sub-title="`Ordine ${createdOrderId} creato in stato submitted. Lo staff confermera prezzo, stock e spedizione.`"
    >
      <template #extra>
        <RouterLink to="/account/orders">
          <a-button type="primary">Vai ai miei ordini</a-button>
        </RouterLink>
        <RouterLink to="/products">
          <a-button>Continua acquisti</a-button>
        </RouterLink>
      </template>
    </a-result>

    <section v-else class="checkout-layout">
      <div class="checkout-main">
        <a-breadcrumb>
          <a-breadcrumb-item>Home</a-breadcrumb-item>
          <a-breadcrumb-item>Checkout</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>Checkout</h1>
        <a-steps
          :current="currentStep"
          :items="[
            { title: 'Cliente' },
            { title: 'Fatturazione' },
            { title: 'Spedizione' },
            { title: 'Pagamento' },
          ]"
        />

        <a-card class="checkout-step-card">
          <template v-if="currentStep === 0">
            <h2>Cliente</h2>
            <a-alert
              type="info"
              show-icon
              message="Cliente B2B approvato"
              description="I dati sono precaricati dal profilo demo. In produzione arrivano dal profilo Supabase."
            />
          </template>

          <a-form v-if="currentStep === 1" layout="vertical">
            <h2>Fatturazione</h2>
            <a-form-item label="Ragione sociale">
              <a-input v-model:value="checkout.billing.companyName" />
            </a-form-item>
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item label="P.IVA">
                  <a-input v-model:value="checkout.billing.vatNumber" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="Codice Fiscale">
                  <a-input v-model:value="checkout.billing.fiscalCode" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item label="SDI">
                  <a-input v-model:value="checkout.billing.sdi" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="PEC">
                  <a-input v-model:value="checkout.billing.pec" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="Indirizzo fatturazione">
              <a-textarea v-model:value="checkout.billing.address" :rows="3" />
            </a-form-item>
          </a-form>

          <a-form v-if="currentStep === 2" layout="vertical">
            <h2>Spedizione</h2>
            <a-form-item label="Contatto">
              <a-input v-model:value="checkout.shipping.contactName" />
            </a-form-item>
            <a-form-item label="Telefono">
              <a-input v-model:value="checkout.shipping.phone" />
            </a-form-item>
            <a-form-item label="Indirizzo consegna">
              <a-textarea v-model:value="checkout.shipping.address" :rows="3" />
            </a-form-item>
            <a-form-item label="Metodo spedizione">
              <a-radio-group v-model:value="checkout.shipping.method">
                <a-radio value="GLS/BRT 24-48h">GLS/BRT 24-48h</a-radio>
                <a-radio value="DHL/UPS EU">DHL/UPS EU</a-radio>
                <a-radio value="Ritiro in sede">Ritiro in sede</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-alert
              type="warning"
              show-icon
              message="Batterie e trasporto"
              description="Le batterie possono richiedere imballo e regole di spedizione specifiche."
            />
          </a-form>

          <a-form v-if="currentStep === 3" layout="vertical">
            <h2>Pagamento e conferma</h2>
            <a-form-item label="Metodo pagamento">
              <a-radio-group v-model:value="checkout.paymentMethod">
                <a-radio value="stripe">Stripe carta</a-radio>
                <a-radio value="paypal">PayPal</a-radio>
                <a-radio value="bank_transfer">Bonifico Bancario</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-form-item label="Note cliente">
              <a-textarea v-model:value="checkout.customerNote" :rows="3" />
            </a-form-item>
            <a-checkbox v-model:checked="acceptsTerms">
              Accetto Termini e Condizioni
            </a-checkbox>
            <a-checkbox v-model:checked="acceptsPrivacy">
              Accetto Privacy Policy
            </a-checkbox>
            <a-alert
              type="info"
              show-icon
              message="Prezzo ricalcolato dal backend"
              description="La conferma ordine deve chiamare create_order_from_cart RPC e non fidarsi del prezzo frontend."
            />
          </a-form>

          <div class="form-actions">
            <a-button :disabled="currentStep === 0" @click="previousStep">Indietro</a-button>
            <a-button v-if="currentStep < 3" type="primary" @click="nextStep">Avanti</a-button>
            <a-button
              v-else
              type="primary"
              :disabled="!canSubmit"
              :loading="isSubmitting"
              @click="submitOrder"
            >
              Conferma ordine
            </a-button>
          </div>
        </a-card>
      </div>

      <aside class="order-summary checkout-summary">
        <a-card title="Riepilogo">
          <a-list :data-source="cartStore.lines" item-layout="horizontal">
            <template #renderItem="{ item }">
              <a-list-item>
                <a-list-item-meta :title="item.product.skuCode" :description="item.product.name" />
                <span>{{ item.quantity }} x {{ currency.format(item.unitPrice) }}</span>
              </a-list-item>
            </template>
          </a-list>
          <a-divider />
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
        </a-card>
      </aside>
    </section>
  </main>
</template>
