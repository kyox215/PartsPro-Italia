<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { fetchCustomerOrders } from '@/services/order.service'
import { submitRmaRequest } from '@/services/rma.service'
import { useUiStore } from '@/stores/ui.store'
import type { AdminOrder } from '@/types/admin'
import type { RmaRequest } from '@/types/rma'

const route = useRoute()
const uiStore = useUiStore()
const currentStep = ref(0)
const isSubmitting = ref(false)
const submittedCaseId = ref('')
const orders = ref<AdminOrder[]>([])

const rmaRequest = reactive<RmaRequest>({
  orderNumber: '',
  skuCode: '',
  quantity: 1,
  issueType: 'functional_defect',
  description: '',
  testedBeforeInstall: false,
  installed: false,
  hasPhysicalDamage: false,
  requestedResolution: 'replacement',
})

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      tag: '质保与 RMA',
      title: '申请 RMA 售后',
      intro: '提交订单号、商品、问题、照片/视频，并确认规则后发送。工作人员会审核并更新状态。',
      installTitle: '安装前先测试',
      installText: '屏幕和组件必须在最终安装前测试。安装造成的损坏可能不在质保范围内。',
      batteryTitle: '电池安全',
      batteryText: '鼓包、损坏或发热电池不得在无工作人员指引的情况下寄回。',
      steps: ['订单', '商品', '问题', '证据', '确认'],
      orderNumber: '选择订单',
      product: '选择商品',
      productPlaceholder: '请选择订单内商品',
      quantity: '数量',
      issueType: '问题类型',
      description: '问题描述',
      upload: '照片 / 视频',
      uploadText: '上传问题照片或视频',
      uploadHint: '当前为界面占位，不会真正发送文件。',
      tested: '安装前已测试商品',
      installed: '商品已经安装',
      damage: '存在物理损坏 / 进液 / 排线弯折',
      resolution: '期望处理方式',
      replacement: '换货',
      refund: '退款',
      creditNote: '信用单',
      statusMessage: 'RMA 状态',
      statusDescription: '提交后初始状态为已提交，可继续跟踪文件、审核和处理结果。',
      back: '上一步',
      next: '下一步',
      submit: '提交 RMA',
      success: 'RMA 已提交',
      successSubtitle: (id: string) => `售后单 ${id} 已创建，当前状态为已提交。`,
      statusFlow: 'RMA 状态流程',
      flow: ['已提交', '等待资料', '同意退回', '检测中', '已处理', '已完成'],
    }
  }

  return {
    tag: 'Garanzia e RMA',
    title: 'Richiedi RMA',
    intro: 'Carica ordine, articolo, problema, foto/video e conferma le regole prima dell invio. Lo staff verifichera il caso e aggiornera lo stato.',
    installTitle: 'Testare prima dell installazione',
    installText: 'Schermi e componenti devono essere testati prima del montaggio definitivo. Danni da installazione possono non essere coperti.',
    batteryTitle: 'Sicurezza batterie',
    batteryText: 'Batterie gonfie, danneggiate o calde non devono essere spedite senza istruzioni dello staff.',
    steps: ['Ordine', 'Prodotto', 'Problema', 'Prove', 'Conferma'],
    orderNumber: 'Seleziona ordine',
    product: 'Seleziona articolo',
    productPlaceholder: 'Seleziona articolo dell ordine',
    quantity: 'Quantita',
    issueType: 'Tipo problema',
    description: 'Descrizione problema',
    upload: 'Foto / video',
    uploadText: 'Carica foto o video del problema',
    uploadHint: 'Placeholder UI, nessun file viene inviato.',
    tested: 'Prodotto testato prima dell installazione',
    installed: 'Prodotto gia installato',
    damage: 'Presenza di danni fisici / liquidi / flat piegato',
    resolution: 'Soluzione richiesta',
    replacement: 'Sostituzione',
    refund: 'Rimborso',
    creditNote: 'Credit note',
    statusMessage: 'Stato RMA',
    statusDescription: 'Dopo l invio lo stato iniziale sara Inviata. Potrai seguire documenti, verifica e decisione.',
    back: 'Indietro',
    next: 'Avanti',
    submit: 'Invia RMA',
    success: 'RMA inviata',
    successSubtitle: (id: string) => `Pratica ${id} creata in stato Inviata.`,
    statusFlow: 'Flusso stato RMA',
    flow: ['Inviata', 'Attesa documenti', 'Approvata reso', 'In verifica', 'Risolta', 'Completata'],
  }
})

const steps = computed(() => copy.value.steps)
const selectedOrder = computed(
  () => orders.value.find((order) => order.orderNo === rmaRequest.orderNumber) || null,
)
const orderOptions = computed(() =>
  orders.value.map((order) => ({
    label: `${order.orderNo} · ${order.lines.length} ${copy.value.product}`,
    value: order.orderNo,
  })),
)
const productOptions = computed(() =>
  (selectedOrder.value?.lines || []).map((line) => ({
    label: `${line.productName} · ${line.qualityGrade} · x${line.quantity}`,
    value: line.skuCode,
  })),
)

