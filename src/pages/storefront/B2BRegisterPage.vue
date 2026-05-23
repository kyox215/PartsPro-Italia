<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { submitB2BApplication } from '@/services/b2b.service'
import { useUiStore } from '@/stores/ui.store'
import type { B2BApplication } from '@/types/b2b'

const uiStore = useUiStore()
const currentStep = ref(0)
const isSubmitting = ref(false)
const submittedId = ref('')

const application = reactive<B2BApplication>({
  email: '',
  password: '',
  contactName: '',
  phone: '',
  whatsapp: '',
  companyName: '',
  vatNumber: '',
  fiscalCode: '',
  sdi: '',
  pec: '',
  companyType: '',
  registeredAddress: '',
  shippingAddress: '',
  monthlyPurchase: '',
  interestedCategories: [],
  paymentNeeds: [],
  acceptsTerms: false,
  acceptsPrivacy: false,
  acceptsMarketing: false,
})

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      tag: 'PartsPro B2B',
      title: '申请 B2B 批发账户',
      intro: '面向维修店、翻新商、经销商和批发客户。审核后可查看 B2B 批发价、阶梯价和订单历史。',
      benefits: ['专属价格和数量阶梯', '意大利库存与 24/48 小时配送', 'SDI/PEC 电子发票', '可追踪 RMA 与 WhatsApp 支持'],
      steps: ['账户', '公司与 VAT', '发票与配送', '采购需求', '确认'],
      email: 'Email',
      password: '密码',
      contact: '联系人',
      phone: '电话',
      whatsapp: 'WhatsApp',
      company: '公司名称',
      vat: 'P.IVA',
      fiscalCode: '税号',
      companyType: '公司类型',
      select: '请选择',
      repairShop: '维修门店',
      wholesaler: '批发商',
      refurbisher: '翻新商',
      ecommerce: '电商卖家',
      legalAddress: '注册地址',
      shippingAddress: '收货地址',
      monthlyPurchase: '预计月采购额',
      purchaseBands: ['低于 €500', '€500 - €2.000', '€2.000 - €5.000', '高于 €5.000'],
      categories: '感兴趣品类',
      categoryOptions: ['屏幕', '电池', '尾插 / 充电接口', '后盖', '摄像头', '工具耗材'],
      paymentNeeds: '支付需求',
      paymentOptions: ['银行转账', '银行卡 / Stripe', 'PayPal', '账期申请'],
      reviewTitle: '确认申请',
      reviewText: '提交后 PartsPro 团队会核验 P.IVA、公司资料和价格组。',
      terms: '我接受条款与条件',
      privacy: '我接受隐私政策',
      marketing: '我希望通过 Email 或 WhatsApp 接收 B2B 报价',
      back: '上一步',
      next: '下一步',
      submit: '提交申请',
      acceptError: '请先接受条款和隐私政策。',
      success: 'B2B 申请已提交',
      successSubtitle: (id: string) => `申请 ID：${id}。审核完成后你会收到确认。`,
    }
  }

  return {
    tag: 'B2B PartsPro',
    title: 'Richiedi account B2B',
    intro: 'Per negozi di riparazione, refurbisher, rivenditori e grossisti. Dopo la verifica potrai vedere prezzi B2B, fasce quantita e storico ordini.',
    benefits: ['Prezzi dedicati e fasce quantita', 'Stock in Italia e spedizione 24/48h', 'Fattura elettronica con SDI/PEC', 'RMA tracciabile e supporto WhatsApp'],
    steps: ['Account', 'Azienda e VAT', 'Fattura e spedizione', 'Acquisti', 'Conferma'],
    email: 'Email',
    password: 'Password',
    contact: 'Referente',
    phone: 'Telefono',
    whatsapp: 'WhatsApp',
    company: 'Ragione sociale',
    vat: 'P.IVA',
    fiscalCode: 'Codice Fiscale',
    companyType: 'Tipo azienda',
    select: 'Seleziona',
    repairShop: 'Negozio riparazioni',
    wholesaler: 'Grossista',
    refurbisher: 'Refurbisher',
    ecommerce: 'E-commerce seller',
    legalAddress: 'Indirizzo sede legale',
    shippingAddress: 'Indirizzo spedizione',
    monthlyPurchase: 'Acquisto mensile stimato',
    purchaseBands: ['Meno di €500', '€500 - €2.000', '€2.000 - €5.000', 'Oltre €5.000'],
    categories: 'Categorie interessate',
    categoryOptions: ['Schermi', 'Batterie', 'Connettori ricarica', 'Back cover', 'Fotocamere', 'Tools'],
    paymentNeeds: 'Esigenze pagamento',
    paymentOptions: ['Bonifico bancario', 'Carta / Stripe', 'PayPal', 'Richiesta fido'],
    reviewTitle: 'Verifica richiesta',
    reviewText: 'Dopo l invio il team PartsPro controllera P.IVA, dati aziendali e gruppo prezzi.',
    terms: 'Accetto Termini e Condizioni',
    privacy: 'Accetto Privacy Policy',
    marketing: 'Desidero ricevere offerte B2B via email o WhatsApp',
    back: 'Indietro',
    next: 'Avanti',
    submit: 'Invia richiesta',
    acceptError: 'Accetta termini e privacy per inviare la richiesta.',
    success: 'Richiesta B2B inviata',
    successSubtitle: (id: string) => `ID richiesta: ${id}. Riceverai una conferma dopo la verifica.`,
  }
})

