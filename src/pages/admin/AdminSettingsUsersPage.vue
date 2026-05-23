<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import {
  fetchStaffProfiles,
  getStaffProfiles,
  saveStaffProfilePermissions,
} from '@/services/admin.service'
import { useAuthStore } from '@/stores/auth.store'
import type { AdminStaffProfile, AdminStaffRole } from '@/types/admin'
import type { StaffPermission } from '@/types/auth'
import {
  defaultPermissionsForRole,
  staffPermissionDescriptions,
  staffPermissionLabels,
} from '@/types/auth'
import { labelStaffRole } from '@/utils/adminLabels'

type RoleFilter = 'all' | 'staff' | 'manager' | AdminStaffRole

const authStore = useAuthStore()
const assignableRoles: AdminStaffRole[] = ['customer', 'sales', 'warehouse', 'purchasing', 'admin']
const profiles = ref<AdminStaffProfile[]>(getStaffProfiles())
const draftRoles = ref<Record<string, AdminStaffRole>>({})
const draftPermissions = ref<Record<string, StaffPermission[]>>({})
const isLoading = ref(false)
const savingProfileId = ref('')
const selectedRole = ref<RoleFilter>('all')

const canManageStaffSettings = computed(() => authStore.canManageStaffPermissions)
const permissionOptions = computed(() =>
  (Object.keys(staffPermissionLabels) as StaffPermission[])
    .filter((permission) => authStore.role === 'admin' || !permission.startsWith('staff_settings.'))
    .map((permission) => ({
      label: staffPermissionLabels[permission],
      value: permission,
    })),
)

const columns = [
  { title: '账号', dataIndex: 'email', key: 'account', width: 300 },
  { title: '当前角色', dataIndex: 'role', key: 'role', width: 130 },
  { title: '员工身份', key: 'staffEnabled', width: 130 },
  { title: '调整角色', key: 'draftRole', width: 180 },
  { title: '功能权限', key: 'permissions', width: 520 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 160 },
  { title: '操作', key: 'actions', fixed: 'right' as const, width: 120 },
]

const roleScopes: Record<AdminStaffRole, string> = {
  customer: '前台客户账号；只有客户管理开通员工身份和权限后，才进入后台。',
  sales: '订单、客户、价格组相关后台功能，默认不含员工设置。',
  warehouse: '订单处理、库存、批次、库位和发货相关后台功能。',
  purchasing: '商品、库存、批次、供应商和采购相关后台功能。',
  admin: '超级管理员，默认拥有全部权限，包含员工设置和权限管理。',
}

const filterOptions = computed(() => [
  { label: `全部 (${profiles.value.length})`, value: 'all' },
  { label: `后台员工 (${profiles.value.filter((profile) => profile.staffEnabled).length})`, value: 'staff' },
  {
    label: `权限管理员 (${profiles.value.filter(isPermissionManagerProfile).length})`,
    value: 'manager',
  },
  ...assignableRoles.map((role) => ({
    label: `${labelStaffRole(role)} (${profiles.value.filter((profile) => profile.role === role).length})`,
    value: role,
  })),
])

const filteredProfiles = computed(() => {
  if (selectedRole.value === 'all') return profiles.value
  if (selectedRole.value === 'staff') return profiles.value.filter((profile) => profile.staffEnabled)
  if (selectedRole.value === 'manager') return profiles.value.filter(isPermissionManagerProfile)
  return profiles.value.filter((profile) => profile.role === selectedRole.value)
})

