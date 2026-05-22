<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { submitB2BApplication } from '@/services/b2b.service'
import type { B2BApplication } from '@/types/b2b'

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

const steps = [
  'Account',
  'Azienda e VAT',
  'Fattura e spedizione',
  'Acquisti',
  'Conferma',
]

const categoryOptions = [
  'Schermi',
  'Batterie',
  'Connettori ricarica',
  'Back cover',
  'Fotocamere',
  'Tools',
]

const paymentOptions = ['Bonifico bancario', 'Carta / Stripe', 'PayPal', 'Richiesta fido']

const isSubmitted = computed(() => Boolean(submittedId.value))

function nextStep() {
  currentStep.value = Math.min(currentStep.value + 1, steps.length - 1)
}

function previousStep() {
  currentStep.value = Math.max(currentStep.value - 1, 0)
}

async function handleSubmit() {
  if (!application.acceptsTerms || !application.acceptsPrivacy) {
    message.error('Accetta termini e privacy per inviare la richiesta.')
    return
  }

  isSubmitting.value = true

  try {
    const result = await submitB2BApplication(application)
    submittedId.value = result.id
    message.success('Richiesta B2B inviata')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="b2b-register-page">
    <section class="b2b-register-shell">
      <aside class="b2b-benefits">
        <a-tag color="blue">B2B PartsPro</a-tag>
        <h1>Richiedi account B2B</h1>
        <p>
          Per negozi di riparazione, refurbisher, rivenditori e grossisti. Dopo la
          verifica potrai vedere prezzi B2B, fasce quantita e storico ordini.
        </p>
        <a-list
          :data-source="[
            'Prezzi dedicati e fasce quantita',
            'Stock in Italia e spedizione 24/48h',
            'Fattura elettronica con SDI/PEC',
            'RMA tracciabile e supporto WhatsApp',
          ]"
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
            <a-form-item label="Email" required>
              <a-input v-model:value="application.email" autocomplete="email" />
            </a-form-item>
            <a-form-item label="Password">
              <a-input-password v-model:value="application.password" />
            </a-form-item>
            <a-form-item label="Referente" required>
              <a-input v-model:value="application.contactName" />
            </a-form-item>
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item label="Telefono">
                  <a-input v-model:value="application.phone" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="WhatsApp">
                  <a-input v-model:value="application.whatsapp" />
                </a-form-item>
              </a-col>
            </a-row>
          </template>

          <template v-if="currentStep === 1">
            <a-form-item label="Ragione sociale" required>
              <a-input v-model:value="application.companyName" />
            </a-form-item>
            <a-row :gutter="12">
              <a-col :xs="24" :md="12">
                <a-form-item label="P.IVA" required>
                  <a-input v-model:value="application.vatNumber" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :md="12">
                <a-form-item label="Codice Fiscale">
                  <a-input v-model:value="application.fiscalCode" />
                </a-form-item>
              </a-col>
            </a-row>
            <a-form-item label="Tipo azienda">
              <a-select
                v-model:value="application.companyType"
                placeholder="Seleziona"
                :options="[
                  { label: 'Negozio riparazioni', value: 'repair_shop' },
                  { label: 'Grossista', value: 'wholesaler' },
                  { label: 'Refurbisher', value: 'refurbisher' },
                  { label: 'E-commerce seller', value: 'ecommerce' },
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
            <a-form-item label="Indirizzo sede legale">
              <a-textarea v-model:value="application.registeredAddress" :rows="3" />
            </a-form-item>
            <a-form-item label="Indirizzo spedizione">
              <a-textarea v-model:value="application.shippingAddress" :rows="3" />
            </a-form-item>
          </template>

          <template v-if="currentStep === 3">
            <a-form-item label="Acquisto mensile stimato">
              <a-select
                v-model:value="application.monthlyPurchase"
                placeholder="Seleziona fascia"
                :options="[
                  { label: 'Meno di €500', value: 'lt_500' },
                  { label: '€500 - €2.000', value: '500_2000' },
                  { label: '€2.000 - €5.000', value: '2000_5000' },
                  { label: 'Oltre €5.000', value: 'gt_5000' },
                ]"
              />
            </a-form-item>
            <a-form-item label="Categorie interessate">
              <a-checkbox-group
                v-model:value="application.interestedCategories"
                :options="categoryOptions"
              />
            </a-form-item>
            <a-form-item label="Esigenze pagamento">
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
              message="Verifica richiesta"
              description="Dopo l'invio il team PartsPro controllera P.IVA, dati aziendali e gruppo prezzi."
            />
            <a-checkbox v-model:checked="application.acceptsTerms">
              Accetto Termini e Condizioni
            </a-checkbox>
            <a-checkbox v-model:checked="application.acceptsPrivacy">
              Accetto Privacy Policy
            </a-checkbox>
            <a-checkbox v-model:checked="application.acceptsMarketing">
              Desidero ricevere offerte B2B via email o WhatsApp
            </a-checkbox>
          </template>
        </a-form>

        <div class="form-actions">
          <a-button :disabled="currentStep === 0" @click="previousStep">Indietro</a-button>
          <a-button v-if="currentStep < steps.length - 1" type="primary" @click="nextStep">
            Avanti
          </a-button>
          <a-button
            v-else
            type="primary"
            :loading="isSubmitting"
            @click="handleSubmit"
          >
            Invia richiesta
          </a-button>
        </div>
      </a-card>

      <a-result
        v-else
        status="success"
        title="Richiesta B2B inviata"
        :sub-title="`ID richiesta: ${submittedId}. Riceverai una conferma dopo la verifica.`"
      />
    </section>
  </main>
</template>
