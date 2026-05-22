<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'

const route = useRoute()
const uiStore = useUiStore()

const zhPageCopy: Record<string, { title: string; description: string }> = {
  brand: { title: '品牌页面', description: '按品牌进入商品筛选，保持当前采购上下文。' },
  model: { title: '型号页面', description: '展示指定型号可用的维修配件。' },
  'quality-guide': { title: '配件质量说明', description: '说明不同质量等级、安装提醒和售后规则。' },
  wholesale: { title: 'B2B 批发采购', description: '介绍批发价、MOQ、发票和专属服务。' },
  'account-orders': { title: '我的订单', description: '查看订单历史、付款、配送和售后入口。' },
  'account-invoices': { title: '发票', description: '下载发票、信用单和查看税务资料。' },
  'account-frequent': { title: '常购清单', description: '保存门店常用配件，方便快速复购。' },
  'account-addresses': { title: '地址管理', description: '管理门店、发票地址和收货地址。' },
  'account-company': { title: '公司资料', description: '维护 P.IVA、SDI、PEC、联系人和 B2B 资料。' },
  'account-prices': { title: '专属价格', description: '查看价格组、采购条件和阶梯价说明。' },
}

const title = computed(() => {
  const routeName = String(route.name || '')
  return uiStore.language === 'zh'
    ? zhPageCopy[routeName]?.title || 'PartsPro 页面'
    : String(route.meta.title || 'PartsPro')
})
const description = computed(() => {
  const routeName = String(route.name || '')
  return uiStore.language === 'zh'
    ? zhPageCopy[routeName]?.description || '此页面已纳入 MVP 功能闭环，将按后续进度补齐。'
    : String(route.meta.description || 'Pagina pianificata per il MVP PartsPro.')
})
const access = computed(() => String(route.meta.access || 'public'))
const messageTitle = computed(() => (uiStore.language === 'zh' ? '结构已接入' : 'Struttura pronta'))
const messageDescription = computed(() =>
  uiStore.language === 'zh'
    ? '入口和权限逻辑已闭合，后续只需要继续补充具体业务内容。'
    : 'Questa pagina e parte dello scheletro MVP. I contenuti funzionali saranno completati nei prossimi goal.',
)
</script>

<template>
  <main class="placeholder-page">
    <a-card>
      <a-space direction="vertical" :size="16">
        <a-tag color="blue">{{ access }}</a-tag>
        <div>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
        <a-alert
          type="info"
          show-icon
          :message="messageTitle"
          :description="messageDescription"
        />
      </a-space>
    </a-card>
  </main>
</template>
