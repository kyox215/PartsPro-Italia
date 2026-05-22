<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCircleOutlined,
  FileProtectOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShopOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'
import { t } from '@/i18n/messages'
import { useUiStore } from '@/stores/ui.store'

const router = useRouter()
const uiStore = useUiStore()

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      kicker: '意大利手机维修配件 B2B 供应',
      title: '为维修店、实验室和经销商准备的配件采购平台',
      description:
        '屏幕、电池、尾插、摄像头和维修耗材集中采购。访客可浏览目录，登录后查看 B2B 批发价、阶梯价、实时库存、发票资料和售后入口。',
      primary: '查看商品目录',
      secondary: '申请 B2B 账户',
      search: '搜索 iPhone 11 屏幕、A2221、SM-G991B、电池...',
      trusted: ['意大利库存', 'VAT / SDI / PEC', 'RMA 可追踪', 'Stripe / PayPal / 转账'],
      showcaseTitle: '高周转配件',
      showcaseSubtitle: '按品牌、型号、品质和库存状态采购',
      serviceTitle: '客户采购需要的信息，首屏就能看到',
      categoryTitle: '按维修场景快速进入',
      brandTitle: '高频品牌入口',
      flowTitle: '从浏览到复购的 B2B 流程',
      flowText: '公开目录负责展示，登录权限负责价格、购物车、结账、发票和 RMA。',
    }
  }

  return {
    kicker: 'B2B ricambi smartphone in Italia',
    title: 'Ricambi pronti per laboratori, negozi e rivenditori',
    description:
      'Schermi, batterie, connettori, fotocamere e consumabili in un catalogo pensato per chi ripara ogni giorno. Sfoglia liberamente, accedi per prezzi B2B, fasce quantita, stock reale, fattura e RMA.',
    primary: 'Vedi catalogo',
    secondary: 'Richiedi account B2B',
    search: 'Cerca iPhone 11 schermo, A2221, SM-G991B, batteria...',
    trusted: ['Stock in Italia', 'VAT / SDI / PEC', 'RMA tracciabile', 'Stripe / PayPal / Bonifico'],
    showcaseTitle: 'Ricambi ad alta rotazione',
    showcaseSubtitle: 'Acquisto per brand, modello, qualita e stock',
    serviceTitle: 'Informazioni chiare prima dell’ordine',
    categoryTitle: 'Ingressi rapidi per tipo riparazione',
    brandTitle: 'Brand piu richiesti',
    flowTitle: 'Dal catalogo al riordino B2B',
    flowText: 'Catalogo pubblico per esplorare, login cliente per prezzi, carrello, checkout, fattura e RMA.',
  }
})

const serviceCards = computed(() => [
  {
    title: uiStore.language === 'zh' ? '真实库存' : 'Stock reale',
    text:
      uiStore.language === 'zh'
        ? '显示可售、低库存、在途和 MOQ，减少来回确认。'
        : 'Disponibile, low stock, incoming e MOQ sempre visibili.',
    icon: ShopOutlined,
  },
  {
    title: uiStore.language === 'zh' ? '质量等级' : 'Qualita dichiarata',
    text:
      uiStore.language === 'zh'
        ? 'Soft OLED、TFT、兼容品质、电池安全信息分区展示。'
        : 'Soft OLED, TFT, compatibili e sicurezza batterie separati.',
    icon: SafetyCertificateOutlined,
  },
  {
    title: uiStore.language === 'zh' ? '快速发货' : 'Spedizione rapida',
    text:
      uiStore.language === 'zh'
        ? '15:00 前付款订单，按意大利本土流程处理。'
        : "Ordini pagati entro le 15:00, gestione dall'Italia.",
    icon: RocketOutlined,
  },
  {
    title: uiStore.language === 'zh' ? '售后规则' : 'RMA e regole',
    text:
      uiStore.language === 'zh'
        ? '安装提醒、照片/视频证据和 RMA 状态入口清楚。'
        : 'Test prima installazione, prove e stato pratica in evidenza.',
    icon: FileProtectOutlined,
  },
])

const categories = computed(() => [
  { title: t(uiStore.language, 'homeCategoryScreens'), meta: '320+', to: '/products?category=screens' },
  { title: t(uiStore.language, 'homeCategoryBatteries'), meta: '180+', to: '/products?category=batteries' },
  { title: t(uiStore.language, 'homeCategoryCharging'), meta: '140+', to: '/products?category=charging-ports' },
  { title: t(uiStore.language, 'homeCategoryBackCover'), meta: '95+', to: '/products?category=back-cover' },
  { title: t(uiStore.language, 'homeCategoryCameras'), meta: '70+', to: '/products?category=cameras' },
  { title: t(uiStore.language, 'homeCategoryTools'), meta: '60+', to: '/products?category=tools' },
])

