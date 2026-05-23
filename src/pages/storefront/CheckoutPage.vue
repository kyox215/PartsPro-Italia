<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { createOrderFromCheckout } from '@/services/order.service'
import { useCartStore } from '@/stores/cart.store'
import { useAuthStore } from '@/stores/auth.store'
import { useCustomerStore } from '@/stores/customer.store'
import { useUiStore } from '@/stores/ui.store'
import type { CheckoutPayload } from '@/types/cart'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const customerStore = useCustomerStore()
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
  shippingMethod: 'GLS/BRT 24-48h',
  paymentMethod: 'bank_transfer',
  customerNote: '',
})

const acceptsTerms = ref(false)
const acceptsPrivacy = ref(false)

const canSubmit = computed(
  () =>
    cartStore.lines.length > 0 &&
    !cartStore.hasBlockingIssues &&
    customerStore.isComplete &&
    acceptsTerms.value &&
    acceptsPrivacy.value,
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
      customerMessage: '客户资料已锁定用于本次订单',
      customerDescription: '公司、P.IVA、发票地址和送货地址会从客户中心读取，结账页不再临时修改。',
      profileIncomplete: '客户资料不完整',
      completeProfile: '完善资料',
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
      backendPriceDescription: '提交订单时后端会读取已保存客户资料并重新计算价格、MOQ、VAT 和运费。',
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
    customerMessage: 'Dati cliente bloccati per questo ordine',
    customerDescription: 'Azienda, P.IVA, fattura e consegna arrivano dall’area cliente e non si modificano nel checkout.',
    profileIncomplete: 'Profilo cliente incompleto',
    completeProfile: 'Completa dati',
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
    backendPriceDescription:
      'Alla conferma il backend legge il profilo salvato e ricalcola prezzi, MOQ, IVA e spedizione.',
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
const profile = computed(() => customerStore.profile)

function nextStep() {
  currentStep.value = Math.min(currentStep.value + 1, 3)
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

async function submitOrder() {
  isSubmitting.value = true

  try {
    await customerStore.ensureLoaded(authStore.profile?.email || '')

    if (!customerStore.isComplete) {
      await router.push({
        name: 'account-company',
        query: {
          returnUrl: '/checkout',
        },
      })
      return
    }

    checkout.items = cartStore.items
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

onMounted(async () => {
  try {
    await customerStore.ensureLoaded(authStore.profile?.email || '')
  } catch (error) {
    message.error(error instanceof Error ? error.message : copy.value.profileIncomplete)
  }

  if (!customerStore.isComplete && !createdOrderId.value) {
    await router.replace({
      name: 'account-company',
      query: {
        returnUrl: '/checkout',
      },
    })
  }
})
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
              :type="customerStore.isComplete ? 'info' : 'warning'"
              show-icon
              :message="customerStore.isComplete ? copy.customerMessage : copy.profileIncomplete"
              :description="copy.customerDescription"
            />
            <div class="checkout-readonly-grid">
              <div class="checkout-readonly-item">
                <span>{{ copy.company }}</span>
                <strong>{{ profile.companyName || '-' }}</strong>
              </div>
              <div class="checkout-readonly-item">
                <span>{{ copy.contact }}</span>
                <strong>{{ profile.contactName || '-' }}</strong>
              </div>
              <div class="checkout-readonly-item">
                <span>Email</span>
                <strong>{{ profile.email || authStore.profile?.email || '-' }}</strong>
              </div>
              <div class="checkout-readonly-item">
                <span>{{ copy.phone }}</span>
                <strong>{{ profile.phone || '-' }}</strong>
              </div>
            </div>
            <RouterLink
              v-if="!customerStore.isComplete"
              :to="{ name: 'account-company', query: { returnUrl: '/checkout' } }"
            >
              <a-button type="primary">{{ copy.completeProfile }}</a-button>
            </RouterLink>
          </template>

          <template v-if="currentStep === 1">
            <h2>{{ copy.billing }}</h2>
            <div class="checkout-readonly-grid fiscal-grid">
              <div class="checkout-readonly-item">
                <span>P.IVA</span>
                <strong>{{ profile.vatNumber || '-' }}</strong>
              </div>
              <div class="checkout-readonly-item">
                <span>{{ copy.fiscalCode }}</span>
                <strong>{{ profile.fiscalCode || '-' }}</strong>
              </div>
              <div class="checkout-readonly-item">
                <span>SDI</span>
                <strong>{{ profile.sdi || '-' }}</strong>
              </div>
              <div class="checkout-readonly-item">
                <span>PEC</span>
                <strong>{{ profile.pec || '-' }}</strong>
              </div>
              <div class="checkout-readonly-item is-wide">
                <span>{{ copy.billingAddress }}</span>
                <strong>{{ profile.billingAddress || '-' }}</strong>
              </div>
            </div>
            <RouterLink :to="{ name: 'account-company', query: { returnUrl: '/checkout' } }">
              <a-button>{{ copy.completeProfile }}</a-button>
            </RouterLink>
          </template>

          <a-form v-if="currentStep === 2" layout="vertical">
            <h2>{{ copy.shipping }}</h2>
            <div class="checkout-readonly-grid">
              <div class="checkout-readonly-item is-wide">
                <span>{{ copy.shippingAddress }}</span>
                <strong>{{ profile.shippingAddress || '-' }}</strong>
              </div>
            </div>
            <a-form-item :label="copy.shippingMethod">
              <a-radio-group v-model:value="checkout.shippingMethod">
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
