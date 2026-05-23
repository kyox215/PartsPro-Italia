<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'
import {
  fetchProducts,
  getProducts,
  getProductRoutePath,
  resolveProductImageUrl,
} from '@/services/products.service'
import { useUiStore } from '@/stores/ui.store'
import type { Product } from '@/types/product'

const router = useRouter()
const uiStore = useUiStore()
const products = ref<Product[]>(getProducts())
const failedImages = ref(new Set<string>())

const heroFallbackImage = '/assets/partspro-repair-parts.svg'

const featuredSkuOrder = [
  'IP11-SCR-SOFT-BLK',
  'IP12-BAT-HQ-2815',
  'SA52-CHG-EU-BLK',
  'RN10-BKC-BLU',
  'IP13-CAM-REAR',
  'TOOL-WATERPROOF-SET',
]

const categoryConfig = computed(() => [
  { title: uiStore.language === 'zh' ? '屏幕总成' : 'Schermi', category: 'Screens', to: '/products?category=screens' },
  { title: uiStore.language === 'zh' ? '电池' : 'Batterie', category: 'Batteries', to: '/products?category=batteries' },
  { title: uiStore.language === 'zh' ? '尾插小板' : 'Connettori', category: 'Charging Ports', to: '/products?category=charging-ports' },
  { title: uiStore.language === 'zh' ? '后盖' : 'Back cover', category: 'Back Covers', to: '/products?category=back-covers' },
  { title: uiStore.language === 'zh' ? '摄像头' : 'Fotocamere', category: 'Cameras', to: '/products?category=cameras' },
  { title: uiStore.language === 'zh' ? '工具耗材' : 'Tool e consumabili', category: 'Tools', to: '/products?category=tools' },
])

const qualityLabels = computed<Record<string, string>>(() => {
  if (uiStore.language === 'zh') {
    return {
      'Soft OLED': 'Soft OLED 精选屏',
      'High Quality Compatible': '高品质兼容',
      'Compatible High Quality': '高品质兼容',
      'Refurbished Original': '原装翻新',
      Consumable: '维修耗材',
    }
  }

  return {
    'Soft OLED': 'Soft OLED selezionato',
    'High Quality Compatible': 'Compatibile HQ',
    'Compatible High Quality': 'Compatibile HQ',
    'Refurbished Original': 'Originale ricond.',
    Consumable: 'Consumabile tecnico',
  }
})

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      heroTag: '意大利 B2B 手机维修配件供应',
      heroTitle: '为专业维修商准备的高周转配件采购平台',
      heroText:
        '从屏幕、电池、尾插到摄像头和耗材，PartsPro 把库存状态、质量等级、配送时效、发票资料和售后规则提前展示，帮助门店更快完成补货决策。',
      heroBullets: ['意大利库存优先', '登录查看批发价', '订单与 RMA 可追踪'],
      primary: '进入商品目录',
      secondary: '申请 B2B 账户',
      visualTitle: '高周转维修配件',
      visualText: '按型号、批次、质量等级和意大利库存组织',
      serviceTitle: '为高频采购设计的服务体系',
      serviceText: '从选品、库存到售后，每个环节都围绕维修业务的节奏构建。',
      deliveryTitle: '意大利本土发货与到达时效',
      deliveryText: '工作日按付款与库存状态处理订单。实际到达时间以承运商、地区和电池运输限制为准。',
      qualityTitle: '屏幕与核心配件质量策略',
      qualityText: '不同维修报价需要不同质量等级。PartsPro 将品质、兼容型号和安装提醒明确展示，减少错配和售后争议。',
      catalogTitle: '按维修场景进入采购',
      brandTitle: '主流品牌覆盖',
      ctaTitle: '准备开始更高效率的 B2B 采购',
      ctaText: '浏览公开目录，登录后查看批发价、阶梯价、发票资料、RMA 和重复采购入口。',
    }
  }

  return {
    heroTag: 'Fornitura B2B ricambi smartphone in Italia',
    heroTitle: 'Ricambi selezionati per laboratori, negozi e rivenditori',
    heroText:
      'Schermi, batterie, connettori, fotocamere e consumabili sono organizzati per stock, qualita, compatibilita, fattura e RMA prima dell’ordine.',
    heroBullets: ['Stock Italia prioritario', 'Prezzi B2B dopo login', 'Ordini e RMA tracciabili'],
    primary: 'Vedi catalogo',
    secondary: 'Richiedi account B2B',
    visualTitle: 'Ricambi ad alta rotazione',
    visualText: 'Organizzati per modello, lotto, qualita e stock in Italia',
    serviceTitle: 'Servizi pensati per chi acquista spesso',
    serviceText: 'Dal catalogo al post-vendita, ogni passaggio e costruito sul ritmo dei laboratori.',
    deliveryTitle: 'Spedizione dall’Italia e tempi di arrivo',
    deliveryText:
      'Gli ordini vengono processati nei giorni lavorativi in base a pagamento e disponibilita. I tempi dipendono da corriere, area e restrizioni per batterie.',
    qualityTitle: 'Qualita schermi e ricambi critici',
    qualityText:
      'Ogni riparazione ha un prezzo e una promessa diversa. PartsPro distingue qualita, compatibilita e note di installazione per ridurre errori e contestazioni.',
    catalogTitle: 'Acquista per scenario di riparazione',
    brandTitle: 'Brand coperti',
    ctaTitle: 'Porta il tuo acquisto B2B a un flusso piu preciso',
    ctaText: 'Sfoglia il catalogo pubblico. Accedi per prezzi B2B, fasce quantita, fattura, RMA e riordino rapido.',
  }
})