function nextStep() {
  currentStep.value = Math.min(currentStep.value + 1, steps.value.length - 1)
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

async function handleSubmit() {
  isSubmitting.value = true

  try {
    const result = await submitRmaRequest(rmaRequest)
    submittedCaseId.value = result.id
    message.success(copy.value.success)
  } finally {
    isSubmitting.value = false
  }
}

async function loadOrders() {
  orders.value = await fetchCustomerOrders()

  const queryOrder = String(route.query.order || '')
  const firstOrder = orders.value[0]
  const targetOrder =
    orders.value.find((order) => order.orderNo === queryOrder || order.id === queryOrder) || firstOrder

  if (targetOrder && !rmaRequest.orderNumber) {
    rmaRequest.orderNumber = targetOrder.orderNo
  }
}

watch(
  () => rmaRequest.orderNumber,
  () => {
    const firstLine = selectedOrder.value?.lines[0]
    rmaRequest.skuCode = firstLine?.skuCode || ''
    rmaRequest.quantity = firstLine ? Math.min(firstLine.quantity, 1) : 1
  },
)

onMounted(loadOrders)
</script>

<template>
  <main class="rma-page">
    <section class="rma-shell">
      <aside class="rma-rules">
        <a-tag color="orange">{{ copy.tag }}</a-tag>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.intro }}</p>
        <a-alert
          type="warning"
          show-icon
          :message="copy.installTitle"
          :description="copy.installText"
        />
        <a-alert
          type="error"
          show-icon
          :message="copy.batteryTitle"
          :description="copy.batteryText"
        />
      </aside>

      <a-card v-if="!submittedCaseId" class="rma-form-card">
        <a-steps :current="currentStep" :items="steps.map((title) => ({ title }))" />

        <a-form layout="vertical" class="rma-step-form">
          <template v-if="currentStep === 0">
            <a-form-item :label="copy.orderNumber">
              <a-select
                v-model:value="rmaRequest.orderNumber"
                :options="orderOptions"
                placeholder="SO-..."
              />
            </a-form-item>
          </template>

          <template v-if="currentStep === 1">
            <a-form-item :label="copy.product">
              <a-select
                v-model:value="rmaRequest.skuCode"
                :options="productOptions"
                :placeholder="copy.productPlaceholder"
              />
            </a-form-item>
            <a-form-item :label="copy.quantity">
              <a-input-number v-model:value="rmaRequest.quantity" :min="1" />
            </a-form-item>
          </template>

          <template v-if="currentStep === 2">
            <a-form-item :label="copy.issueType">
              <a-select
                v-model:value="rmaRequest.issueType"
                :options="[
                  { label: 'Danno all arrivo', value: 'arrival_damage' },
                  { label: 'Difetto funzionale', value: 'functional_defect' },
                  { label: 'Modello errato', value: 'wrong_model' },
                  { label: 'Articolo mancante/errato', value: 'missing_wrong_item' },
                  { label: 'Danno da installazione', value: 'installation_damage' },
                  { label: 'Danno da trasporto', value: 'shipping_damage' },
                  { label: 'Problema di lotto', value: 'batch_issue' },
                ]"
              />
            </a-form-item>
            <a-form-item :label="copy.description">
              <a-textarea v-model:value="rmaRequest.description" :rows="5" />
            </a-form-item>
          </template>

          <template v-if="currentStep === 3">
            <a-form-item :label="copy.upload">
              <a-upload-dragger :before-upload="() => false" multiple>
                <p class="ant-upload-drag-icon">+</p>
                <p class="ant-upload-text">{{ copy.uploadText }}</p>
                <p class="ant-upload-hint">{{ copy.uploadHint }}</p>
              </a-upload-dragger>
            </a-form-item>
            <a-checkbox v-model:checked="rmaRequest.testedBeforeInstall">
              {{ copy.tested }}
            </a-checkbox>
            <a-checkbox v-model:checked="rmaRequest.installed">
              {{ copy.installed }}
            </a-checkbox>
            <a-checkbox v-model:checked="rmaRequest.hasPhysicalDamage">
              {{ copy.damage }}
            </a-checkbox>
          </template>

          <template v-if="currentStep === 4">
            <a-form-item :label="copy.resolution">
              <a-radio-group v-model:value="rmaRequest.requestedResolution">
                <a-radio value="replacement">{{ copy.replacement }}</a-radio>
                <a-radio value="refund">{{ copy.refund }}</a-radio>
                <a-radio value="credit_note">{{ copy.creditNote }}</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-alert
              type="info"
              show-icon
              :message="copy.statusMessage"
              :description="copy.statusDescription"
            />
          </template>
        </a-form>

        <div class="form-actions">
          <a-button :disabled="currentStep === 0" @click="previousStep">{{ copy.back }}</a-button>
          <a-button v-if="currentStep < steps.length - 1" type="primary" @click="nextStep">
            {{ copy.next }}
          </a-button>
          <a-button v-else type="primary" :loading="isSubmitting" @click="handleSubmit">
            {{ copy.submit }}
          </a-button>
        </div>
      </a-card>

      <a-result
        v-else
        status="success"
        :title="copy.success"
        :sub-title="copy.successSubtitle(submittedCaseId)"
      />
    </section>

    <a-card class="rma-status-card" :title="copy.statusFlow">
      <a-steps
        :current="1"
        :items="copy.flow.map((title) => ({ title }))"
      />
    </a-card>
  </main>
</template>
