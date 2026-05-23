import { defineStore } from 'pinia'
import { getProducts } from '@/services/products.service'

const favoritesStorageKey = 'partspro.favorites'

function readStoredFavorites() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }

  try {
    const rawFavorites = window.localStorage.getItem(favoritesStorageKey)
    const parsedFavorites = rawFavorites ? JSON.parse(rawFavorites) : []
    return Array.isArray(parsedFavorites)
      ? parsedFavorites.filter((skuCode): skuCode is string => typeof skuCode === 'string')
      : []
  } catch {
    return []
  }
}

function writeStoredFavorites(skuCodes: string[]) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(favoritesStorageKey, JSON.stringify(skuCodes))
  } catch {
    // Storage can be unavailable in embedded/private contexts.
  }
}

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    skuCodes: readStoredFavorites(),
  }),
  getters: {
    isFavorite: (state) => (skuCode: string) => state.skuCodes.includes(skuCode),
    favoriteProducts: (state) =>
      getProducts().filter((product) => state.skuCodes.includes(product.skuCode)),
  },
  actions: {
    toggleFavorite(skuCode: string) {
      if (this.skuCodes.includes(skuCode)) {
        this.skuCodes = this.skuCodes.filter((storedSkuCode) => storedSkuCode !== skuCode)
        writeStoredFavorites(this.skuCodes)
        return false
      }

      this.skuCodes.push(skuCode)
      writeStoredFavorites(this.skuCodes)
      return true
    },
    removeFavorite(skuCode: string) {
      this.skuCodes = this.skuCodes.filter((storedSkuCode) => storedSkuCode !== skuCode)
      writeStoredFavorites(this.skuCodes)
    },
    clearFavorites() {
      this.skuCodes = []
      writeStoredFavorites(this.skuCodes)
    },
  },
})
