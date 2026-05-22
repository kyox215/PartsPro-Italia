<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui.store'

const route = useRoute()
const uiStore = useUiStore()

const legalPages = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      terms: {
        title: '条款与条件',
        tag: '销售合同',
        sections: [
          '定义 B2B 与 B2C 客户的销售条件。',
          '价格、库存和订单确认可能会在发货前由工作人员核验。',
          'B2B 客户适用约定的商业条件、MOQ 和付款方式。',
        ],
      },
      privacy: {
        title: '隐私政策',
        tag: 'GDPR',
        sections: [
          '说明数据处理目的、法律依据和保存期限。',
          '涵盖账户、订单、发票、配送、RMA 和客服沟通数据。',
          '客户可根据 GDPR 申请访问、更正或删除数据。',
        ],
      },
      cookies: {
        title: 'Cookie 政策',
        tag: 'Cookie',
        sections: [
          '必要 Cookie 用于登录、购物车和安全。',
          '统计和营销 Cookie 应分开管理，且不得默认勾选。',
          'Cookie 横幅应允许用户管理偏好。',
        ],
      },
      returns: {
        title: '退货政策',
        tag: '退货',
        sections: [
          'B2B 与 B2C 的退货规则可能不同。',
          '已安装、损坏或污染的商品可能不适用退货。',
          '退货请求必须通过 RMA 流程追踪。',
        ],
      },
      'warranty-rma': {
        title: '质保与 RMA',
        tag: '售后',
        sections: [
          '屏幕类商品最终安装前必须测试。',
          '排线弯折、进液、胶水、压伤或安装损坏可能不在质保范围。',
          '售后申请需要订单、商品、描述、照片/视频和工作人员审核。',
        ],
      },
      shipping: {
        title: '配送',
        tag: '物流',
        sections: [
          '意大利可覆盖区域参考 24/48 小时到达。',
          '15:00 前付款订单在条件满足时可当天发货。',
          '电池和特殊商品可能需要专门运输规则。',
        ],
      },
      payments: {
        title: '支付',
        tag: '支付',
        sections: [
          '预留支付方式：Stripe 银行卡、PayPal 和银行转账。',
          '已审核 B2B 账户可申请专属条件。',
          '付款不替代库存、价格和发票核验。',
        ],
      },
      'battery-safety': {
        title: '电池安全',
        tag: '电池',
        sections: [
          '不要弯折、刺穿、挤压、短路或加热锂电池。',
          '如出现鼓包、漏液、异味、发热或损坏，应立即停止使用。',
          '退回、运输和处置必须遵循工作人员指引及适用法规。',
        ],
      },
      legal: {
        title: '法律信息',
        tag: '公司',
        sections: [
          '公司名称、注册地址、P.IVA、税号、REA、PEC 和 SDI。',
          '这些资料上线前必须确认。',
          '税务和法律信息需由意大利专业顾问核验。',
        ],
      },
    }
  }

  return {
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
      'Le pratiche richiedono ordine, articolo, descrizione, foto/video e verifica staff.',
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
})

const pageKey = computed(() => String(route.params.page || 'terms'))
const page = computed(() => legalPages.value[pageKey.value as keyof typeof legalPages.value] || legalPages.value.terms)
const intro = computed(() =>
  uiStore.language === 'zh'
    ? 'MVP 政策内容。正式发布前必须由面向意大利市场的法律/税务顾问确认。'
    : 'Contenuto policy MVP. Prima della pubblicazione finale deve essere confermato da consulente legale/fiscale per il mercato italiano.',
)
const alertTitle = computed(() => (uiStore.language === 'zh' ? '运营草稿' : 'Bozza operativa'))
const alertDescription = computed(() =>
  uiStore.language === 'zh'
    ? '此页面定义 UI 结构和必要信息点，最终法律文本不应自动生成。'
    : 'Questa pagina definisce la struttura UI e i punti obbligatori. Il testo legale finale non deve essere generato automaticamente.',
)
</script>

<template>
  <main class="legal-page">
    <a-card>
      <a-space direction="vertical" :size="20">
        <a-tag color="blue">{{ page.tag }}</a-tag>
        <div>
          <h1>{{ page.title }}</h1>
          <p>{{ intro }}</p>
        </div>
        <a-alert
          type="warning"
          show-icon
          :message="alertTitle"
          :description="alertDescription"
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
