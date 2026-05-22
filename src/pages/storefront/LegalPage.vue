<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const legalPages = {
  terms: {
    title: 'Termini e Condizioni',
    tag: 'Contratto vendita',
    sections: [
      'Condizioni di vendita per clienti B2B e B2C.',
      'Prezzi, disponibilita e conferma ordine possono essere verificati dallo staff prima della spedizione.',
      'Per i clienti B2B valgono condizioni commerciali, MOQ e pagamento concordati.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    tag: 'GDPR',
    sections: [
      'Descrive finalita, base giuridica e tempi di conservazione dei dati.',
      'Include dati account, ordini, fatture, spedizioni, RMA e comunicazioni assistenza.',
      'Il cliente puo richiedere accesso, rettifica o cancellazione secondo GDPR.',
    ],
  },
  cookies: {
    title: 'Cookie Policy',
    tag: 'Cookie',
    sections: [
      'Cookie necessari per login, carrello e sicurezza.',
      'Cookie statistici e marketing devono essere separati e non preselezionati.',
      'Il banner cookie dovra permettere gestione preferenze.',
    ],
  },
  returns: {
    title: 'Politica di Reso',
    tag: 'Resi',
    sections: [
      'Le regole di reso possono differire per B2B e B2C.',
      'Prodotti installati, danneggiati o contaminati possono essere esclusi.',
      'Le richieste devono essere tracciate tramite RMA.',
    ],
  },
  'warranty-rma': {
    title: 'Garanzia e RMA',
    tag: 'Assistenza',
    sections: [
      'Schermi: test obbligatorio prima del montaggio definitivo.',
      'Flat piegati, liquidi, colla, pressione o danni da installazione possono non essere coperti.',
      'Le pratiche richiedono ordine, SKU, descrizione, foto/video e verifica staff.',
    ],
  },
  shipping: {
    title: 'Spedizioni',
    tag: 'Logistica',
    sections: [
      'Italia 24/48h dove disponibile.',
      'Ordini pagati entro le 15:00 possono essere spediti in giornata.',
      'Batterie e prodotti speciali possono richiedere regole dedicate.',
    ],
  },
  payments: {
    title: 'Pagamenti',
    tag: 'Pagamenti',
    sections: [
      'Metodi previsti: Stripe carta, PayPal e Bonifico Bancario.',
      'Conti B2B approvati possono richiedere condizioni dedicate.',
      'Il pagamento non sostituisce la verifica stock e fatturazione.',
    ],
  },
  'battery-safety': {
    title: 'Sicurezza Batterie',
    tag: 'Batterie',
    sections: [
      'Non piegare, forare, schiacciare, cortocircuitare o riscaldare batterie al litio.',
      'Interrompere l uso in caso di gonfiore, perdita, odore, calore o danni.',
      'Reso, trasporto e smaltimento devono seguire istruzioni e norme applicabili.',
    ],
  },
  legal: {
    title: 'Informazioni Legali',
    tag: 'Azienda',
    sections: [
      'Ragione sociale, sede legale, P.IVA, Codice Fiscale, REA, PEC e SDI.',
      'Questi dati devono essere confermati prima del go-live.',
      'Le informazioni fiscali e legali devono essere verificate da consulente italiano.',
    ],
  },
}

const pageKey = computed(() => String(route.params.page || 'terms'))
const page = computed(() => legalPages[pageKey.value as keyof typeof legalPages] || legalPages.terms)
</script>

<template>
  <main class="legal-page">
    <a-card>
      <a-space direction="vertical" :size="20">
        <a-tag color="blue">{{ page.tag }}</a-tag>
        <div>
          <h1>{{ page.title }}</h1>
          <p>
            Contenuto policy MVP. Prima della pubblicazione finale deve essere
            confermato da consulente legale/fiscale per il mercato italiano.
          </p>
        </div>
        <a-alert
          type="warning"
          show-icon
          message="Bozza operativa"
          description="Questa pagina definisce la struttura UI e i punti obbligatori. Il testo legale finale non deve essere generato automaticamente."
        />
        <a-list :data-source="page.sections">
          <template #renderItem="{ item }">
            <a-list-item>{{ item }}</a-list-item>
          </template>
        </a-list>
      </a-space>
    </a-card>
  </main>
</template>
