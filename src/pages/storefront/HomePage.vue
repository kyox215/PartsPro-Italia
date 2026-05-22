<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileProtectOutlined,
  MinusOutlined,
  PlusOutlined,
  RocketOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ShopOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { t } from '@/i18n/messages'
import { fetchProducts, getProducts } from '@/services/products.service'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { useUiStore } from '@/stores/ui.store'
import type { Product, StockStatus } from '@/types/product'

const router = useRouter()
const uiStore = useUiStore()
const authStore = useAuthStore()
const cartStore = useCartStore()
const products = ref<Product[]>(getProducts())

const currency = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

const featuredSkuOrder = [
  'IP11-SCR-SOFT-BLK',
  'IP12-BAT-HQ-2815',
  'SA52-CHG-EU-BLK',
  'RN10-BKC-BLU',
  'TOOL-WATERPROOF-SET',
]

const categoryConfig = computed(() => [
  { title: t(uiStore.language, 'homeCategoryScreens'), category: 'Screens', to: '/products?category=screens' },
  { title: t(uiStore.language, 'homeCategoryBatteries'), category: 'Batteries', to: '/products?category=batteries' },
  { title: t(uiStore.language, 'homeCategoryCharging'), category: 'Charging Ports', to: '/products?category=charging-ports' },
  { title: t(uiStore.language, 'homeCategoryBackCover'), category: 'Back Covers', to: '/products?category=back-covers' },
  { title: t(uiStore.language, 'homeCategoryCameras'), category: 'Cameras', to: '/products?category=cameras' },
  { title: t(uiStore.language, 'homeCategoryTools'), category: 'Tools', to: '/products?category=tools' },
])

const stockMeta = computed<Record<StockStatus, { label: string; color: string }>>(() => ({
  in_stock: { label: uiStore.language === 'zh' ? '现货' : 'Disponibile', color: 'success' },
  low_stock: { label: uiStore.language === 'zh' ? '低库存' : 'Scorte limitate', color: 'warning' },
  out_of_stock: { label: uiStore.language === 'zh' ? '缺货' : 'Esaurito', color: 'error' },
  incoming: { label: uiStore.language === 'zh' ? '在途' : 'In arrivo', color: 'purple' },
}))

const qualityColors: Record<string, string> = {
  'Soft OLED': 'purple',
  'High Quality Compatible': 'cyan',
  'Compatible High Quality': 'cyan',
  'Refurbished Original': 'blue',
  Consumable: 'default',
}

const qualityLabels = computed<Record<string, string>>(() => {
  if (uiStore.language === 'zh') {
    return {
      'Soft OLED': 'Soft OLED',
      'High Quality Compatible': '高品质兼容',
      'Compatible High Quality': '高品质兼容',
      'Refurbished Original': '原装翻新',
      Consumable: '耗材',
    }
  }

  return {
    'Soft OLED': 'Soft OLED',
    'High Quality Compatible': 'Compatibile HQ',
    'Compatible High Quality': 'Compatibile HQ',
    'Refurbished Original': 'Originale ricond.',
    Consumable: 'Consumabile',
  }
})

const canBuy = computed(() => authStore.canViewCustomerPrices)

