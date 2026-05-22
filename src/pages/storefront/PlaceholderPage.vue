<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const title = computed(() => String(route.meta.title || 'PartsPro'))
const description = computed(() =>
  String(route.meta.description || 'Pagina pianificata per il MVP PartsPro.'),
)
const access = computed(() => String(route.meta.access || 'public'))
</script>

<template>
  <main class="placeholder-page">
    <a-card>
      <a-space direction="vertical" :size="16">
        <a-tag color="blue">{{ access }}</a-tag>
        <div>
          <h1>{{ title }}</h1>
          <p>{{ description }}</p>
        </div>
        <a-alert
          type="info"
          show-icon
          message="Struttura pronta"
          description="Questa pagina e parte dello scheletro P2. I contenuti funzionali saranno completati nei prossimi goal."
        />
      </a-space>
    </a-card>
  </main>
</template>
