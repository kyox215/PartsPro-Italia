<script setup lang="ts">
import { computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  AuditOutlined,
  AppstoreOutlined,
  BarcodeOutlined,
  DashboardOutlined,
  FileDoneOutlined,
  HomeOutlined,
  InboxOutlined,
  PercentageOutlined,
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
    language: '语言',
  },
  it: {
    brand: 'PartsPro Admin',
    dashboard: 'Dashboard',
    orders: 'Ordini',
    products: 'Prodotti / PIM',
    inventory: 'Inventario',
    stockMovements: 'Movimenti stock',
    batches: 'Lotti',
    customers: 'Clienti',
    approvals: 'Approvazioni B2B',
    prices: 'Prezzi',
    users: 'Utenti staff',
    search: 'Cerca ordine, SKU, cliente...',
    demo: 'Demo access',
    role: 'Ruolo',
    home: 'Vai al sito',
    language: 'Lingua',
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

const selectedKeys = computed(() => {
  const current = menuItems.value
    .map((item) => item.key)
    .filter((key) => route.path === key || route.path.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0]

  return [current || '/admin']
})

function handleMenuClick({ key }: { key: string }) {
  router.push(key)
}

function handleAdminLanguageChange(value: string | number) {
  uiStore.setAdminLanguage(value === 'it' ? 'it' : 'zh')
}
</script>

<template>
  <a-layout class="admin-shell admin-shell-light">
    <a-layout-sider breakpoint="lg" collapsible :collapsed-width="0" class="admin-sider">
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
        <a-input-search class="admin-search" :placeholder="text.search" />
        <a-space class="admin-header-actions" wrap>
          <RouterLink to="/">
            <a-button :aria-label="text.home">
              <HomeOutlined />
              {{ text.home }}
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
          <a-tag color="blue">{{ text.demo }}</a-tag>
          <span>{{ text.role }}: {{ authStore.role }}</span>
        </a-space>
      </a-layout-header>
      <a-layout-content class="admin-content">
        <RouterView />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