const heroStats = computed(() => [
  {
    value: '24/48h',
    label: uiStore.language === 'zh' ? '意大利主要城市常规配送' : 'Consegna standard Italia',
  },
  {
    value: '15:00',
    label: uiStore.language === 'zh' ? '工作日付款截单参考' : 'Cut-off operativo',
  },
  {
    value: 'QC',
    label: uiStore.language === 'zh' ? '质量等级与安装提醒' : 'Qualita e note installazione',
  },
])

const serviceCards = computed(() => [
  {
    title: uiStore.language === 'zh' ? '意大利库存优先' : 'Stock Italia prioritario',
    text:
      uiStore.language === 'zh'
        ? '按可售、低库存、在途和 MOQ 呈现，适合门店快速补货。'
        : 'Disponibile, low stock, incoming e MOQ sono leggibili prima dell’ordine.',
    icon: ShopOutlined,
  },
  {
    title: uiStore.language === 'zh' ? '屏幕质量分层' : 'Qualita schermi dichiarata',
    text:
      uiStore.language === 'zh'
        ? 'Soft OLED、兼容 HQ、原装翻新等等级分清楚，方便不同维修报价。'
        : 'Soft OLED, compatibili HQ e originali ricondizionati sono separati con chiarezza.',
    icon: SafetyCertificateOutlined,
  },
  {
    title: uiStore.language === 'zh' ? '快速履约' : 'Evasione rapida',
    text:
      uiStore.language === 'zh'
        ? '付款、库存和配送信息清楚后，订单可进入拣货、打包、发货流程。'
        : 'Pagamento, stock e consegna guidano picking, packing e spedizione.',
    icon: RocketOutlined,
  },
  {
    title: uiStore.language === 'zh' ? 'RMA 可追踪' : 'RMA tracciabile',
    text:
      uiStore.language === 'zh'
        ? '安装前测试、照片/视频证据、售后状态，让争议处理更有依据。'
        : 'Test prima installazione, prove foto/video e stato pratica sempre ordinati.',
    icon: FileProtectOutlined,
  },
])

const deliveryCards = computed(() => [
  {
    area: uiStore.language === 'zh' ? '米兰 / 都灵 / 博洛尼亚' : 'Milano / Torino / Bologna',
    time: '24/48h',
    note: uiStore.language === 'zh' ? '常规快递到达参考' : 'Standard su corriere espresso',
  },
  {
    area: uiStore.language === 'zh' ? '罗马 / 佛罗伦萨 / 那不勒斯' : 'Roma / Firenze / Napoli',
    time: '24/48h',
    note: uiStore.language === 'zh' ? '工作日发货后参考时效' : 'Dopo evasione in giorno lavorativo',
  },
  {
    area: uiStore.language === 'zh' ? '岛屿 / 偏远地区' : 'Isole / aree remote',
    time: '48/72h',
    note: uiStore.language === 'zh' ? '以承运商实际线路为准' : 'In base alla tratta del corriere',
  },
  {
    area: uiStore.language === 'zh' ? '电池类商品' : 'Batterie',
    time: 'QC + MSDS',
    note: uiStore.language === 'zh' ? '按安全资料和物流限制处理' : 'Gestione con documenti e limiti trasporto',
  },
])

