<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { createEmptyCustomerProfile, validateCustomerProfile } from '@/services/customer.service'
import { useAuthStore } from '@/stores/auth.store'
import { useCustomerStore } from '@/stores/customer.store'
import { useUiStore } from '@/stores/ui.store'
import type { CustomerProfile, CustomerProfileField } from '@/types/customer'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const customerStore = useCustomerStore()
const uiStore = useUiStore()

const formState = reactive<CustomerProfile>(createEmptyCustomerProfile(authStore.profile?.email || ''))

function safeReturnUrl(value: unknown) {
  const returnUrl = Array.isArray(value) ? value[0] : value
  return typeof returnUrl === 'string' && returnUrl.startsWith('/') && !returnUrl.startsWith('//')
    ? returnUrl
    : ''
}

const returnUrl = computed(() => safeReturnUrl(route.query.returnUrl))

const copy = computed(() => {
  const fieldLabels: Record<CustomerProfileField, string> =
    uiStore.language === 'zh'
      ? {
          companyName: '公司名称',
          contactName: '联系人',
          phone: '电话',
          vatNumber: 'P.IVA',
          billingAddress: '发票地址',
          shippingAddress: '默认送货地址',
          electronicInvoice: 'SDI 或 PEC 至少一个',
        }
      : {
          companyName: 'Ragione sociale',
          contactName: 'Referente',
          phone: 'Telefono',
          vatNumber: 'P.IVA',
          billingAddress: 'Indirizzo fatturazione',
          shippingAddress: 'Indirizzo consegna predefinito',
          electronicInvoice: 'SDI oppure PEC',
        }

  if (uiStore.language === 'zh') {
    return {
      title: '公司与发票资料',
      description: '下单前需要完善公司、P.IVA、发票资料和默认送货地址。资料完整即可下单，不强制等待 B2B 审核。',
      completeTitle: '资料已完整',
      completeDescription: '可以返回结账并提交订单。',
      missingTitle: '下单前还需要补全资料',
      missingDescription: '缺失字段会阻止进入结账，保存完整资料后系统会使用这些信息生成订单。',
      returnCheckout: '返回结账',
      account: '客户中心',
      fiscal: '发票与公司',
      delivery: '默认配送',
      companyName: '公司名称',
      contactName: '联系人',
      email: '登录邮箱',
      phone: '电话',
      vatNumber: 'P.IVA',
      fiscalCode: 'Codice Fiscale（可选）',
      sdi: 'SDI',
      pec: 'PEC',
      registeredAddress: '注册地址（可选，空则同发票地址）',
      billingAddress: '发票地址',
      shippingAddress: '默认送货地址',
      save: '保存资料',
      saved: '资料已保存',
      saveFailed: '保存失败',
      incomplete: '请先补全必填资料',
      fieldLabels,
    }
  }

  return {
    title: 'Dati aziendali e fatturazione',
    description:
      'Prima del checkout servono azienda, P.IVA, dati fiscali e indirizzo di consegna predefinito. Basta il profilo completo, senza attendere approvazione B2B.',
    completeTitle: 'Profilo completo',
    completeDescription: 'Puoi tornare al checkout e inviare l’ordine.',
    missingTitle: 'Completa i dati prima dell’ordine',
    missingDescription:
      'I campi mancanti bloccano il checkout. L’ordine usera questi dati aziendali salvati.',
    returnCheckout: 'Torna al checkout',
    account: 'Area cliente',
    fiscal: 'Azienda e fattura',
    delivery: 'Consegna predefinita',
    companyName: 'Ragione sociale',
    contactName: 'Referente',
    email: 'Email login',
    phone: 'Telefono',
    vatNumber: 'P.IVA',
    fiscalCode: 'Codice Fiscale (opzionale)',
    sdi: 'SDI',
    pec: 'PEC',
    registeredAddress: 'Sede legale (opzionale, vuoto = fatturazione)',
    billingAddress: 'Indirizzo fatturazione',
    shippingAddress: 'Indirizzo consegna predefinito',
    save: 'Salva dati',
    saved: 'Dati salvati',
    saveFailed: 'Salvataggio non riuscito',
    incomplete: 'Completa prima i campi obbligatori',
    fieldLabels,
  }
})

