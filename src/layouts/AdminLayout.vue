<script setup lang="ts">
import { computed, h, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AuditOutlined,
  AppstoreOutlined,
  BarcodeOutlined,
  CloseOutlined,
  DashboardOutlined,
  DownOutlined,
  FileDoneOutlined,
  HomeOutlined,
  InboxOutlined,
  MenuFoldOutlined,
  PercentageOutlined,
  RightOutlined,
  SettingOutlined,
  ShoppingOutlined,
  TeamOutlined,
} from '@ant-design/icons-vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore, type Language } from '@/stores/ui.store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()
const isAdminMenuOpen = ref(false)
const openAdminSectionKey = ref('operations')
const globalSearchQuery = ref('')

const adminText = {
  zh: {
    brand: 'PartsPro 后台',
    dashboard: '仪表盘',
    orders: '订单',
    products: '商品 / PIM',
    inventory: '库存',
    stockMovements: '库存流水',
    batches: '批次',
    customers: '客户',
    approvals: 'B2B 审核',
    prices: '价格组',
    users: '员工设置',
    search: '搜索订单、SKU、客户...',
    demo: '演示权限',
    role: '角色',
    home: '回到主页',
    homeShort: '主页',
    language: '语言',
  },
  it: {
    brand: 'PartsPro 后台',
    dashboard: '仪表盘',
    orders: '订单',
    products: '商品 / PIM',
    inventory: '库存',
    stockMovements: '库存流水',
    batches: '批次',
    customers: '客户',
    approvals: 'B2B 审核',
    prices: '价格组',
    users: '员工设置',
    search: '搜索订单、SKU、客户...',
    demo: '演示权限',
    role: '角色',
    home: '回到主页',
    homeShort: '主页',
    language: '语言',
  },
} satisfies Record<Language, Record<string, string>>

const text = computed(() => adminText[uiStore.adminLanguage])

const menuItems = computed(() => [
  {
    key: '/admin',
    icon: () => h(DashboardOutlined),
    label: text.value.dashboard,
  },
  {
    key: '/admin/orders',
    icon: () => h(ShoppingOutlined),
    label: text.value.orders,
  },
  {
    key: '/admin/products',
    icon: () => h(AppstoreOutlined),
    label: text.value.products,
  },
  {
    key: '/admin/inventory',
    icon: () => h(InboxOutlined),
    label: text.value.inventory,
  },
  {
    key: '/admin/stock-movements',
    icon: () => h(FileDoneOutlined),
    label: text.value.stockMovements,
  },
  {
    key: '/admin/batches',
    icon: () => h(BarcodeOutlined),
    label: text.value.batches,
  },
  {
    key: '/admin/customers',
    icon: () => h(TeamOutlined),
    label: text.value.customers,
  },
  {
    key: '/admin/b2b-approvals',
    icon: () => h(AuditOutlined),
    label: text.value.approvals,
  },
  {
    key: '/admin/prices',
    icon: () => h(PercentageOutlined),
    label: text.value.prices,
  },
  {
    key: '/admin/settings/users',
    icon: () => h(SettingOutlined),
    label: text.value.users,
  },
])

const adminNavigationSections = computed(() => [
  {
    key: 'operations',
    label: '运营',
    items: menuItems.value.slice(0, 2),
  },
  {
    key: 'catalog',
    label: '商品与库存',
    items: menuItems.value.slice(2, 6),
  },
  {
    key: 'b2b',
    label: '客户与价格',
    items: menuItems.value.slice(6, 9),
  },
  {
    key: 'settings',
    label: '设置',
    items: menuItems.value.slice(9),
  },
])

const selectedKeys = computed(() => {
  const current = menuItems.value
    .map((item) => item.key)
    .filter((key) => route.path === key || route.path.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0]

  return [current || '/admin']
})

function readRouteQuery(value: unknown) {
  return Array.isArray(value) ? value[0] || '' : typeof value === 'string' ? value : ''
}

function getAdminSearchPath(query: string) {
  const normalizedQuery = query.toLowerCase()

  if (/^so[-\s]/i.test(query)) {
    return '/admin/orders'
  }

  if (
    normalizedQuery.includes('@') ||
    normalizedQuery.includes('p.iva') ||
    normalizedQuery.includes('pec') ||
    normalizedQuery.includes('cliente') ||
    normalizedQuery.includes('customer') ||
    normalizedQuery.includes('repair') ||
    normalizedQuery.includes('ripara') ||
    normalizedQuery.includes('centro') ||
    normalizedQuery.includes('fixlab') ||
    normalizedQuery.includes('phone doctor') ||
    normalizedQuery.includes('repair hub') ||
    normalizedQuery.includes('smart parts') ||
    normalizedQuery.includes('milano') ||
    normalizedQuery.includes('roma') ||
    normalizedQuery.includes('firenze') ||
    normalizedQuery.includes('napoli') ||
    /^it\d{5,}/i.test(query)
  ) {
    return '/admin/customers'
  }

  if (
    normalizedQuery.includes('stock') ||
    normalizedQuery.includes('库存') ||
    normalizedQuery.includes('batch') ||
    normalizedQuery.includes('批次') ||
    normalizedQuery.includes('库位')
  ) {
    return '/admin/inventory'
  }

  if (
    query.includes('-') ||
    /(sku|screen|display|battery|iphone|samsung|xiaomi|apple|ip\d|sa\d|bat|scr|chg|cam|tool|屏|电池|尾插|摄像头)/i.test(
      query,
    )
  ) {
    return '/admin/products'
  }

  return '/admin/orders'
}

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
  isAdminMenuOpen.value = false
}

