<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AppstoreOutlined,
  CloseOutlined,
  DownOutlined,
  MenuFoldOutlined,
  RightOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useCartStore } from '@/stores/cart.store'
import { t } from '@/i18n/messages'

const uiStore = useUiStore()
const authStore = useAuthStore()
const cartStore = useCartStore()
const route = useRoute()
const router = useRouter()
const isMobileMenuOpen = ref(false)
const openMobileSectionKey = ref('catalog')

const categoryLinks = computed(() => [
  { label: t(uiStore.language, 'navScreens'), to: '/products?category=screens' },
  { label: t(uiStore.language, 'navBatteries'), to: '/products?category=batteries' },
  { label: t(uiStore.language, 'navChargingPorts'), to: '/products?category=charging-ports' },
  { label: uiStore.language === 'zh' ? '后盖' : 'Cover posteriori', to: '/products?category=back-covers' },
  { label: uiStore.language === 'zh' ? '摄像头' : 'Fotocamere', to: '/products?category=cameras' },
  { label: t(uiStore.language, 'navTools'), to: '/products?category=tools' },
])

const brandLinks = [
  { label: 'Apple', to: '/products?q=Apple' },
  { label: 'Samsung', to: '/products?q=Samsung' },
  { label: 'Xiaomi', to: '/products?q=Xiaomi' },
  { label: 'Huawei', to: '/products?q=Huawei' },
  { label: 'Oppo', to: '/products?q=Oppo' },
  { label: 'Honor', to: '/products?q=Honor' },
]

const navigationSections = computed(() => [
  {
    key: 'catalog',
    label: uiStore.language === 'zh' ? '商品目录' : 'Catalogo',
    children: [
      { label: uiStore.language === 'zh' ? '全部商品' : 'Tutti i prodotti', to: '/products' },
      ...categoryLinks.value,
    ],
  },
  {
    key: 'brands',
    label: uiStore.language === 'zh' ? '品牌' : 'Brand',
    children: brandLinks,
  },
  {
    key: 'b2b',
    label: 'B2B',
    children: [
      { label: t(uiStore.language, 'footerWholesale'), to: '/b2b/register' },
      { label: t(uiStore.language, 'requestB2B'), to: '/b2b/register' },
      { label: t(uiStore.language, 'footerCustomerArea'), to: '/account' },
      { label: 'RMA', to: '/account/rma' },
    ],
  },
  {
    key: 'support',
    label: uiStore.language === 'zh' ? '规则与支持' : 'Regole e supporto',
    children: [
      { label: t(uiStore.language, 'footerQuality'), to: '/products' },
      { label: t(uiStore.language, 'footerTerms'), to: '/legal/terms' },
      { label: t(uiStore.language, 'footerPrivacy'), to: '/legal/privacy' },
      { label: t(uiStore.language, 'footerBatterySafety'), to: '/legal/battery-safety' },
    ],
  },
])

const footerColumns = computed(() => [
  {
    title: t(uiStore.language, 'footerCatalog'),
    links: [
      { label: t(uiStore.language, 'footerProducts'), to: '/products' },
      { label: 'Apple', to: '/products?q=Apple' },
      { label: 'Samsung', to: '/products?q=Samsung' },
      { label: t(uiStore.language, 'footerQuality'), to: '/products' },
    ],
  },
  {
    title: t(uiStore.language, 'footerB2B'),
    links: [
      { label: t(uiStore.language, 'footerWholesale'), to: '/b2b/register' },
      { label: t(uiStore.language, 'requestB2B'), to: '/b2b/register' },
      { label: t(uiStore.language, 'footerCustomerArea'), to: '/account' },
      { label: 'RMA', to: '/account/rma' },
    ],
  },
  {
    title: t(uiStore.language, 'footerLegal'),
    links: [
      { label: t(uiStore.language, 'footerTerms'), to: '/legal/terms' },
      { label: t(uiStore.language, 'footerPrivacy'), to: '/legal/privacy' },
      { label: t(uiStore.language, 'footerCookies'), to: '/legal/cookies' },
      { label: t(uiStore.language, 'footerBatterySafety'), to: '/legal/battery-safety' },
    ],
  },
])

