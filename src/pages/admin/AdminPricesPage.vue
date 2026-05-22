<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  fetchAdminProducts,
  fetchPriceGroups,
  getAdminProducts,
  getPriceGroups,
} from '@/services/admin.service'
import type { AdminProduct, PriceGroup } from '@/types/admin'

const priceGroups = ref<PriceGroup[]>(getPriceGroups())
const products = ref<AdminProduct[]>(getAdminProducts())
const isLoading = ref(false)

const columns = [
  { title: 'Gruppo', dataIndex: 'name', key: 'group', width: 240 },
  { title: 'Clienti', dataIndex: 'customerCount', key: 'customerCount', width: 110 },
  { title: 'Margine', dataIndex: 'defaultMarginPercent', key: 'margin', width: 120 },
  { title: 'Volume minimo', dataIndex: 'minMonthlyPurchase', key: 'volume', width: 180 },
  { title: 'Termini pagamento', dataIndex: 'paymentTerms', key: 'terms', width: 260 },
  { title: 'Categorie visibili', dataIndex: 'visibleCategories', key: 'categories' },
  { title: 'Regole qty', dataIndex: 'tierRules', key: 'tierRules', width: 180 },
]

const productPriceColumns = [
  { title: 'SKU', dataIndex: 'skuCode', key: 'sku', width: 180 },
  { title: 'Prodotto', dataIndex: 'name', key: 'name' },
  { title: 'Costo', dataIndex: 'costPrice', key: 'cost', width: 110 },
  { title: 'B2B', dataIndex: 'b2bPrice', key: 'b2b', width: 110 },
  { title: 'Retail', dataIndex: 'retailPrice', key: 'retail', width: 110 },
  { title: 'Fasce quantita', dataIndex: 'tierPrices', key: 'tiers', width: 220 },
]

const stats = computed(() => ({
  groups: priceGroups.value.length,
  customers: priceGroups.value.reduce((total, group) => total + group.customerCount, 0),
  pricedSku: products.value.filter((product) => product.b2bPrice > 0).length,
}))

function formatCurrency(value: number) {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

async function loadPrices() {
  isLoading.value = true
  try {
    const [groupRows, productRows] = await Promise.all([fetchPriceGroups(), fetchAdminProducts()])
    priceGroups.value = groupRows
    products.value = productRows
  } finally {
    isLoading.value = false
  }
}

onMounted(loadPrices)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="价格组"
      sub-title="客户价格组、阶梯价、毛利规则和付款条款"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="24" :md="8">
        <a-card><a-statistic title="Gruppi prezzo" :value="stats.groups" /></a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card><a-statistic title="Clienti assegnati" :value="stats.customers" /></a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card><a-statistic title="SKU con B2B price" :value="stats.pricedSku" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card" title="价格组规则">
      <a-table
        :columns="columns"
        :data-source="priceGroups"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1260 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'group'">
            <strong>{{ record.name }}</strong>
            <span class="admin-muted-line">{{ record.description }}</span>
            <span class="admin-muted-line">Aggiornato {{ record.updatedAt.slice(0, 10) }}</span>
          </template>

          <template v-else-if="column.key === 'margin'">
            <a-tag color="blue">{{ record.defaultMarginPercent }}%</a-tag>
          </template>

          <template v-else-if="column.key === 'categories'">
            <a-space wrap>
              <a-tag v-for="category in record.visibleCategories" :key="category">
                {{ category }}
              </a-tag>
            </a-space>
          </template>

          <template v-else-if="column.key === 'tierRules'">
            <span v-for="tier in record.tierRules" :key="tier.minQty" class="admin-muted-line">
              {{ tier.minQty }}+ = {{ formatCurrency(tier.unitPrice) }}
            </span>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-card class="admin-table-card" title="SKU 价格和阶梯价">
      <a-alert
        class="summary-alert"
        type="info"
        show-icon
        message="价格计算占位"
        description="当前 UI 已定义结构；真实价格引擎应由 Supabase RPC 按客户、SKU 和数量计算。"
      />
      <a-table
        :columns="productPriceColumns"
        :data-source="products"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1120 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'cost'">
            {{ formatCurrency(record.costPrice) }}
          </template>
          <template v-else-if="column.key === 'b2b'">
            <strong>{{ formatCurrency(record.b2bPrice) }}</strong>
          </template>
          <template v-else-if="column.key === 'retail'">
            {{ formatCurrency(record.retailPrice) }}
          </template>
          <template v-else-if="column.key === 'tiers'">
            <a-space wrap>
              <a-tag v-for="tier in record.tierPrices" :key="tier.minQty">
                {{ tier.minQty }}+ {{ formatCurrency(tier.unitPrice) }}
              </a-tag>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </main>
</template>
