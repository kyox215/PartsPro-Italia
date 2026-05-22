<script setup lang="ts">
import { computed } from 'vue'
import { ConfigProvider } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import itIT from 'ant-design-vue/es/locale/it_IT'
import zhCN from 'ant-design-vue/es/locale/zh_CN'
import { useUiStore } from './stores/ui.store'
import { partsProTheme } from './theme/partsproTheme'

const uiStore = useUiStore()
const route = useRoute()

const activeLanguage = computed(() =>
  route.path.startsWith('/admin') ? uiStore.adminLanguage : uiStore.language,
)
const locale = computed(() => (activeLanguage.value === 'zh' ? zhCN : itIT))
</script>

<template>
  <ConfigProvider :locale="locale" :theme="partsProTheme">
    <RouterView />
  </ConfigProvider>
</template>
