import { defineStore } from 'pinia'

export type Language = 'it' | 'zh'

const storefrontLanguageKey = 'partspro.storefrontLanguage'
const adminLanguageKey = 'partspro.adminLanguage'

function isLanguage(value: string | null): value is Language {
  return value === 'it' || value === 'zh'
}

function readStoredLanguage(key: string, fallback: Language) {
  if (typeof window === 'undefined') {
    return fallback
  }

  const storedLanguage = window.localStorage.getItem(key)
  return isLanguage(storedLanguage) ? storedLanguage : fallback
}

function writeStoredLanguage(key: string, language: Language) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, language)
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    language: readStoredLanguage(storefrontLanguageKey, 'it'),
    adminLanguage: readStoredLanguage(adminLanguageKey, 'zh'),
  }),
  actions: {
    initializeLanguageState() {
      document.documentElement.lang = this.language === 'zh' ? 'zh-CN' : 'it'
    },
    setLanguage(language: Language) {
      this.language = language
      writeStoredLanguage(storefrontLanguageKey, language)
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'it'
    },
    setAdminLanguage(language: Language) {
      this.adminLanguage = language
      writeStoredLanguage(adminLanguageKey, language)
    },
  },
})
