import type { AuthProfile } from '@/types/auth'

const demoProfileStorageKey = 'partspro.demoProfile'

export function readDemoAuthProfile() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  try {
    const rawProfile = window.localStorage.getItem(demoProfileStorageKey)
    return rawProfile ? (JSON.parse(rawProfile) as AuthProfile) : null
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
