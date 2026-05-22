<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => String(route.meta.title || 'Admin'))
const description = computed(() =>
  String(route.meta.description || 'Modulo operativo pianificato per PartsPro.'),
)
</script>

<template>
  <main>
    <a-page-header :title="title" :sub-title="description" />
    <a-card>
      <a-empty description="Modulo pronto per la prossima fase">
        <template #image>
          <span />
        </template>
      </a-empty>
    </a-card>
  </main>
</template>
