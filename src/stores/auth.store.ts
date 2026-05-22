import { defineStore } from 'pinia'
import {
  getCurrentAuthProfile,
  signInWithEmail,
  signInWithGoogle,
  signOutFromSupabase,
} from '@/services/auth.service'
import type { AuthProfile, RouteAccess, UserRole } from '@/types/auth'
import { staffRoles } from '@/types/auth'

const demoProfileStorageKey = 'partspro.demoProfile'

function readDemoProfile() {
  try {
    const rawProfile = window.localStorage.getItem(demoProfileStorageKey)
    return rawProfile ? (JSON.parse(rawProfile) as AuthProfile) : null
  } catch {
    return null
  }
}

function writeDemoProfile(profile: AuthProfile | null) {
  if (!profile || profile.source !== 'demo') {
    window.localStorage.removeItem(demoProfileStorageKey)
    return
  }

  window.localStorage.setItem(demoProfileStorageKey, JSON.stringify(profile))
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    profile: null as AuthProfile | null,
    isAuthenticated: false,
    role: 'guest' as UserRole,
    isLoading: false,
    isInitialized: false,
    authError: '',
  }),
  getters: {
    isStaff: (state) => staffRoles.includes(state.role),
    canViewCustomerPrices: (state) =>
      state.isAuthenticated && (state.role === 'customer' || staffRoles.includes(state.role)),
    canAccess:
      (state) =>
      (access: RouteAccess = 'public') => {
        if (access === 'public') {
          return true
        }

        if (access === 'customer') {
          return state.isAuthenticated
        }

        if (access === 'staff') {
          return staffRoles.includes(state.role)
        }

        return state.role === 'admin'
      },
  },
  actions: {
    applyProfile(profile: AuthProfile | null) {
      this.profile = profile
      this.isAuthenticated = Boolean(profile)
      this.role = profile?.role || 'guest'
    },
    async initializeAuth() {
      if (this.isInitialized) {
        return
      }

      this.isLoading = true
      this.authError = ''

      try {
        const profile = (await getCurrentAuthProfile()) || readDemoProfile()
        this.applyProfile(profile)
      } catch (error) {
        this.authError = error instanceof Error ? error.message : 'Errore autenticazione.'
        this.applyProfile(null)
      } finally {
        this.isInitialized = true
        this.isLoading = false
      }
    },
    async loginWithEmail(email: string, password: string) {
      this.isLoading = true
      this.authError = ''

      try {
        const profile = await signInWithEmail(email, password)
        this.applyProfile(profile)
      } catch (error) {
        this.authError = error instanceof Error ? error.message : 'Login non riuscito.'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    async loginWithGoogle() {
      this.isLoading = true
      this.authError = ''

      try {
        await signInWithGoogle()
      } catch (error) {
        this.authError = error instanceof Error ? error.message : 'Login Google non riuscito.'
        throw error
      } finally {
        this.isLoading = false
      }
    },
    loginAsDemo(role: Exclude<UserRole, 'guest'>) {
      this.authError = ''
      const profile: AuthProfile = {
        id: `demo-${role}`,
        email: `${role}@demo.partspro.local`,
        role,
        source: 'demo',
      }
      writeDemoProfile(profile)
      this.applyProfile(profile)
      this.isInitialized = true
    },
    async logout() {
      this.isLoading = true
      this.authError = ''

      try {
        await signOutFromSupabase()
      } catch (error) {
        this.authError = error instanceof Error ? error.message : 'Logout non riuscito.'
      } finally {
        writeDemoProfile(null)
        this.applyProfile(null)
        this.isLoading = false
      }
    },
  },
})