const stats = computed(() => ({
  total: profiles.value.length,
  staff: profiles.value.filter((profile) => profile.staffEnabled).length,
  managers: profiles.value.filter(isPermissionManagerProfile).length,
  admins: profiles.value.filter((profile) => profile.role === 'admin').length,
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

function staffEnabledColor(profile: AdminStaffProfile) {
  if (profile.role === 'admin') return 'red'
  return profile.staffEnabled ? 'green' : 'default'
}

function formatDate(value: string | null) {
  if (!value) return '未开通'

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function normalizeRole(value: string | number): AdminStaffRole {
  const role = String(value)
  return assignableRoles.includes(role as AdminStaffRole) ? (role as AdminStaffRole) : 'customer'
}

function syncDraftState(nextProfiles: AdminStaffProfile[]) {
  draftRoles.value = nextProfiles.reduce<Record<string, AdminStaffRole>>((drafts, profile) => {
    drafts[profile.id] = profile.role
    return drafts
  }, {})
  draftPermissions.value = nextProfiles.reduce<Record<string, StaffPermission[]>>((drafts, profile) => {
    drafts[profile.id] = [...profile.permissions]
    return drafts
  }, {})
}

function roleDraftFor(profile: AdminStaffProfile) {
  return draftRoles.value[profile.id] || profile.role
}

function permissionDraftFor(profile: AdminStaffProfile) {
  return draftPermissions.value[profile.id] || profile.permissions
}

function setDraftRole(profile: AdminStaffProfile, value: string | number) {
  const nextRole = normalizeRole(value)
  draftRoles.value = {
    ...draftRoles.value,
    [profile.id]: nextRole,
  }
  draftPermissions.value = {
    ...draftPermissions.value,
    [profile.id]: defaultPermissionsForRole(nextRole),
  }
}

function setDraftPermissions(profile: AdminStaffProfile, permissions: StaffPermission[]) {
  draftPermissions.value = {
    ...draftPermissions.value,
    [profile.id]: permissions,
  }
}

function permissionListChanged(left: StaffPermission[], right: StaffPermission[]) {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return left.length !== right.length || left.some((permission) => !rightSet.has(permission)) || right.some((permission) => !leftSet.has(permission))
}

function isPermissionManager(role: AdminStaffRole, permissions: StaffPermission[]) {
  return role === 'admin' || permissions.includes('staff_settings.manage')
}

function isPermissionManagerProfile(profile: AdminStaffProfile) {
  return isPermissionManager(profile.role, profile.permissions)
}

function hasProfileChanged(profile: AdminStaffProfile) {
  return (
    roleDraftFor(profile) !== profile.role ||
    permissionListChanged(permissionDraftFor(profile), profile.permissions)
  )
}

function wouldRemoveLastPermissionManager(profile: AdminStaffProfile) {
  const remainingManagers = profiles.value.filter((item) => {
    if (item.id === profile.id) {
      return isPermissionManager(roleDraftFor(profile), permissionDraftFor(profile))
    }

    return isPermissionManagerProfile(item)
  })

  return remainingManagers.length === 0
}

function canSaveProfile(profile: AdminStaffProfile) {
  return (
    canManageStaffSettings.value &&
    hasProfileChanged(profile) &&
    !wouldRemoveLastPermissionManager(profile)
  )
}

function permissionTooltip(permission: StaffPermission) {
  return staffPermissionDescriptions[permission]
}

async function loadProfiles() {
  isLoading.value = true
  try {
    const rows = await fetchStaffProfiles()
    profiles.value = rows
    syncDraftState(rows)
  } finally {
    isLoading.value = false
  }
}

async function persistProfile(profile: AdminStaffProfile) {
  if (!canSaveProfile(profile)) {
    return
  }

  savingProfileId.value = profile.id
  try {
    const savedProfile = await saveStaffProfilePermissions(
      profile.id,
      roleDraftFor(profile),
      permissionDraftFor(profile),
    )
    if (savedProfile) {
      profiles.value = profiles.value.map((item) => (item.id === savedProfile.id ? savedProfile : item))
      draftRoles.value = {
        ...draftRoles.value,
        [savedProfile.id]: savedProfile.role,
      }
      draftPermissions.value = {
        ...draftPermissions.value,
        [savedProfile.id]: [...savedProfile.permissions],
      }
    }
    message.success('员工角色与权限已更新。')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '员工权限保存失败。')
  } finally {
    savingProfileId.value = ''
  }
}

function confirmSaveProfile(profile: AdminStaffProfile) {
  const nextRole = roleDraftFor(profile)

  if (wouldRemoveLastPermissionManager(profile)) {
    message.warning('至少需要保留一个管理员或员工权限管理员。')
    return
  }

  Modal.confirm({
    title: `确认更新 ${profile.email} 的角色与权限？`,
    content: roleScopes[nextRole],
    okText: '保存',
    cancelText: '取消',
    async onOk() {
      await persistProfile(profile)
    },
  })
}

onMounted(loadProfiles)
</script>

<template>
  <main class="admin-page">
    <a-page-header
      title="员工设置"
      sub-title="账号后台身份、岗位角色、功能权限和授权审计"
    />

    <a-row :gutter="[16, 16]" class="admin-metric-row">
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="账号总数" :value="stats.total" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="后台员工" :value="stats.staff" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="权限管理员" :value="stats.managers" /></a-card>
      </a-col>
      <a-col :xs="12" :md="6">
        <a-card><a-statistic title="超级管理员" :value="stats.admins" /></a-card>
      </a-col>
    </a-row>

    <a-card class="admin-table-card">
      <div class="admin-toolbar">
        <a-segmented v-model:value="selectedRole" :options="filterOptions" />
        <a-alert
          v-if="canManageStaffSettings"
          type="info"
          show-icon
          message="权限管理已启用"
          description="客户管理页开通员工身份；本页调整角色和功能权限，并保留至少一个权限管理员。"
        />
        <a-alert
          v-else
          type="warning"
          show-icon
          message="只读模式"
          description="当前账号只有员工设置查看权限，不能保存角色或权限变更。"
        />
      </div>

      <a-table
        class="admin-desktop-data-table"
        :columns="columns"
        :data-source="filteredProfiles"
        :loading="isLoading"
        row-key="id"
        :scroll="{ x: 1540 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'account'">
            <strong>{{ record.email }}</strong>
            <span class="admin-muted-line">{{ record.customerCompanyName || '未关联客户公司' }}</span>
            <span class="admin-muted-line">{{ record.id }}</span>
          </template>

          <template v-else-if="column.key === 'role'">
            <a-tag :color="roleColor(record.role)">{{ labelStaffRole(record.role) }}</a-tag>
          </template>

          <template v-else-if="column.key === 'staffEnabled'">
            <a-tag :color="staffEnabledColor(record)">
              {{ record.staffEnabled || record.role === 'admin' ? '已开通' : '未开通' }}
            </a-tag>
            <span class="admin-muted-line">授权 {{ formatDate(record.staffEnabledAt) }}</span>
          </template>

          <template v-else-if="column.key === 'draftRole'">
            <a-select
              :value="roleDraftFor(record)"
              size="small"
              style="width: 150px"
              :disabled="!canManageStaffSettings"
              @change="setDraftRole(record, $event)"
            >
              <a-select-option
                v-for="role in assignableRoles"
                :key="role"
                :value="role"
                :disabled="role === 'admin' && authStore.role !== 'admin'"
              >
                {{ labelStaffRole(role) }}
              </a-select-option>
            </a-select>
            <span class="admin-muted-line">{{ roleScopes[roleDraftFor(record)] }}</span>
          </template>

          <template v-else-if="column.key === 'permissions'">
            <a-checkbox-group
              :value="permissionDraftFor(record)"
              class="admin-permission-checks"
              :options="permissionOptions"
              :disabled="!canManageStaffSettings"
              @change="setDraftPermissions(record, $event as StaffPermission[])"
            />
          </template>

          <template v-else-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-button
              size="small"
              type="primary"
              :disabled="!canSaveProfile(record)"
              :loading="savingProfileId === record.id"
              @click="confirmSaveProfile(record)"
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
              <span>{{ profile.customerCompanyName || profile.id }}</span>
            </div>
            <a-tag :color="roleColor(profile.role)">{{ labelStaffRole(profile.role) }}</a-tag>
          </header>

          <a-select
            :value="roleDraftFor(profile)"
            size="small"
            :disabled="!canManageStaffSettings"
            @change="setDraftRole(profile, $event)"
          >
            <a-select-option
              v-for="role in assignableRoles"
              :key="role"
              :value="role"
              :disabled="role === 'admin' && authStore.role !== 'admin'"
            >
              {{ labelStaffRole(role) }}
            </a-select-option>
          </a-select>

          <a-checkbox-group
            :value="permissionDraftFor(profile)"
            class="admin-permission-checks"
            :options="permissionOptions"
            :disabled="!canManageStaffSettings"
            @change="setDraftPermissions(profile, $event as StaffPermission[])"
          />

          <p class="admin-muted-line">{{ roleScopes[roleDraftFor(profile)] }}</p>
          <a-space class="admin-permission-tags" wrap>
            <a-tooltip
              v-for="permission in permissionDraftFor(profile)"
              :key="permission"
              :title="permissionTooltip(permission)"
            >
              <a-tag>{{ staffPermissionLabels[permission] }}</a-tag>
            </a-tooltip>
          </a-space>

          <div class="admin-mobile-data-actions">
            <a-button
              size="small"
              type="primary"
              block
              :disabled="!canSaveProfile(profile)"
              :loading="savingProfileId === profile.id"
              @click="confirmSaveProfile(profile)"
            >
              保存
            </a-button>
          </div>
        </article>
      </div>
    </a-card>
  </main>
</template>
