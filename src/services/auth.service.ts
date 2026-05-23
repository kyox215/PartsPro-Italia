import type { User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '@/lib/supabase'
import type { AuthProfile, UserRole } from '@/types/auth'
import { resolveStaffPermissions, staffRoles } from '@/types/auth'

type ProfileRow = {
  role: UserRole
  permissions: unknown
  staff_enabled: boolean | null
}

type ProfileState = Pick<AuthProfile, 'role' | 'permissions' | 'staffEnabled'>

function normalizeRole(role: unknown): Exclude<UserRole, 'guest'> {
  if (
    role === 'customer' ||
    role === 'sales' ||
    role === 'warehouse' ||
    role === 'purchasing' ||
    role === 'admin'
  ) {
    return role
  }

  return 'customer'
}

async function fetchProfileState(user: User): Promise<ProfileState> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role,permissions,staff_enabled')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.warn('[PartsPro] Supabase profile role fallback to app_metadata', error)
  }

  const row = data as ProfileRow | null
  const role = normalizeRole(row?.role || user.app_metadata?.role)

  return {
    role,
    permissions: resolveStaffPermissions(role, row?.permissions),
    staffEnabled: Boolean(row?.staff_enabled) || staffRoles.includes(role),
  }
}

async function profileFromUser(user: User): Promise<AuthProfile> {
  const profileState = await fetchProfileState(user)

  return {
    id: user.id,
    email: user.email || 'unknown@partspro.local',
    ...profileState,
    source: 'supabase',
  }
}

export async function getCurrentAuthProfile() {
  if (!hasSupabaseConfig) {
    return null
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return data.session?.user ? profileFromUser(data.session.user) : null
}

export async function signInWithEmail(email: string, password: string) {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase non configurato. Usa un accesso demo per provare il flusso.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  if (!data.user) {
    throw new Error('Login non riuscito.')
  }

  return profileFromUser(data.user)
}

export async function signInWithGoogle(redirectTo?: string) {
  if (!hasSupabaseConfig) {
    throw new Error('Supabase non configurato. Usa un accesso demo per provare il flusso.')
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo || window.location.origin,
    },
  })

  if (error) {
    throw error
  }
}

export async function signOutFromSupabase() {
  if (!hasSupabaseConfig) {
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    throw error
  }
}
