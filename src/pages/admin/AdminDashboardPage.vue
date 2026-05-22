<script setup lang="ts">
import { computed } from 'vue'
import { getAdminDashboardStats, getAdminOrders, getInventoryItems } from '@/services/admin.service'

const stats = getAdminDashboardStats()
const orders = getAdminOrders()
const inventory = getInventoryItems()

const priorityOrders = computed(() =>
  orders.filter((order) => order.status === 'submitted' || order.stockRisk !== 'clear').slice(0, 4),
)

const stockAlerts = computed(() =>
  inventory.filter((item) => item.availableQty <= 10 || item.qcQty > 0 || item.defectiveQty > 0),
)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="运营仪表盘"
      sub-title="订单、库存、发货、客户与 B2B 业务概览"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="待处理订单" :value="stats.openOrders" />
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="需关注 SKU" :value="stats.lowStock" />
        </a-card>
      </a-col>
      <a-col :xs="24" :md="8">
        <a-card>
          <a-statistic title="待核对付款" :value="stats.pendingPayments" />
        </a-card>
      </a-col>
    </a-row>

    <div class="admin-dashboard-grid">
      <a-card title="优先处理订单">
        <a-list :data-source="priorityOrders" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.orderNo" :description="item.customerName" />
              <a-space>
                <a-tag color="blue">{{ item.status }}</a-tag>
                <a-tag :color="item.stockRisk === 'clear' ? 'green' : 'orange'">
                  {{ item.stockRisk }}
                </a-tag>
              </a-space>
            </a-list-item>
          </template>
        </a-list>
      </a-card>

      <a-card title="库存预警">
        <a-list :data-source="stockAlerts" item-layout="horizontal">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta :title="item.skuCode" :description="item.productName" />
              <a-space>
                <a-tag :color="item.availableQty <= 10 ? 'orange' : 'green'">
                  Avail {{ item.availableQty }}
                </a-tag>
                <a-tag v-if="item.qcQty > 0" color="gold">QC {{ item.qcQty }}</a-tag>
                <a-tag v-if="item.defectiveQty > 0" color="red">DEF {{ item.defectiveQty }}</a-tag>
              </a-space>
            </a-list-item>
          </template>
        </a-list>
      </a-card>
    </div>
  </main>
</template>
