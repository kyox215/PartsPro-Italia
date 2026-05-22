<script setup lang="ts">
import {
  FileTextOutlined,
  HistoryOutlined,
  HomeOutlined,
  ProfileOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TagsOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth.store'

const authStore = useAuthStore()

const accountEntries = [
  { title: 'Ordini', text: 'Storico ordini e stati spedizione', icon: ShoppingOutlined, to: '/account/orders' },
  { title: 'Riordina veloce', text: 'Riparti dagli SKU acquistati di recente', icon: ReloadOutlined, to: '/products' },
  { title: 'RMA', text: 'Richieste assistenza e avanzamento pratiche', icon: SafetyCertificateOutlined, to: '/account/rma' },
  { title: 'Fatture', text: 'Download fatture e dati fiscali', icon: FileTextOutlined, to: '/account' },
  { title: 'Lista frequenti', text: 'SKU usati spesso dalla tua officina', icon: HistoryOutlined, to: '/account' },
  { title: 'Indirizzi', text: 'Sedi e indirizzi di consegna', icon: HomeOutlined, to: '/account' },
  { title: 'Dati aziendali', text: 'P.IVA, SDI, PEC e profilo B2B', icon: ProfileOutlined, to: '/account' },
  { title: 'Prezzi dedicati', text: 'Gruppo prezzo e condizioni B2B', icon: TagsOutlined, to: '/products' },
]
</script>

<template>
  <main class="account-page">
    <section class="account-hero">
      <div>
        <a-tag color="blue">{{ authStore.role }}</a-tag>
        <h1>Area cliente</h1>
        <p>
          {{ authStore.profile?.email }} - gestisci ordini, RMA, fatture, indirizzi e
          riordino rapido.
        </p>
      </div>
      <a-card class="customer-tier-card">
        <a-statistic title="Livello cliente" value="B2B Basic" />
        <p>Prezzi B2B visibili dopo approvazione account.</p>
      </a-card>
    </section>

    <section class="account-grid">
      <RouterLink
        v-for="entry in accountEntries"
        :key="entry.title"
        :to="entry.to"
        class="account-entry"
      >
        <a-card hoverable>
          <component :is="entry.icon" class="account-entry-icon" />
          <h2>{{ entry.title }}</h2>
          <p>{{ entry.text }}</p>
        </a-card>
      </RouterLink>
    </section>
  </main>
</template>
