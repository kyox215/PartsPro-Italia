import type { AuthProfile } from '@/types/auth'
import { defaultPermissionsForRole, normalizeStaffPermissions, staffRoles } from '@/types/auth'

const demoProfileStorageKey = 'partspro.demoProfile'

export function readDemoAuthProfile() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    const rawProfile = window.localStorage.getItem(demoProfileStorageKey)
    if (!rawProfile) {
      return null
    }

    const profile = JSON.parse(rawProfile) as AuthProfile
    if (profile.role === 'guest') {
      return null
    }

    return {
      ...profile,
      permissions:
        profile.permissions && profile.permissions.length > 0
          ? normalizeStaffPermissions(profile.permissions, profile.role)
          : defaultPermissionsForRole(profile.role),
      staffEnabled: profile.staffEnabled ?? staffRoles.includes(profile.role),
    }
  } catch {
    return null
  }
}

export function writeDemoAuthProfile(profile: AuthProfile | null) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  if (!profile || profile.source !== 'demo') {
    window.localStorage.removeItem(demoProfileStorageKey)
    return
  }

  window.localStorage.setItem(demoProfileStorageKey, JSON.stringify(profile))
}

export function hasDemoAuthProfile() {
  return Boolean(readDemoAuthProfile())
}
