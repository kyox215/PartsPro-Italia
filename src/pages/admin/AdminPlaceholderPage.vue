<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => String(route.meta.title || '后台'))
const description = computed(() =>
  String(route.meta.description || 'PartsPro 后台功能模块已规划。'),
)
</script>

<template>
  <main>
    <a-page-header :title="title" :sub-title="description" />
    <a-card>
      <a-empty description="模块已准备，等待下一阶段实现">
        <template #image>
          <span />
        </template>
      </a-empty>
    </a-card>
  </main>
</template>