const qualityCards = computed(() => [
  {
    title: 'Soft OLED',
    text:
      uiStore.language === 'zh'
        ? '适合重视显示效果、触控反馈和客户体验的高价值维修。'
        : 'Per riparazioni dove resa, touch e percezione finale contano di piu.',
  },
  {
    title: uiStore.language === 'zh' ? '兼容 HQ' : 'Compatibile HQ',
    text:
      uiStore.language === 'zh'
        ? '用于日常维修报价，强调稳定供应、清楚兼容和可控成本。'
        : 'Per preventivi quotidiani con costo controllato e compatibilita chiara.',
  },
  {
    title: uiStore.language === 'zh' ? '原装翻新' : 'Originale ricond.',
    text:
      uiStore.language === 'zh'
        ? '适合需要原装特性、功能匹配和更高信任感的客户。'
        : 'Quando servono caratteristiche originali e maggiore fiducia sul risultato.',
  },
  {
    title: uiStore.language === 'zh' ? '电池安全' : 'Sicurezza batterie',
    text:
      uiStore.language === 'zh'
        ? '电池类商品明确安全提醒、运输限制和安装前检查。'
        : 'Note sicurezza, limiti trasporto e controllo prima installazione in evidenza.',
  },
])

const flowSteps = computed(() => [
  uiStore.language === 'zh' ? '浏览公开目录' : 'Catalogo pubblico',
  uiStore.language === 'zh' ? '登录查看 B2B 价格' : 'Prezzi dopo login',
  uiStore.language === 'zh' ? '确认发票与配送' : 'Fattura e consegna',
  uiStore.language === 'zh' ? '复购与 RMA' : 'Riordino e RMA',
])

const brands = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Honor', 'Realme', 'OnePlus']

const featuredProducts = computed(() =>
  featuredSkuOrder
    .map((skuCode) => products.value.find((product) => product.skuCode === skuCode))
    .filter((product): product is Product => Boolean(product)),
)

const heroProducts = computed(() => featuredProducts.value.slice(0, 3))

const categories = computed(() =>
  categoryConfig.value
    .map((category) => ({
      ...category,
      count: products.value.filter((product) => product.category === category.category).length,
    }))
    .filter((category) => category.count > 0),
)

function getProductImageSrc(product: Product) {
  return resolveProductImageUrl(product)
}

function shouldShowImage(product: Product) {
  return Boolean(getProductImageSrc(product)) && !failedImages.value.has(product.skuCode)
}

function markImageFailed(skuCode: string) {
  failedImages.value = new Set([...failedImages.value, skuCode])
}

function getQualityLabel(qualityGrade: string) {
  return qualityLabels.value[qualityGrade] || qualityGrade
}

function goToProducts() {
  router.push('/products')
}

function goToRegister() {
  router.push('/b2b/register')
}

function searchBrand(brand: string) {
  return `/products?q=${encodeURIComponent(brand)}`
}

onMounted(async () => {
  products.value = await fetchProducts()
})
</script>

