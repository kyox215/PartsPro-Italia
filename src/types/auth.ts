export type UserRole = 'guest' | 'customer' | 'sales' | 'warehouse' | 'purchasing' | 'admin'

export type RouteAccess = 'public' | 'customer' | 'staff' | 'staff-settings' | 'admin'

export const staffRoles: UserRole[] = ['sales', 'warehouse', 'purchasing', 'admin']

export type StaffPermission =
  | 'orders.view'
  | 'orders.manage'
  | 'products.view'
  | 'products.manage'
  | 'inventory.view'
  | 'inventory.manage'
  | 'customers.view'
  | 'customers.manage'
  | 'prices.view'
  | 'prices.manage'
  | 'staff_settings.view'
  | 'staff_settings.manage'

export const allStaffPermissions: StaffPermission[] = [
  'orders.view',
  'orders.manage',
  'products.view',
  'products.manage',
  'inventory.view',
  'inventory.manage',
  'customers.view',
  'customers.manage',
  'prices.view',
  'prices.manage',
  'staff_settings.view',
  'staff_settings.manage',
]

export const staffPermissionLabels: Record<StaffPermission, string> = {
  'orders.view': '订单查看',
  'orders.manage': '订单处理',
  'products.view': '商品查看',
  'products.manage': '商品管理',
  'inventory.view': '库存查看',
  'inventory.manage': '库存 / 批次管理',
  'customers.view': '客户查看',
  'customers.manage': '客户管理',
  'prices.view': '价格组查看',
  'prices.manage': '价格组管理',
  'staff_settings.view': '员工设置查看',
  'staff_settings.manage': '员工权限管理',
}

export const staffPermissionDescriptions: Record<StaffPermission, string> = {
  'orders.view': '查看订单、明细、付款和配送状态。',
  'orders.manage': '处理订单状态、拣货、发货和售后前置动作。',
  'products.view': '查看商品、SKU、兼容机型、供应商和价格信息。',
  'products.manage': '维护商品、SKU、图片、状态和导入数据。',
  'inventory.view': '查看库存、批次、库位和库存流水。',
  'inventory.manage': '维护库存、批次、质检、入库和调整。',
  'customers.view': '查看客户主数据、B2B 审核、时间线和价格组分配。',
  'customers.manage': '维护客户资料、审批客户、归档和恢复客户。',
  'prices.view': '查看价格组、阶梯价和付款条款。',
  'prices.manage': '维护价格组、规则和客户价格范围。',
  'staff_settings.view': '查看员工设置页和账号权限配置。',
  'staff_settings.manage': '开通后台员工、修改角色和分配功能权限。',
}

export const roleDefaultPermissions: Record<Exclude<UserRole, 'guest'>, StaffPermission[]> = {
  customer: [],
  sales: [
    'orders.view',
    'orders.manage',
    'customers.view',
    'customers.manage',
    'prices.view',
    'prices.manage',
  ],
  warehouse: ['orders.view', 'orders.manage', 'inventory.view', 'inventory.manage'],
  purchasing: ['products.view', 'products.manage', 'inventory.view', 'inventory.manage'],
  admin: allStaffPermissions,
}

export type AuthProfile = {
  id: string
  email: string
  role: UserRole
  permissions: StaffPermission[]
  staffEnabled: boolean
  source: 'supabase' | 'demo'
}

export function isStaffPermission(value: unknown): value is StaffPermission {
  return typeof value === 'string' && allStaffPermissions.includes(value as StaffPermission)
}

export function normalizeStaffPermissions(value: unknown, role?: UserRole): StaffPermission[] {
  if (role === 'admin') {
    return [...allStaffPermissions]
  }

  const permissions = new Set<StaffPermission>()
  const values = Array.isArray(value) ? value : []

  for (const permission of values) {
    if (isStaffPermission(permission)) {
      permissions.add(permission)
    }
  }

  if (permissions.has('staff_settings.manage')) {
    permissions.add('staff_settings.view')
  }

  return allStaffPermissions.filter((permission) => permissions.has(permission))
}

export function defaultPermissionsForRole(role: Exclude<UserRole, 'guest'>): StaffPermission[] {
  return [...roleDefaultPermissions[role]]
}

export function resolveStaffPermissions(role: Exclude<UserRole, 'guest'>, value: unknown): StaffPermission[] {
  const explicitPermissions = normalizeStaffPermissions(value, role)

  if (role === 'admin') {
    return explicitPermissions
  }

  return explicitPermissions.length > 0 ? explicitPermissions : defaultPermissionsForRole(role)
}

export function profileHasPermission(profile: Pick<AuthProfile, 'role' | 'permissions'> | null, permission: StaffPermission) {
  return profile?.role === 'admin' || Boolean(profile?.permissions.includes(permission))
}

export function profileCanViewStaffSettings(profile: Pick<AuthProfile, 'role' | 'permissions'> | null) {
  return (
    profileHasPermission(profile, 'staff_settings.view') ||
    profileHasPermission(profile, 'staff_settings.manage')
  )
}
