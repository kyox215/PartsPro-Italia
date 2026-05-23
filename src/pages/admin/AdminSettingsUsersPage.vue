<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import {
  fetchStaffProfiles,
  getStaffProfiles,
  saveStaffProfileRole,
} from '@/services/admin.service'
import type { AdminStaffProfile, AdminStaffRole } from '@/types/admin'
import { labelStaffRole } from '@/utils/adminLabels'

type RoleFilter = 'all' | 'staff' | AdminStaffRole

const assignableRoles: AdminStaffRole[] = ['customer', 'sales', 'warehouse', 'purchasing', 'admin']
const profiles = ref<AdminStaffProfile[]>(getStaffProfiles())
const draftRoles = ref<Record<string, AdminStaffRole>>({})
const isLoading = ref(false)
const savingProfileId = ref('')
const selectedRole = ref<RoleFilter>('all')

const columns = [
  { title: '账号', dataIndex: 'email', key: 'account', width: 300 },
  { title: '当前角色', dataIndex: 'role', key: 'role', width: 140 },
  { title: '调整角色', key: 'draftRole', width: 220 },
  { title: '权限范围', key: 'scope', width: 360 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 120 },
]

const roleScopes: Record<AdminStaffRole, string> = {
  customer: '仅前台客户账号，不可进入后台管理。',
  sales: '订单、客户、价格组与销售相关后台功能。',
  warehouse: '库存、批次、库存流水与发货相关后台功能。',
  purchasing: '商品、采购批次、供应商与成本相关后台功能。',
  admin: '完整后台权限，包含员工设置和角色变更。',
}

const filterOptions = computed(() => [
  { label: `全部 (${profiles.value.length})`, value: 'all' },
  { label: `员工 (${profiles.value.filter((profile) => profile.role !== 'customer').length})`, value: 'staff' },
  ...assignableRoles.map((role) => ({
    label: `${labelStaffRole(role)} (${profiles.value.filter((profile) => profile.role === role).length})`,
    value: role,
  })),
])

const filteredProfiles = computed(() => {
  if (selectedRole.value === 'all') {
    return profiles.value
  }

  if (selectedRole.value === 'staff') {
    return profiles.value.filter((profile) => profile.role !== 'customer')
  }

  return profiles.value.filter((profile) => profile.role === selectedRole.value)
})

const stats = computed(() => ({
  total: profiles.value.length,
  staff: profiles.value.filter((profile) => profile.role !== 'customer').length,
  admins: profiles.value.filter((profile) => profile.role === 'admin').length,
  customers: profiles.value.filter((profile) => profile.role === 'customer').length,
}))