<template>
  <main class="home-page customer-home home-marketing-page">
    <section class="customer-hero home-intro-hero">
      <div class="customer-hero-copy home-intro-copy home-intro-actions-only">
        <div class="desktop-home-hero-message">
          <span class="desktop-home-kicker">{{ copy.heroTag }}</span>
          <h1>{{ copy.heroTitle }}</h1>
          <p>{{ copy.heroText }}</p>
          <div class="desktop-home-bullets">
            <span v-for="bullet in copy.heroBullets" :key="bullet">
              <CheckCircleOutlined />
              {{ bullet }}
            </span>
          </div>
        </div>

        <div class="home-hero-actions">
          <a-button type="primary" size="large" @click="goToProducts">
            {{ copy.primary }}
          </a-button>
          <a-button size="large" @click="goToRegister">
            {{ copy.secondary }}
          </a-button>
        </div>

        <div class="home-proof-row">
          <span v-for="stat in heroStats" :key="stat.value">
            <strong>{{ stat.value }}</strong>
            <small>{{ stat.label }}</small>
          </span>
        </div>
      </div>

      <div class="home-visual-panel">
        <div class="home-visual-header">
          <span>{{ copy.visualTitle }}</span>
          <strong>{{ copy.visualText }}</strong>
        </div>

        <div class="home-visual-main">
          <template v-if="heroProducts[0]">
            <img
              :src="shouldShowImage(heroProducts[0]) ? getProductImageSrc(heroProducts[0]) : heroFallbackImage"
              :alt="heroProducts[0].imageAlt || heroProducts[0].name"
              loading="eager"
              @error="markImageFailed(heroProducts[0].skuCode)"
            />
          </template>
          <div class="home-visual-badge">
            <CheckCircleOutlined />
            <span>{{ uiStore.language === 'zh' ? '批次 / 库位 / RMA 可追踪' : 'Lotto / stock / RMA tracciabili' }}</span>
          </div>
        </div>

        <div class="home-visual-stack">
          <article v-for="product in heroProducts.slice(1)" :key="product.skuCode">
            <img
              v-if="shouldShowImage(product)"
              :src="getProductImageSrc(product)"
              :alt="product.imageAlt || product.name"
              loading="lazy"
              @error="markImageFailed(product.skuCode)"
            />
            <div v-else class="home-mini-fallback">
              {{ product.category }}
            </div>
            <div>
              <strong>{{ getQualityLabel(product.qualityGrade) }}</strong>
              <span>{{ product.brand }} · {{ product.model }}</span>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="home-service-panel home-service-overview">
      <div class="home-panel-title home-wide-title">
        <div>
          <h2>{{ copy.serviceTitle }}</h2>
          <p>{{ copy.serviceText }}</p>
        </div>
        <RouterLink to="/products">{{ copy.primary }}</RouterLink>
      </div>
      <div class="home-service-grid home-service-card-grid">
        <a-card v-for="card in serviceCards" :key="card.title" class="home-service-card">
          <component :is="card.icon" class="value-icon" />
          <h3>{{ card.title }}</h3>
          <p>{{ card.text }}</p>
        </a-card>
      </div>
    </section>

    <section class="home-delivery-quality-grid">
      <div class="home-delivery-panel">
        <div class="home-panel-title home-wide-title">
          <div>
            <ClockCircleOutlined class="home-title-icon" />
            <h2>{{ copy.deliveryTitle }}</h2>
            <p>{{ copy.deliveryText }}</p>
          </div>
        </div>
        <div class="home-delivery-grid">
          <article v-for="delivery in deliveryCards" :key="delivery.area" class="home-delivery-card">
            <strong>{{ delivery.time }}</strong>
            <span>{{ delivery.area }}</span>
            <small>{{ delivery.note }}</small>
          </article>
        </div>
      </div>

      <div class="home-quality-panel">
        <div class="home-panel-title home-wide-title">
          <div>
            <SafetyCertificateOutlined class="home-title-icon" />
            <h2>{{ copy.qualityTitle }}</h2>
            <p>{{ copy.qualityText }}</p>
          </div>
        </div>
        <div class="home-quality-card-grid">
          <article v-for="quality in qualityCards" :key="quality.title" class="home-quality-card">
            <strong>{{ quality.title }}</strong>
            <span>{{ quality.text }}</span>
          </article>
        </div>
      </div>
    </section>

    <section class="home-image-strip">
      <div class="home-panel-title">
        <h2>{{ uiStore.language === 'zh' ? '核心配件品类' : 'Categorie principali' }}</h2>
        <RouterLink to="/products">{{ copy.primary }}</RouterLink>
      </div>
      <div class="home-image-strip-grid">
        <RouterLink
          v-for="product in featuredProducts"
          :key="product.skuCode"
          :to="getProductRoutePath(product)"
          class="home-image-tile"
        >
          <div>
            <img
              v-if="shouldShowImage(product)"
              :src="getProductImageSrc(product)"
              :alt="product.imageAlt || product.name"
              loading="lazy"
              @error="markImageFailed(product.skuCode)"
            />
            <div v-else class="home-image-fallback compact">
              <span>{{ product.brand }}</span>
              <strong>{{ product.category }}</strong>
            </div>
          </div>
          <span>{{ getQualityLabel(product.qualityGrade) }}</span>
          <strong>{{ product.brand }} {{ product.model }}</strong>
        </RouterLink>
      </div>
    </section>

    <section class="home-commerce-grid">
      <div class="home-category-panel">
        <div class="home-panel-title">
          <h2>{{ copy.catalogTitle }}</h2>
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
            <strong>
              {{ category.count }}
              {{ uiStore.language === 'zh' ? '款商品' : 'articoli' }}
            </strong>
          </RouterLink>
        </div>
      </div>

      <div class="home-brand-panel">
        <div class="home-panel-title">
          <h2>{{ copy.brandTitle }}</h2>
        </div>
        <div class="home-brand-grid compact">
          <RouterLink v-for="brand in brands" :key="brand" :to="searchBrand(brand)">
            {{ brand }}
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="home-flow-band home-b2b-cta">
      <div>
        <ToolOutlined />
        <h2>{{ copy.ctaTitle }}</h2>
        <p>{{ copy.ctaText }}</p>
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
