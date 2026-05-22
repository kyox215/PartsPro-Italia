<script setup lang="ts">
import { reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { submitRmaRequest } from '@/services/rma.service'
import type { RmaRequest } from '@/types/rma'

const currentStep = ref(0)
const isSubmitting = ref(false)
const submittedCaseId = ref('')

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

const steps = [
  'Ordine',
  'Prodotto',
  'Problema',
  'Prove',
  'Conferma',
]

function nextStep() {
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1)
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

async function handleSubmit() {
  isSubmitting.value = true

  try {
    const result = await submitRmaRequest(rmaRequest)
    submittedCaseId.value = result.id
    message.success('RMA inviata')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="rma-page">
    <section class="rma-shell">
      <aside class="rma-rules">
        <a-tag color="orange">Garanzia e RMA</a-tag>
        <h1>Richiedi RMA</h1>
        <p>
          Carica ordine, SKU, problema, foto/video e conferma le regole prima
          dell'invio. Lo staff verifichera il caso e aggiornera lo stato.
        </p>
        <a-alert
          type="warning"
          show-icon
          message="Testare prima dell'installazione"
          description="Schermi e componenti devono essere testati prima del montaggio definitivo. Danni da installazione possono non essere coperti."
        />
        <a-alert
          type="error"
          show-icon
          message="Sicurezza batterie"
          description="Batterie gonfie, danneggiate o calde non devono essere spedite senza istruzioni dello staff."
        />
      </aside>

      <a-card v-if="!submittedCaseId" class="rma-form-card">
        <a-steps :current="currentStep" :items="steps.map((title) => ({ title }))" />

        <a-form layout="vertical" class="rma-step-form">
          <template v-if="currentStep === 0">
            <a-form-item label="Numero ordine">
              <a-input v-model:value="rmaRequest.orderNumber" placeholder="SO-..." />
            </a-form-item>
          </template>

          <template v-if="currentStep === 1">
            <a-form-item label="SKU">
              <a-input v-model:value="rmaRequest.skuCode" placeholder="IP11-SCR-SOFT-BLK" />
            </a-form-item>
            <a-form-item label="Quantita">
              <a-input-number v-model:value="rmaRequest.quantity" :min="1" />
            </a-form-item>
          </template>

          <template v-if="currentStep === 2">
            <a-form-item label="Tipo problema">
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
            <a-form-item label="Descrizione problema">
              <a-textarea v-model:value="rmaRequest.description" :rows="5" />
            </a-form-item>
          </template>

          <template v-if="currentStep === 3">
            <a-form-item label="Foto / video">
              <a-upload-dragger :before-upload="() => false" multiple>
                <p class="ant-upload-drag-icon">+</p>
                <p class="ant-upload-text">Carica foto o video del problema</p>
                <p class="ant-upload-hint">Placeholder UI, nessun file viene inviato in P7.</p>
              </a-upload-dragger>
            </a-form-item>
            <a-checkbox v-model:checked="rmaRequest.testedBeforeInstall">
              Prodotto testato prima dell'installazione
            </a-checkbox>
            <a-checkbox v-model:checked="rmaRequest.installed">
              Prodotto gia installato
            </a-checkbox>
            <a-checkbox v-model:checked="rmaRequest.hasPhysicalDamage">
              Presenza di danni fisici / liquidi / flat piegato
            </a-checkbox>
          </template>

          <template v-if="currentStep === 4">
            <a-form-item label="Soluzione richiesta">
              <a-radio-group v-model:value="rmaRequest.requestedResolution">
                <a-radio value="replacement">Sostituzione</a-radio>
                <a-radio value="refund">Rimborso</a-radio>
                <a-radio value="credit_note">Credit note</a-radio>
              </a-radio-group>
            </a-form-item>
            <a-alert
              type="info"
              show-icon
              message="Stato RMA"
              description="Dopo l'invio lo stato iniziale sara Inviata. Potrai seguire documenti, verifica e decisione."
            />
          </template>
        </a-form>

        <div class="form-actions">
          <a-button :disabled="currentStep === 0" @click="previousStep">Indietro</a-button>
          <a-button v-if="currentStep < steps.length - 1" type="primary" @click="nextStep">
            Avanti
          </a-button>
          <a-button v-else type="primary" :loading="isSubmitting" @click="handleSubmit">
            Invia RMA
          </a-button>
        </div>
      </a-card>

      <a-result
        v-else
        status="success"
        title="RMA inviata"
        :sub-title="`Pratica ${submittedCaseId} creata in stato Inviata.`"
      />
    </section>

    <a-card class="rma-status-card" title="Flusso stato RMA">
      <a-steps
        :current="1"
        :items="[
          { title: 'Inviata' },
          { title: 'Attesa documenti' },
          { title: 'Approvata reso' },
          { title: 'In verifica' },
          { title: 'Risolta' },
          { title: 'Completata' },
        ]"
      />
    </a-card>
  </main>
</template>
