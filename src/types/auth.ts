export type UserRole = 'guest' | 'customer' | 'sales' | 'warehouse' | 'purchasing' | 'admin'

export type RouteAccess = 'public' | 'customer' | 'staff' | 'admin'

export const staffRoles: UserRole[] = ['sales', 'warehouse', 'purchasing', 'admin']

export type AuthProfile = {
  id: string
  email: string
  role: UserRole
  source: 'supabase' | 'demo'
}