function handleAdminGlobalSearch(value: string) {
  const query = value.trim()

  if (!query) {
    return
  }

  router.push({
    path: getAdminSearchPath(query),
    query: { q: query },
  })
}

function handleAdminLanguageChange(value: string | number) {
  uiStore.setAdminLanguage(value === 'it' ? 'it' : 'zh')
}

function toggleAdminSection(sectionKey: string) {
  openAdminSectionKey.value = openAdminSectionKey.value === sectionKey ? '' : sectionKey
}

watch(
  () => route.query.q,
  (value) => {
    globalSearchQuery.value = readRouteQuery(value)
  },
  { immediate: true },
)
</script>

<template>
  <a-layout class="admin-shell admin-shell-light">
    <a-layout-sider class="admin-sider desktop-admin-sider" width="208">
      <RouterLink class="admin-brand" to="/admin">{{ text.brand }}</RouterLink>
      <a-menu
        mode="inline"
        :items="menuItems"
        :selected-keys="selectedKeys"
        @click="handleMenuClick"
      />
    </a-layout-sider>
    <a-layout>
      <a-layout-header class="admin-header">
        <div class="admin-mobile-topline">
          <a-button
            class="admin-mobile-menu-button"
            type="text"
            aria-label="打开后台菜单"
            @click="isAdminMenuOpen = true"
          >
            <MenuFoldOutlined />
          </a-button>
          <RouterLink class="admin-mobile-brand" to="/admin">{{ text.brand }}</RouterLink>
        </div>
        <a-input-search
          v-model:value="globalSearchQuery"
          class="admin-search"
          :placeholder="text.search"
          allow-clear
          @search="handleAdminGlobalSearch"
        />
        <a-space class="admin-header-actions">
          <RouterLink to="/">
            <a-button class="admin-home-button" :aria-label="text.home">
              <HomeOutlined />
              <span>{{ text.homeShort }}</span>
            </a-button>
          </RouterLink>
          <a-segmented
            :value="uiStore.adminLanguage"
            :options="[
              { label: '中文', value: 'zh' },
              { label: 'IT', value: 'it' },
            ]"
            @change="handleAdminLanguageChange"
          />
          <a-tag class="admin-demo-tag" color="blue">{{ text.demo }}</a-tag>
          <span class="admin-role-text">
            <small>{{ text.role }}</small>
            <strong>{{ authStore.role }}</strong>
          </span>
        </a-space>
      </a-layout-header>
      <a-layout-content class="admin-content">
        <RouterView />
      </a-layout-content>
    </a-layout>

    <a-drawer
      v-model:open="isAdminMenuOpen"
      class="mobile-app-drawer admin-mobile-drawer"
      placement="left"
      width="320"
      :closable="false"
    >
      <div class="mobile-drawer-shell admin-drawer-shell">
        <header class="mobile-drawer-header">
          <RouterLink class="brand" to="/admin" @click="isAdminMenuOpen = false">
            {{ text.brand }}
          </RouterLink>
          <a-button type="text" aria-label="关闭后台菜单" @click="isAdminMenuOpen = false">
            <CloseOutlined />
          </a-button>
        </header>

        <div class="mobile-drawer-quick-grid admin-drawer-quick-grid">
          <RouterLink class="admin-drawer-home-card" to="/" @click="isAdminMenuOpen = false">
            <span class="admin-drawer-home-icon">
              <HomeOutlined />
            </span>
            <span class="admin-drawer-home-copy">
              <strong>{{ text.home }}</strong>
              <small>Storefront</small>
            </span>
            <RightOutlined class="admin-drawer-home-arrow" />
          </RouterLink>
        </div>

        <section class="mobile-drawer-section">
          <div class="mobile-drawer-section-title">
            菜单
          </div>
          <div
            v-for="section in adminNavigationSections"
            :key="section.key"
            class="mobile-nav-group admin-mobile-nav-group"
          >
            <button
              class="mobile-nav-parent admin-mobile-nav-parent"
              type="button"
              :aria-expanded="openAdminSectionKey === section.key"
              @click="toggleAdminSection(section.key)"
            >
              <span>
                <AppstoreOutlined />
                {{ section.label }}
              </span>
              <DownOutlined v-if="openAdminSectionKey === section.key" />
              <RightOutlined v-else />
            </button>

            <div v-if="openAdminSectionKey === section.key" class="mobile-nav-children admin-mobile-nav-children">
              <button
                v-for="item in section.items"
                :key="item.key"
                class="admin-mobile-nav-child"
                :class="{ 'admin-mobile-nav-child-active': selectedKeys.includes(item.key) }"
                type="button"
                @click="handleMenuClick({ key: item.key })"
              >
                <component :is="item.icon()" />
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>
        </section>

        <div class="mobile-account-dock">
          <div class="mobile-account-copy">
            <strong>{{ text.demo }}</strong>
            <span>{{ text.role }}: {{ authStore.role }}</span>
          </div>
          <div class="admin-account-language-row">
            <span>{{ text.language }}</span>
            <a-segmented
              :value="uiStore.adminLanguage"
              :options="[
                { label: '中文', value: 'zh' },
                { label: 'IT', value: 'it' },
              ]"
              @change="handleAdminLanguageChange"
            />
          </div>
        </div>
      </div>
    </a-drawer>
  </a-layout>
</template>