const brands = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Honor', 'Realme', 'OnePlus']

const flowSteps = computed(() => [
  uiStore.language === 'zh' ? '浏览公开目录' : 'Catalogo pubblico',
  uiStore.language === 'zh' ? '登录查看批发价' : 'Prezzi dopo login',
  uiStore.language === 'zh' ? '购物车与发票' : 'Carrello e fattura',
  uiStore.language === 'zh' ? '复购与 RMA' : 'Riordino e RMA',
])

function handleHeroSearch(value: string) {
  router.push({
    path: '/products',
    query: value ? { q: value } : undefined,
  })
}
</script>

<template>
  <main class="home-page customer-home">
    <section class="customer-hero">
      <div class="customer-hero-copy">
        <a-tag color="blue">{{ copy.kicker }}</a-tag>
        <h1>{{ copy.title }}</h1>
        <p>{{ copy.description }}</p>

        <a-input-search
          size="large"
          class="home-hero-search"
          :placeholder="copy.search"
          @search="handleHeroSearch"
        >
          <template #enterButton>
            <a-button type="primary" size="large">
              <SearchOutlined />
              {{ t(uiStore.language, 'homeHeroSearchButton') }}
            </a-button>
          </template>
        </a-input-search>

        <div class="customer-hero-actions">
          <RouterLink to="/products">
            <a-button type="primary" size="large">{{ copy.primary }}</a-button>
          </RouterLink>
          <RouterLink to="/b2b/register">
            <a-button size="large">{{ copy.secondary }}</a-button>
          </RouterLink>
        </div>

        <div class="customer-trust-row">
          <span v-for="item in copy.trusted" :key="item">
            <CheckCircleOutlined />
            {{ item }}
          </span>
        </div>
      </div>

      <div class="parts-showcase" aria-hidden="true">
        <div class="parts-showcase-header">
          <strong>{{ copy.showcaseTitle }}</strong>
          <span>{{ copy.showcaseSubtitle }}</span>
        </div>
        <div class="parts-phone-visual">
          <div class="phone-screen-part">OLED</div>
          <div class="phone-battery-part">BAT</div>
          <div class="phone-flex-part">USB-C</div>
          <div class="phone-camera-part">CAM</div>
        </div>
        <div class="parts-showcase-grid">
          <span>IP11-SCR</span>
          <span>SM-A52</span>
          <span>RN10-BKC</span>
          <span>UN38.3</span>
        </div>
      </div>
    </section>

    <section class="home-service-panel">
      <div class="home-panel-title">
        <h2>{{ copy.serviceTitle }}</h2>
        <RouterLink to="/quality-guide">{{ uiStore.language === 'zh' ? '质量说明' : 'Guida qualita' }}</RouterLink>
      </div>
      <div class="home-service-grid">
        <a-card v-for="card in serviceCards" :key="card.title">
          <component :is="card.icon" class="value-icon" />
          <h3>{{ card.title }}</h3>
          <p>{{ card.text }}</p>
        </a-card>
      </div>
    </section>

    <section class="home-commerce-grid">
      <div class="home-category-panel">
        <div class="home-panel-title">
          <h2>{{ copy.categoryTitle }}</h2>
          <RouterLink to="/products">{{ copy.primary }}</RouterLink>
        </div>
        <div class="home-category-grid">
          <RouterLink
            v-for="category in categories"
            :key="category.title"
            class="home-category-card"
            :to="category.to"
          >
            <span>{{ category.title }}</span>
            <strong>{{ category.meta }} {{ t(uiStore.language, 'homeCategoryPartsCount') }}</strong>
          </RouterLink>
        </div>
      </div>

      <div class="home-brand-panel">
        <div class="home-panel-title">
          <h2>{{ copy.brandTitle }}</h2>
        </div>
        <div class="home-brand-grid compact">
          <RouterLink v-for="brand in brands" :key="brand" :to="`/brands/${brand.toLowerCase()}`">
            {{ brand }}
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="home-flow-band">
      <div>
        <ToolOutlined />
        <h2>{{ copy.flowTitle }}</h2>
        <p>{{ copy.flowText }}</p>
      </div>
      <div class="home-flow-steps">
        <span v-for="(step, index) in flowSteps" :key="step">
          <strong>{{ index + 1 }}</strong>
          {{ step }}
        </span>
      </div>
    </section>
  </main>
</template>
