import { defineStore } from 'pinia'
import {
  createEmptyCustomerProfile,
  fetchCurrentCustomerProfile,
  saveCurrentCustomerProfile,
  validateCustomerProfile,
} from '@/services/customer.service'
import type { CustomerProfile } from '@/types/customer'

export const useCustomerStore = defineStore('customer', {
  state: () => ({
    profile: createEmptyCustomerProfile(),
    isLoaded: false,
    isLoading: false,
    isSaving: false,
    error: '',
  }),
  getters: {
    validation: (state) => validateCustomerProfile(state.profile),
    isComplete(): boolean {
      return this.validation.isComplete
    },
    missingFields(): string[] {
      return this.validation.missingFields
    },
  },
  actions: {
    async load(email = '') {
      this.isLoading = true
      this.error = ''

      try {
        this.profile = await fetchCurrentCustomerProfile(email)
        if (email && !this.profile.email) {
          this.profile.email = email
        }
        this.isLoaded = true
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unable to load customer profile.'
        this.profile = createEmptyCustomerProfile(email)
        this.isLoaded = true
        throw error
      } finally {
        this.isLoading = false
      }
    },
    async ensureLoaded(email = '') {
      if (!this.isLoaded || (email && this.profile.email !== email)) {
        await this.load(email)
      }
    },
    async save(profile: CustomerProfile) {
      this.isSaving = true
      this.error = ''

      try {
        this.profile = await saveCurrentCustomerProfile(profile)
        this.isLoaded = true
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Unable to save customer profile.'
        throw error
      } finally {
        this.isSaving = false
      }
    },
    reset() {
      this.profile = createEmptyCustomerProfile()
      this.isLoaded = false
      this.error = ''
    },
  },
})
