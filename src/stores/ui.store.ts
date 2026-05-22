import { defineStore } from 'pinia'

export type Language = 'it' | 'zh'

export const useUiStore = defineStore('ui', {
  state: () => ({
    language: 'it' as Language,
    adminLanguage: 'zh' as Language,
  }),
  actions: {
    setLanguage(language: Language) {
      this.language = language
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'it'
    },
    setAdminLanguage(language: Language) {
      this.adminLanguage = language
    },
  },
})
