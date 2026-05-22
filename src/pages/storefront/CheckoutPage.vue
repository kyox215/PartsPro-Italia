<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { createOrderFromCheckout } from '@/services/order.service'
import { useCartStore } from '@/stores/cart.store'
import { useUiStore } from '@/stores/ui.store'
import type { CheckoutPayload } from '@/types/cart'

const cartStore = useCartStore()
const uiStore = useUiStore()
const currentStep = ref(0)
const isSubmitting = ref(false)
const createdOrderId = ref('')
const createdOrderNo = ref('')

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
const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      orderSent: '订单已提交',
      orderSubtitle: (id: string) => `订单 ${id} 已创建，当前状态为已提交。工作人员会确认价格、库存和配送。`,
      myOrders: '查看我的订单',
      continueShopping: '继续采购',
      home: '首页',
      checkout: '结账',
      steps: ['客户', '发票', '配送', '支付'],
      customer: '客户',
      customerMessage: '已审核 B2B 客户',
      customerDescription: '当前为演示资料。正式环境将从 Supabase 客户资料读取。',
      billing: '发票资料',
      company: '公司名称',
      fiscalCode: '税号',
      billingAddress: '发票地址',
      shipping: '配送',
      contact: '联系人',
      phone: '电话',
      shippingAddress: '收货地址',
      shippingMethod: '配送方式',
      batteryShipping: '电池与运输',
      batteryShippingDescription: '电池商品可能需要专门包装和运输规则。',
      payment: '支付与确认',
      paymentMethod: '支付方式',
      customerNote: '客户备注',
      terms: '我接受条款与条件',
      privacy: '我接受隐私政策',
      backendPrice: '价格由后端重新计算',
      backendPriceDescription: '提交订单时会调用后端订单接口，前端价格仅作为展示。',
      back: '上一步',
      next: '下一步',
      confirm: '确认订单',
      summary: '汇总',
      subtotal: '小计',
      vat: 'VAT 22%',
      total: '总计',
    }
  }

  return {
    orderSent: 'Ordine inviato',
    orderSubtitle: (id: string) => `Ordine ${id} creato in stato submitted. Lo staff confermera prezzo, stock e spedizione.`,
    myOrders: 'Vai ai miei ordini',
    continueShopping: 'Continua acquisti',
    home: 'Home',
    checkout: 'Checkout',
    steps: ['Cliente', 'Fatturazione', 'Spedizione', 'Pagamento'],
    customer: 'Cliente',
    customerMessage: 'Cliente B2B approvato',
    customerDescription: 'I dati sono precaricati dal profilo demo. In produzione arrivano dal profilo Supabase.',
    billing: 'Fatturazione',
    company: 'Ragione sociale',
    fiscalCode: 'Codice Fiscale',
    billingAddress: 'Indirizzo fatturazione',
    shipping: 'Spedizione',
    contact: 'Contatto',
    phone: 'Telefono',
    shippingAddress: 'Indirizzo consegna',
    shippingMethod: 'Metodo spedizione',
    batteryShipping: 'Batterie e trasporto',
    batteryShippingDescription: 'Le batterie possono richiedere imballo e regole di spedizione specifiche.',
    payment: 'Pagamento e conferma',
    paymentMethod: 'Metodo pagamento',
    customerNote: 'Note cliente',
    terms: 'Accetto Termini e Condizioni',
    privacy: 'Accetto Privacy Policy',
    backendPrice: 'Prezzo ricalcolato dal backend',
    backendPriceDescription: 'La conferma ordine deve chiamare create_order_from_cart RPC e non fidarsi del prezzo frontend.',
    back: 'Indietro',
    next: 'Avanti',
    confirm: 'Conferma ordine',
    summary: 'Riepilogo',
    subtotal: 'Subtotale',
    vat: 'IVA 22%',
    total: 'Totale',
  }
})
const stepItems = computed(() => copy.value.steps.map((title, index) => ({ title, index })))

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
    const order = await createOrderFromCheckout(checkout)
    createdOrderId.value = order.orderId
    createdOrderNo.value = order.orderNo
    cartStore.clearCart()
    message.success(uiStore.language === 'zh' ? '订单已提交' : `Ordine ${order.orderNo} inviato`)
  } catch (error) {
    message.error(error instanceof Error ? error.message : uiStore.language === 'zh' ? '结账失败' : 'Checkout non riuscito')
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
      :title="copy.orderSent"
      :sub-title="copy.orderSubtitle(createdOrderNo || createdOrderId)"
    >
      <template #extra>
        <RouterLink :to="`/account/orders/${createdOrderId}`">
          <a-button type="primary">{{ copy.myOrders }}</a-button>
        </RouterLink>
        <RouterLink to="/products">
          <a-button>{{ copy.continueShopping }}</a-button>
        </RouterLink>
      </template>
    </a-result>

    <section v-else class="checkout-layout">
      <div class="checkout-main">
        <a-breadcrumb>
          <a-breadcrumb-item>{{ copy.home }}</a-breadcrumb-item>
          <a-breadcrumb-item>{{ copy.checkout }}</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>{{ copy.checkout }}</h1>
        <a-steps
          class="checkout-steps"
          :current="currentStep"
          :items="stepItems.map((step) => ({ title: step.title }))"
        />
        <div class="checkout-step-tabs" role="tablist" :aria-label="copy.checkout">
          <button
            v-for="step in stepItems"
            :key="step.title"
            type="button"
            :class="{ 'is-active': currentStep === step.index, 'is-done': currentStep > step.index }"
            @click="currentStep = step.index"
          >
            <strong>{{ step.index + 1 }}</strong>
            <span>{{ step.title }}</span>
          </button>
        </div>

        <a-card class="checkout-step-card">
          <template v-if="currentStep === 0">
            <h2>{{ copy.customer }}</h2>
            <a-alert
              type="info"
              show-icon
              :message="copy.customerMessage"
              :description="copy.customerDescription"
            />
          </template>

          <a-form v-if="currentStep === 1" layout="vertical">
            <h2>{{ copy.billing }}</h2>
            <a-form-item :label="copy.company">
              <a-input v-model:value="checkout.billing.companyName" />
            </a-form-item>
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item label="P.IVA">
                  <a-input v-model:value="checkout.billing.vatNumber" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item :label="copy.fiscalCode">
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
            <a-form-item :label="copy.billingAddress">
              <a-textarea v-model:value="checkout.billing.address" :rows="3" />
            </a-form-item>
          </a-form>

          <a-form v-if="currentStep === 2" layout="vertical">
            <h2>{{ copy.shipping }}</h2>
            <a-form-item :label="copy.contact">
              <a-input v-model:value="checkout.shipping.contactName" />
            </a-form-item>
            <a-form-item :label="copy.phone">
              <a-input v-model:value="checkout.shipping.phone" />
            </a-form-item>
            <a-form-item :label="copy.shippingAddress">
              <a-textarea v-model:value="checkout.shipping.address" :rows="3" />
            </a-form-item>
            <a-form-item :label="copy.shippingMethod">
              <a-radio-group v-model:value="checkout.shipping.method">
                <a-radio value="GLS/BRT 24-48h">GLS/BRT 24-48h</a-radio>
                <a-radio value="DHL/UPS EU">DHL/UPS EU</a-radio>
                <a-radio value="Ritiro in sede">Ritiro in sede</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-alert
              type="warning"
              show-icon
              :message="copy.batteryShipping"
              :description="copy.batteryShippingDescription"
            />
          </a-form>

          <a-form v-if="currentStep === 3" layout="vertical">
            <h2>{{ copy.payment }}</h2>
            <a-form-item :label="copy.paymentMethod">
              <a-radio-group v-model:value="checkout.paymentMethod">
                <a-radio value="stripe">Stripe carta</a-radio>
                <a-radio value="paypal">PayPal</a-radio>
                <a-radio value="bank_transfer">Bonifico Bancario</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-form-item :label="copy.customerNote">
              <a-textarea v-model:value="checkout.customerNote" :rows="3" />
            </a-form-item>
            <a-checkbox v-model:checked="acceptsTerms">
              {{ copy.terms }}
            </a-checkbox>
            <a-checkbox v-model:checked="acceptsPrivacy">
              {{ copy.privacy }}
            </a-checkbox>
            <a-alert
              type="info"
              show-icon
              :message="copy.backendPrice"
              :description="copy.backendPriceDescription"
            />
          </a-form>

          <div class="form-actions">
            <a-button :disabled="currentStep === 0" @click="previousStep">{{ copy.back }}</a-button>
            <a-button v-if="currentStep < 3" type="primary" @click="nextStep">{{ copy.next }}</a-button>
            <a-button
              v-else
              type="primary"
              :disabled="!canSubmit"
              :loading="isSubmitting"
              @click="submitOrder"
            >
              {{ copy.confirm }}
            </a-button>
          </div>
        </a-card>
      </div>

      <aside class="order-summary checkout-summary">
        <a-card class="checkout-summary-card" :title="copy.summary">
          <div class="checkout-summary-lines">
            <article
              v-for="item in cartStore.lines"
              :key="item.product.skuCode"
              class="checkout-summary-line"
            >
              <div>
                <strong>{{ item.product.name }}</strong>
                <span>{{ item.product.brand }} · {{ item.product.model }}</span>
              </div>
              <b>{{ item.quantity }} x {{ currency.format(item.unitPrice) }}</b>
            </article>
          </div>
          <a-divider />
          <a-descriptions :column="1" size="small">
            <a-descriptions-item :label="copy.subtotal">
              {{ currency.format(cartStore.summary.subtotal) }}
            </a-descriptions-item>
            <a-descriptions-item :label="copy.vat">
              {{ currency.format(cartStore.summary.vat) }}
            </a-descriptions-item>
            <a-descriptions-item :label="copy.shipping">
              {{ currency.format(cartStore.summary.shipping) }}
            </a-descriptions-item>
            <a-descriptions-item :label="copy.total">
              <strong>{{ currency.format(cartStore.summary.total) }}</strong>
            </a-descriptions-item>
          </a-descriptions>
        </a-card>
      </aside>
    </section>
  </main>
</template>