const steps = computed(() => copy.value.steps)
const categoryOptions = computed(() => copy.value.categoryOptions)
const paymentOptions = computed(() => copy.value.paymentOptions)

const isSubmitted = computed(() => Boolean(submittedId.value))

function nextStep() {
  currentStep.value = Math.min(currentStep.value + 1, steps.value.length - 1)
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

async function handleSubmit() {
  if (!application.acceptsTerms || !application.acceptsPrivacy) {
    message.error(copy.value.acceptError)
    return
  }

  isSubmitting.value = true

  try {
    const result = await submitB2BApplication(application)
    submittedId.value = result.id
    message.success(copy.value.success)
  } catch (error) {
    message.error(error instanceof Error ? error.message : copy.value.acceptError)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="b2b-register-page">
    <section class="b2b-register-shell">
      <aside class="b2b-benefits">
        <a-tag color="blue">{{ copy.tag }}</a-tag>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.intro }}</p>
        <a-list
          :data-source="copy.benefits"
        >
          <template #renderItem="{ item }">
            <a-list-item>{{ item }}</a-list-item>
          </template>
        </a-list>
      </aside>

      <a-card v-if="!isSubmitted" class="b2b-form-card">
        <a-steps :current="currentStep" :items="steps.map((title) => ({ title }))" />

        <a-form layout="vertical" class="b2b-step-form">
          <template v-if="currentStep === 0">
            <a-form-item :label="copy.email" required>
              <a-input v-model:value="application.email" autocomplete="email" />
            </a-form-item>
            <a-form-item :label="copy.password">
              <a-input-password v-model:value="application.password" />
            </a-form-item>
            <a-form-item :label="copy.contact" required>
              <a-input v-model:value="application.contactName" />
            </a-form-item>
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item :label="copy.phone">
                  <a-input v-model:value="application.phone" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item :label="copy.whatsapp">
                  <a-input v-model:value="application.whatsapp" />
                </a-form-item>
              </a-col>
            </a-row>
          </template>

          <template v-if="currentStep === 1">
            <a-form-item :label="copy.company" required>
              <a-input v-model:value="application.companyName" />
            </a-form-item>
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item :label="copy.vat" required>
                  <a-input v-model:value="application.vatNumber" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item :label="copy.fiscalCode">
                  <a-input v-model:value="application.fiscalCode" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item :label="copy.companyType">
              <a-select
                v-model:value="application.companyType"
                :placeholder="copy.select"
                :options="[
                  { label: copy.repairShop, value: 'repair_shop' },
                  { label: copy.wholesaler, value: 'wholesaler' },
                  { label: copy.refurbisher, value: 'refurbisher' },
                  { label: copy.ecommerce, value: 'ecommerce' },
                ]"
              />
            </a-form-item>
          </template>

          <template v-if="currentStep === 2">
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item label="SDI">
                  <a-input v-model:value="application.sdi" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="PEC">
                  <a-input v-model:value="application.pec" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item :label="copy.legalAddress">
              <a-textarea v-model:value="application.registeredAddress" :rows="3" />
            </a-form-item>
            <a-form-item :label="copy.shippingAddress">
              <a-textarea v-model:value="application.shippingAddress" :rows="3" />
            </a-form-item>
          </template>

          <template v-if="currentStep === 3">
            <a-form-item :label="copy.monthlyPurchase">
              <a-select
                v-model:value="application.monthlyPurchase"
                :placeholder="copy.select"
                :options="[
                  { label: copy.purchaseBands[0], value: 'lt_500' },
                  { label: copy.purchaseBands[1], value: '500_2000' },
                  { label: copy.purchaseBands[2], value: '2000_5000' },
                  { label: copy.purchaseBands[3], value: 'gt_5000' },
                ]"
              />
            </a-form-item>
            <a-form-item :label="copy.categories">
              <a-checkbox-group
                v-model:value="application.interestedCategories"
                :options="categoryOptions"
              />
            </a-form-item>
            <a-form-item :label="copy.paymentNeeds">
              <a-checkbox-group
                v-model:value="application.paymentNeeds"
                :options="paymentOptions"
              />
            </a-form-item>
          </template>

          <template v-if="currentStep === 4">
            <a-alert
              type="info"
              show-icon
              :message="copy.reviewTitle"
              :description="copy.reviewText"
            />
            <a-checkbox v-model:checked="application.acceptsTerms">
              {{ copy.terms }}
            </a-checkbox>
            <a-checkbox v-model:checked="application.acceptsPrivacy">
              {{ copy.privacy }}
            </a-checkbox>
            <a-checkbox v-model:checked="application.acceptsMarketing">
              {{ copy.marketing }}
            </a-checkbox>
          </template>
        </a-form>

        <div class="form-actions">
          <a-button :disabled="currentStep === 0" @click="previousStep">{{ copy.back }}</a-button>
          <a-button v-if="currentStep < steps.length - 1" type="primary" @click="nextStep">
            {{ copy.next }}
          </a-button>
          <a-button
            v-else
            type="primary"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            {{ copy.submit }}
          </a-button>
        </div>
      </a-card>

      <a-result
        v-else
        status="success"
        :title="copy.success"
        :sub-title="copy.successSubtitle(submittedId)"
      />
    </section>
  </main>
</template>
