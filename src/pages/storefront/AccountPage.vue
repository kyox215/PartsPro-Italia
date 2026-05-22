<script setup lang="ts">
import { computed } from 'vue'
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
import { useUiStore } from '@/stores/ui.store'

const authStore = useAuthStore()
const uiStore = useUiStore()

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      title: '客户中心',
      description: '管理订单、RMA、发票、地址和快速复购。',
      tier: '客户等级',
      tierText: '账户审核后可查看 B2B 批发价。',
      entries: [
        { title: '订单', text: '订单历史和配送状态', icon: ShoppingOutlined, to: '/account/orders' },
        { title: '快速复购', text: '从近期购买的配件继续采购', icon: ReloadOutlined, to: '/products' },
        { title: 'RMA 售后', text: '售后申请和处理进度', icon: SafetyCertificateOutlined, to: '/account/rma' },
        { title: '发票', text: '下载发票和税务资料', icon: FileTextOutlined, to: '/account/invoices' },
        { title: '常购清单', text: '门店常用配件清单', icon: HistoryOutlined, to: '/account/frequent' },
        { title: '地址', text: '门店和收货地址', icon: HomeOutlined, to: '/account/addresses' },
        { title: '公司资料', text: 'P.IVA、SDI、PEC 和 B2B 资料', icon: ProfileOutlined, to: '/account/company' },
        { title: '专属价格', text: '价格组和 B2B 条件', icon: TagsOutlined, to: '/account/prices' },
      ],
    }
  }

  return {
    title: 'Area cliente',
    description: 'Gestisci ordini, RMA, fatture, indirizzi e riordino rapido.',
    tier: 'Livello cliente',
    tierText: 'Prezzi B2B visibili dopo approvazione account.',
    entries: [
      { title: 'Ordini', text: 'Storico ordini e stati spedizione', icon: ShoppingOutlined, to: '/account/orders' },
      { title: 'Riordina veloce', text: 'Riparti dai ricambi acquistati di recente', icon: ReloadOutlined, to: '/products' },
      { title: 'RMA', text: 'Richieste assistenza e avanzamento pratiche', icon: SafetyCertificateOutlined, to: '/account/rma' },
      { title: 'Fatture', text: 'Download fatture e dati fiscali', icon: FileTextOutlined, to: '/account/invoices' },
      { title: 'Lista frequenti', text: 'Ricambi usati spesso dalla tua officina', icon: HistoryOutlined, to: '/account/frequent' },
      { title: 'Indirizzi', text: 'Sedi e indirizzi di consegna', icon: HomeOutlined, to: '/account/addresses' },
      { title: 'Dati aziendali', text: 'P.IVA, SDI, PEC e profilo B2B', icon: ProfileOutlined, to: '/account/company' },
      { title: 'Prezzi dedicati', text: 'Gruppo prezzo e condizioni B2B', icon: TagsOutlined, to: '/account/prices' },
    ],
  }
})
</script>

<template>
  <main class="account-page">
    <section class="account-hero">
      <div>
        <a-tag color="blue">{{ authStore.role }}</a-tag>
        <h1>{{ copy.title }}</h1>
        <p>
          {{ authStore.profile?.email }} - {{ copy.description }}
        </p>
      </div>
      <a-card class="customer-tier-card">
        <a-statistic :title="copy.tier" value="B2B Basic" />
        <p>{{ copy.tierText }}</p>
      </a-card>
    </section>

    <section class="account-grid">
      <RouterLink
        v-for="entry in copy.entries"
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