const searchPlaceholder = computed(() => t(uiStore.language, 'storefrontSearch'))
const footerTagline = computed(() => t(uiStore.language, 'footerTagline'))
const footerTags = computed(() => [
  t(uiStore.language, 'footerTagShipping'),
  t(uiStore.language, 'footerTagPrices'),
  t(uiStore.language, 'footerTagRma'),
])
const shouldShowStorefrontFooter = computed(() => route.name === 'home')

const mobileQuickActions = computed(() => [
  { label: 'Home', to: '/', meta: uiStore.language === 'zh' ? '首页' : 'Start' },
  {
    label: t(uiStore.language, 'cart'),
    to: '/cart',
    meta: `${cartStore.itemCount} ${uiStore.language === 'zh' ? '件' : 'pz'}`,
  },
])

const mobileAccountTitle = computed(() => {
  if (!authStore.isAuthenticated) {
    return uiStore.language === 'zh' ? '未登录' : 'Accesso richiesto'
  }

  return authStore.profile?.email || t(uiStore.language, 'footerCustomerArea')
})

function handleLanguageChange(value: string | number) {
  uiStore.setLanguage(value === 'zh' ? 'zh' : 'it')
}

function handleSearch(value: string) {
  router.push({
    path: '/products',
    query: value ? { q: value } : undefined,
  })
}

function handleDrawerSearch(value: string) {
  handleSearch(value)
  isMobileMenuOpen.value = false
}

function toggleMobileSection(sectionKey: string) {
  openMobileSectionKey.value = openMobileSectionKey.value === sectionKey ? '' : sectionKey
}

async function handleLogout() {
  await authStore.logout()
  router.push('/products')
  isMobileMenuOpen.value = false
}
</script>

