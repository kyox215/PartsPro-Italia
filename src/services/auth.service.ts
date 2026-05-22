import type { User } from '@supabase/supabase-js'
import { hasSupabaseConfig, supabase } from '@/lib/supabase'
import type { AuthProfile, UserRole } from '@/types/auth'

function normalizeRole(role: unknown): UserRole {
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

function profileFromUser(user: User): AuthProfile {
  return {
    id: user.id,
    email: user.email || 'unknown@partspro.local',
    role: normalizeRole(user.app_metadata?.role),
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