const copy = computed(() => {
  if (uiStore.language === 'zh') {
    return {
      kicker: '意大利手机维修配件 B2B 供应',
      title: authStore.isAuthenticated ? '继续你的 B2B 采购' : '为维修店、实验室和经销商准备的配件采购平台',
      description:
        authStore.isAuthenticated
          ? '查看常购 SKU、已加购数量、库存状态和结账入口。适合快速补货和重复采购。'
          : '屏幕、电池、尾插、摄像头和维修耗材集中采购。访客可浏览目录，登录后查看 B2B 批发价、阶梯价、实时库存、发票资料和售后入口。',
      primary: authStore.isAuthenticated ? '继续采购' : '查看商品目录',
      search: '搜索 iPhone 11 屏幕、A2221、SM-G991B、电池...',
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
    title: authStore.isAuthenticated ? 'Continua il tuo acquisto B2B' : 'Ricambi pronti per laboratori, negozi e rivenditori',
    description:
      authStore.isAuthenticated
        ? 'Riprendi dal carrello, acquista SKU ricorrenti e controlla stock, MOQ, prezzo B2B e checkout in pochi passaggi.'
        : 'Schermi, batterie, connettori, fotocamere e consumabili in un catalogo pensato per chi ripara ogni giorno. Sfoglia liberamente, accedi per prezzi B2B, fasce quantita, stock reale, fattura e RMA.',
    primary: authStore.isAuthenticated ? 'Continua acquisti' : 'Vedi catalogo',
    search: 'Cerca iPhone 11 schermo, A2221, SM-G991B, batteria...',
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

const brands = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Oppo', 'Honor', 'Realme', 'OnePlus']

const featuredProducts = computed(() =>
  featuredSkuOrder
    .map((skuCode) => products.value.find((product) => product.skuCode === skuCode))
    .filter((product): product is Product => Boolean(product)),
)

const categories = computed(() =>
  categoryConfig.value
    .map((category) => ({
      ...category,
      count: products.value.filter((product) => product.category === category.category).length,
    }))
    .filter((category) => category.count > 0),
)

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

function getCartQuantity(skuCode: string) {
  return cartStore.items.find((item) => item.skuCode === skuCode)?.quantity || 0
}

function handleHomeAdd(product: Product) {
  if (!canBuy.value) {
    router.push({ name: 'login', query: { returnUrl: '/' } })
    return
  }

  cartStore.addItem(product.skuCode, product.moq)
  message.success(`${product.skuCode} ${uiStore.language === 'zh' ? '已加入购物车' : 'aggiunto al carrello'}`)
}

function increaseHomeQuantity(product: Product) {
  cartStore.addItem(product.skuCode, 1)
}

function decreaseHomeQuantity(product: Product) {
  const quantity = getCartQuantity(product.skuCode)

  if (quantity <= 1) {
    cartStore.removeItem(product.skuCode)
    return
  }

  cartStore.updateQuantity(product.skuCode, quantity - 1)
}

function searchBrand(brand: string) {
  return `/products?q=${encodeURIComponent(brand)}`
}

function getQualityLabel(qualityGrade: string) {
  return qualityLabels.value[qualityGrade] || qualityGrade
}

onMounted(async () => {
  products.value = await fetchProducts()
})
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

    <section class="home-featured-panel">
      <div class="home-panel-title">
        <h2>{{ uiStore.language === 'zh' ? '高频采购 SKU' : 'SKU ad alta rotazione' }}</h2>
        <RouterLink to="/products">{{ copy.primary }}</RouterLink>
      </div>
      <div class="home-product-grid">
        <article
          v-for="product in featuredProducts"
          :key="product.skuCode"
          class="home-product-card"
        >
          <div class="home-product-tags">
            <a-tag :color="qualityColors[product.qualityGrade] || 'blue'">
              {{ getQualityLabel(product.qualityGrade) }}
            </a-tag>
            <a-tag :color="stockMeta[product.stockStatus].color">
              {{ stockMeta[product.stockStatus].label }}
            </a-tag>
          </div>
          <RouterLink :to="`/products/${product.skuCode}`" class="home-product-title">
            {{ product.name }}
          </RouterLink>
          <div class="home-product-purchase">
            <div class="home-product-price">
              <template v-if="canBuy">
                <strong>{{ currency.format(product.b2bPrice) }}</strong>
                <span>{{ product.vatMode }}</span>
              </template>
              <template v-else>
                <strong>{{ uiStore.language === 'zh' ? '登录看价' : 'Login prezzo' }}</strong>
                <span>B2B</span>
              </template>
            </div>
            <div v-if="canBuy && getCartQuantity(product.skuCode)" class="home-qty-control">
              <a-button size="small" @click="decreaseHomeQuantity(product)">
                <MinusOutlined />
              </a-button>
              <strong>{{ getCartQuantity(product.skuCode) }}</strong>
              <a-button size="small" @click="increaseHomeQuantity(product)">
                <PlusOutlined />
              </a-button>
            </div>
            <a-button
              v-else
              size="small"
              type="primary"
              :disabled="product.stockStatus === 'out_of_stock'"
              @click="handleHomeAdd(product)"
            >
              <ShoppingCartOutlined />
              {{ canBuy ? (uiStore.language === 'zh' ? '添加' : 'Aggiungi') : (uiStore.language === 'zh' ? '登录' : 'Accedi') }}
            </a-button>
          </div>
        </article>
      </div>
    </section>

    <section class="home-service-panel">
      <div class="home-panel-title">
        <h2>{{ copy.serviceTitle }}</h2>
        <RouterLink to="/products">{{ uiStore.language === 'zh' ? '查看商品' : 'Vedi prodotti' }}</RouterLink>
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
            <strong>{{ category.count }} SKU</strong>
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