const validation = computed(() => validateCustomerProfile(formState))
const missingFieldNames = computed(() =>
  validation.value.missingFields.map((field) => copy.value.fieldLabels[field]),
)

function applyProfile(profile: CustomerProfile) {
  Object.assign(formState, {
    ...createEmptyCustomerProfile(authStore.profile?.email || ''),
    ...profile,
    email: profile.email || authStore.profile?.email || '',
  })
}

async function loadProfile() {
  await customerStore.ensureLoaded(authStore.profile?.email || '')
  applyProfile(customerStore.profile)
}

async function handleSave() {
  if (!formState.registeredAddress) {
    formState.registeredAddress = formState.billingAddress
  }

  const nextValidation = validateCustomerProfile(formState)

  if (!nextValidation.isComplete) {
    message.warning(copy.value.incomplete)
    return
  }

  try {
    await customerStore.save(formState)
    applyProfile(customerStore.profile)
    message.success(copy.value.saved)

    if (returnUrl.value) {
      await router.push(returnUrl.value)
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : copy.value.saveFailed)
  }
}

onMounted(loadProfile)

watch(
  () => customerStore.profile,
  (profile) => {
    if (customerStore.isLoaded) {
      applyProfile(profile)
    }
  },
  { deep: true },
)
</script>

<template>
  <main class="account-profile-page">
    <section class="account-profile-hero">
      <div>
        <a-breadcrumb>
          <a-breadcrumb-item>{{ copy.account }}</a-breadcrumb-item>
          <a-breadcrumb-item>{{ copy.title }}</a-breadcrumb-item>
        </a-breadcrumb>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.description }}</p>
      </div>

      <a-card class="profile-status-card">
        <template v-if="validation.isComplete">
          <CheckCircleOutlined class="profile-status-icon is-complete" />
          <strong>{{ copy.completeTitle }}</strong>
          <span>{{ copy.completeDescription }}</span>
          <RouterLink v-if="returnUrl" :to="returnUrl">
            <a-button type="primary" block>{{ copy.returnCheckout }}</a-button>
          </RouterLink>
        </template>
        <template v-else>
          <ExclamationCircleOutlined class="profile-status-icon is-warning" />
          <strong>{{ copy.missingTitle }}</strong>
          <span>{{ copy.missingDescription }}</span>
          <div class="profile-missing-fields">
            <a-tag v-for="field in missingFieldNames" :key="field" color="orange">
              {{ field }}
            </a-tag>
          </div>
        </template>
      </a-card>
    </section>

    <a-form class="account-profile-form" layout="vertical" :model="formState" @finish="handleSave">
      <a-card :title="copy.fiscal" class="account-profile-card">
        <a-row :gutter="[12, 8]">
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.companyName" required>
              <a-input v-model:value="formState.companyName" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.contactName" required>
              <a-input v-model:value="formState.contactName" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.email">
              <a-input v-model:value="formState.email" disabled />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.phone" required>
              <a-input v-model:value="formState.phone" autocomplete="tel" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.vatNumber" required>
              <a-input v-model:value="formState.vatNumber" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.fiscalCode">
              <a-input v-model:value="formState.fiscalCode" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.sdi">
              <a-input v-model:value="formState.sdi" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item :label="copy.pec">
              <a-input v-model:value="formState.pec" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <a-card :title="copy.delivery" class="account-profile-card">
        <a-row :gutter="[12, 8]">
          <a-col :xs="24" :md="8">
            <a-form-item :label="copy.registeredAddress">
              <a-textarea v-model:value="formState.registeredAddress" :rows="4" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item :label="copy.billingAddress" required>
              <a-textarea v-model:value="formState.billingAddress" :rows="4" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item :label="copy.shippingAddress" required>
              <a-textarea v-model:value="formState.shippingAddress" :rows="4" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-card>

      <div class="account-profile-actions">
        <RouterLink to="/account">
          <a-button>{{ copy.account }}</a-button>
        </RouterLink>
        <a-button html-type="submit" type="primary" :loading="customerStore.isSaving">
          {{ copy.save }}
        </a-button>
      </div>
    </a-form>
  </main>
</template>