function roleColor(role: AdminStaffRole) {
  const colors: Record<AdminStaffRole, string> = {
    customer: 'default',
    sales: 'blue',
    warehouse: 'green',
    purchasing: 'purple',
    admin: 'red',
  }

  return colors[role]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizeRole(value: string | number): AdminStaffRole {
  const role = String(value)
  return assignableRoles.includes(role as AdminStaffRole) ? (role as AdminStaffRole) : 'customer'
}

function syncDraftRoles(nextProfiles: AdminStaffProfile[]) {
  draftRoles.value = nextProfiles.reduce<Record<string, AdminStaffRole>>((drafts, profile) => {
    drafts[profile.id] = profile.role
    return drafts
  }, {})
}

function roleDraftFor(profile: AdminStaffProfile) {
  return draftRoles.value[profile.id] || profile.role
}

function setDraftRole(profile: AdminStaffProfile, value: string | number) {
  draftRoles.value = {
    ...draftRoles.value,
    [profile.id]: normalizeRole(value),
  }
}

function hasRoleChanged(profile: AdminStaffProfile) {
  return roleDraftFor(profile) !== profile.role
}

function wouldRemoveLastAdmin(profile: AdminStaffProfile) {
  return profile.role === 'admin' && roleDraftFor(profile) !== 'admin' && stats.value.admins <= 1
}

async function loadProfiles() {
  isLoading.value = true
  try {
    const rows = await fetchStaffProfiles()
    profiles.value = rows
    syncDraftRoles(rows)
  } finally {
    isLoading.value = false
  }
}

async function persistRole(profile: AdminStaffProfile) {
  const nextRole = roleDraftFor(profile)

  if (!hasRoleChanged(profile)) {
    return
  }

  if (wouldRemoveLastAdmin(profile)) {
    message.warning('至少需要保留一个管理员账号。')
    return
  }

  savingProfileId.value = profile.id
  try {
    const savedProfile = await saveStaffProfileRole(profile.id, nextRole)
    if (savedProfile) {
      profiles.value = profiles.value.map((item) => (item.id === savedProfile.id ? savedProfile : item))
      draftRoles.value = {
        ...draftRoles.value,
        [savedProfile.id]: savedProfile.role,
      }
    }
    message.success('员工角色已更新。')
  } finally {
    savingProfileId.value = ''
  }
}

function confirmSaveRole(profile: AdminStaffProfile) {
  const nextRole = roleDraftFor(profile)

  Modal.confirm({
    title: `确认将 ${profile.email} 调整为 ${labelStaffRole(nextRole)}？`,
    content: roleScopes[nextRole],
    okText: '保存',
    cancelText: '取消',
    async onOk() {
      await persistRole(profile)
    },
  })
}

onMounted(loadProfiles)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="员工设置"
      sub-title="员工账号、后台角色、客户账号权限和角色写入控制"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="账号总数" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="后台员工" :value="stats.staff" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="管理员" :value="stats.admins" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="客户账号" :value="stats.customers" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-segmented v-model:value="selectedRole" :options="filterOptions" />
        <a-alert
          type="info"
          show-icon
          message="角色写入规则"
          description="员工设置页只允许管理员访问，数据库策略也限制为 admin 才能插入、修改或删除 profiles。"
        />
      </div>

      <a-table
        class="admin-desktop-data-table"
        :columns="columns"
        :data-source="filteredProfiles"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1280 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'account'">
            <strong>{{ record.email }}</strong>
            <span class="admin-muted-line">{{ record.id }}</span>
          </template>

          <template v-else-if="column.key === 'role'">
            <a-tag :color="roleColor(record.role)">{{ labelStaffRole(record.role) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'draftRole'">
            <a-select
              :value="roleDraftFor(record)"
              size="small"
              style="width: 180px"
              @change="setDraftRole(record, $event)"
            >
              <a-select-option v-for="role in assignableRoles" :key="role" :value="role">
                {{ labelStaffRole(role) }}
              </a-select-option>
            </a-select>
          </template>

          <template v-else-if="column.key === 'scope'">
            <span>{{ roleScopes[roleDraftFor(record)] }}</span>
          </template>

          <template v-else-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-button
              size="small"
              type="primary"
              :disabled="!hasRoleChanged(record) || wouldRemoveLastAdmin(record)"
              :loading="savingProfileId === record.id"
              @click="confirmSaveRole(record)"
            >
              保存
            </a-button>
          </template>
        </template>
      </a-table>

      <div class="admin-mobile-data-list">
        <a-empty v-if="filteredProfiles.length === 0" class="admin-mobile-empty" description="暂无账号" />
        <article
          v-for="profile in filteredProfiles"
          :key="profile.id"
          class="admin-mobile-data-card"
        >
          <header>
            <div>
              <strong>{{ profile.email }}</strong>
              <span>{{ profile.id }}</span>
            </div>
            <a-tag :color="roleColor(profile.role)">{{ labelStaffRole(profile.role) }}</a-tag>
          </header>

          <a-select
            :value="roleDraftFor(profile)"
            size="small"
            @change="setDraftRole(profile, $event)"
          >
            <a-select-option v-for="role in assignableRoles" :key="role" :value="role">
              {{ labelStaffRole(role) }}
            </a-select-option>
          </a-select>

          <p class="admin-muted-line">{{ roleScopes[roleDraftFor(profile)] }}</p>

          <div class="admin-mobile-data-actions">
            <a-button
              size="small"
              type="primary"
              block
              :disabled="!hasRoleChanged(profile) || wouldRemoveLastAdmin(profile)"
              :loading="savingProfileId === profile.id"
              @click="confirmSaveRole(profile)"
            >
              保存
            </a-button>
          </div>
        </article>
      </div>
    </a-card>
  </main>
</template>
