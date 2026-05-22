<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CloseOutlined,
  MenuFoldOutlined,
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
const router = useRouter()
const isMobileMenuOpen = ref(false)

const categories = computed(() => [
  { label: 'Apple', to: '/brands/apple' },
  { label: 'Samsung', to: '/brands/samsung' },
  { label: 'Xiaomi', to: '/brands/xiaomi' },
  { label: t(uiStore.language, 'navScreens'), to: '/products?category=screens' },
  { label: t(uiStore.language, 'navBatteries'), to: '/products?category=batteries' },
  { label: t(uiStore.language, 'navChargingPorts'), to: '/products?category=charging-ports' },
  { label: t(uiStore.language, 'navTools'), to: '/products?category=tools' },
])

const footerColumns = computed(() => [
  {
    title: t(uiStore.language, 'footerCatalog'),
    links: [
      { label: t(uiStore.language, 'footerProducts'), to: '/products' },
      { label: 'Apple', to: '/brands/apple' },
      { label: 'Samsung', to: '/brands/samsung' },
      { label: t(uiStore.language, 'footerQuality'), to: '/quality-guide' },
    ],
  },
  {
    title: t(uiStore.language, 'footerB2B'),
    links: [
      { label: t(uiStore.language, 'footerWholesale'), to: '/wholesale' },
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
const shippingText = computed(() => t(uiStore.language, 'shippingStrip'))
const requestB2BText = computed(() => t(uiStore.language, 'requestB2B'))
const footerTagline = computed(() => t(uiStore.language, 'footerTagline'))
const footerTags = computed(() => [
  t(uiStore.language, 'footerTagShipping'),
  t(uiStore.language, 'footerTagPrices'),
  t(uiStore.language, 'footerTagRma'),
])

function handleLanguageChange(value: string | number) {
  uiStore.setLanguage(value === 'zh' ? 'zh' : 'it')
}

function handleSearch(value: string) {
  router.push({
    path: '/products',
    query: value ? { q: value } : undefined,
  })
}

async function handleLogout() {
  await authStore.logout()
  router.push('/products')
}
</script>

<template>
  <a-layout class="storefront-shell">
    <div class="shipping-strip">
      <span>{{ shippingText }}</span>
      <RouterLink to="/b2b/register">{{ requestB2BText }}</RouterLink>
    </div>

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

    <nav class="category-nav" aria-label="Product categories">
      <RouterLink v-for="category in categories" :key="category.label" :to="category.to">
        {{ category.label }}
      </RouterLink>
    </nav>

    <a-layout-content class="storefront-content">
      <RouterView />
    </a-layout-content>

    <a-layout-footer class="storefront-footer">
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
      placement="left"
      width="300"
      title="PartsPro"
    >
      <template #closeIcon>
        <CloseOutlined />
      </template>
      <a-space direction="vertical" class="mobile-drawer-links" :size="12">
        <RouterLink to="/products" @click="isMobileMenuOpen = false">Prodotti</RouterLink>
        <RouterLink
          v-for="category in categories"
          :key="category.label"
          :to="category.to"
          @click="isMobileMenuOpen = false"
        >
          {{ category.label }}
        </RouterLink>
        <a-divider />
        <RouterLink v-if="!authStore.isAuthenticated" to="/login" @click="isMobileMenuOpen = false">
          Login
        </RouterLink>
        <button v-else class="drawer-button" type="button" @click="handleLogout">
          Logout {{ authStore.role }}
        </button>
        <RouterLink to="/wholesale" @click="isMobileMenuOpen = false">
          {{ t(uiStore.language, 'footerWholesale') }} / B2B
        </RouterLink>
        <RouterLink to="/b2b/register" @click="isMobileMenuOpen = false">
          {{ requestB2BText }}
        </RouterLink>
        <RouterLink to="/account" @click="isMobileMenuOpen = false">
          {{ t(uiStore.language, 'footerCustomerArea') }}
        </RouterLink>
      </a-space>
    </a-drawer>
  </a-layout>
</template>