<template>
  <a-layout class="storefront-shell">
    <a-layout-header class="storefront-header">
      <div class="header-inner">
        <a-button
          class="mobile-menu"
          type="text"
          aria-label="Open menu"
          @click="isMobileMenuOpen = true"
        >
          <MenuFoldOutlined />
        </a-button>
        <RouterLink class="brand" to="/">PartsPro</RouterLink>
        <a-input-search
          class="header-search"
          size="large"
          :placeholder="searchPlaceholder"
          @search="handleSearch"
        >
          <template #enterButton>
            <a-button type="primary">
              <SearchOutlined />
            </a-button>
          </template>
        </a-input-search>
        <a-space class="header-actions">
          <a-segmented
            :value="uiStore.language"
            :options="[
              { label: 'IT', value: 'it' },
              { label: '中文', value: 'zh' },
            ]"
            @change="handleLanguageChange"
          />
          <a-tag v-if="authStore.isAuthenticated" color="blue" class="auth-role-tag">
            {{ authStore.role }}
          </a-tag>
          <a-button v-if="authStore.isAuthenticated" size="small" @click="handleLogout">
            Logout
          </a-button>
          <a-dropdown>
            <button class="icon-link" type="button" :aria-label="t(uiStore.language, 'account')">
              <UserOutlined />
            </button>
            <template #overlay>
              <a-menu>
                <a-menu-item v-if="!authStore.isAuthenticated" key="login">
                  <RouterLink to="/login">Login</RouterLink>
                </a-menu-item>
                <a-menu-item v-if="authStore.isAuthenticated" key="account">
                  <RouterLink to="/account">Area cliente</RouterLink>
                </a-menu-item>
                <a-menu-item v-if="authStore.isStaff" key="admin">
                  <RouterLink to="/admin">Admin</RouterLink>
                </a-menu-item>
                <a-menu-divider v-if="authStore.isAuthenticated" />
                <a-menu-item v-if="authStore.isAuthenticated" key="logout" @click="handleLogout">
                  Logout {{ authStore.role }}
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-badge :count="cartStore.itemCount" show-zero>
            <RouterLink to="/cart" :aria-label="t(uiStore.language, 'cart')">
              <ShoppingCartOutlined />
            </RouterLink>
          </a-badge>
        </a-space>
      </div>
    </a-layout-header>

    <nav class="category-nav" aria-label="Product navigation">
      <a-menu class="desktop-category-menu" mode="horizontal" :selectable="false">
        <a-menu-item key="home">
          <RouterLink to="/">Home</RouterLink>
        </a-menu-item>
        <a-sub-menu v-for="section in navigationSections" :key="section.key">
          <template #title>
            <span class="menu-section-title">
              <AppstoreOutlined />
              {{ section.label }}
            </span>
          </template>
          <a-menu-item
            v-for="link in section.children"
            :key="`${section.key}-${link.to}`"
          >
            <RouterLink :to="link.to">{{ link.label }}</RouterLink>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </nav>

    <a-layout-content class="storefront-content">
      <RouterView />
    </a-layout-content>

    <a-layout-footer v-if="shouldShowStorefrontFooter" class="storefront-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <RouterLink class="brand footer-logo" to="/">PartsPro</RouterLink>
          <p>{{ footerTagline }}</p>
          <a-space wrap>
            <a-tag v-for="tag in footerTags" :key="tag">{{ tag }}</a-tag>
          </a-space>
        </div>
        <div v-for="column in footerColumns" :key="column.title" class="footer-column">
          <h2>{{ column.title }}</h2>
          <RouterLink v-for="link in column.links" :key="link.to" :to="link.to">
            {{ link.label }}
          </RouterLink>
        </div>
      </div>
      <div class="legal-line">
        <span>{{ t(uiStore.language, 'legalCompanyLine') }}</span>
        <span>{{ t(uiStore.language, 'legalComplianceLine') }}</span>
      </div>
    </a-layout-footer>

    <a-drawer
      v-model:open="isMobileMenuOpen"
      class="mobile-app-drawer"
      placement="left"
      width="320"
      :closable="false"
    >
      <div class="mobile-drawer-shell">
        <header class="mobile-drawer-header">
          <RouterLink class="brand" to="/" @click="isMobileMenuOpen = false">PartsPro</RouterLink>
          <a-button type="text" aria-label="Close menu" @click="isMobileMenuOpen = false">
            <CloseOutlined />
          </a-button>
        </header>

        <a-input-search
          class="mobile-drawer-search"
          :placeholder="searchPlaceholder"
          @search="handleDrawerSearch"
        >
          <template #enterButton>
            <a-button type="primary">
              <SearchOutlined />
            </a-button>
          </template>
        </a-input-search>

        <div class="mobile-drawer-quick-grid">
          <RouterLink
            v-for="action in mobileQuickActions"
            :key="action.to"
            :to="action.to"
            @click="isMobileMenuOpen = false"
          >
            <span>{{ action.label }}</span>
            <strong>{{ action.meta }}</strong>
          </RouterLink>
        </div>

        <section class="mobile-drawer-section">
          <div class="mobile-drawer-section-title">
            {{ uiStore.language === 'zh' ? '菜单' : 'Menu' }}
          </div>
          <div
            v-for="section in navigationSections"
            :key="section.key"
            class="mobile-nav-group"
          >
            <button
              class="mobile-nav-parent"
              type="button"
              :aria-expanded="openMobileSectionKey === section.key"
              @click="toggleMobileSection(section.key)"
            >
              <span>
                <AppstoreOutlined />
                {{ section.label }}
              </span>
              <DownOutlined v-if="openMobileSectionKey === section.key" />
              <RightOutlined v-else />
            </button>

            <div v-if="openMobileSectionKey === section.key" class="mobile-nav-children">
              <RouterLink
                v-for="link in section.children"
                :key="`${section.key}-${link.to}`"
                :to="link.to"
                @click="isMobileMenuOpen = false"
              >
                {{ link.label }}
              </RouterLink>
            </div>
          </div>
        </section>

        <div class="mobile-account-dock">
          <div class="mobile-account-copy">
            <strong>{{ uiStore.language === 'zh' ? '用户中心' : 'Area utente' }}</strong>
            <span>{{ mobileAccountTitle }}</span>
          </div>
          <div class="mobile-account-actions">
            <RouterLink
              :to="authStore.isAuthenticated ? '/account' : '/login'"
              @click="isMobileMenuOpen = false"
            >
              {{ authStore.isAuthenticated ? t(uiStore.language, 'footerCustomerArea') : 'Login' }}
            </RouterLink>
            <RouterLink
              v-if="authStore.isStaff"
              to="/admin"
              @click="isMobileMenuOpen = false"
            >
              Admin
            </RouterLink>
            <button v-if="authStore.isAuthenticated" type="button" @click="handleLogout">
              Logout
            </button>
          </div>
        </div>
      </div>
    </a-drawer>
  </a-layout>
</template>
