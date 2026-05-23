import { defineStore } from 'pinia'
import { shouldUseSupabaseData, supabase } from '@/lib/supabase'

export type TaxonomyCategoryNode = {
  id: string
  labelZh: string
  labelIt: string
  value: string
}

export type TaxonomyModelNode = {
  id: string
  labelZh: string
  labelIt: string
  value: string
  children: TaxonomyCategoryNode[]
}

export type TaxonomyBrandNode = {
  id: string
  labelZh: string
  labelIt: string
  value: string
  children: TaxonomyModelNode[]
}

type TaxonomyLanguage = 'zh' | 'it'

const taxonomyStorageKey = 'partspro.catalogTaxonomy'
const taxonomyRecordId = 'default'

const defaultTaxonomy: TaxonomyBrandNode[] = [
  {
    id: 'brand-apple',
    labelZh: 'Apple',
    labelIt: 'Apple',
    value: 'Apple',
    children: [
      {
        id: 'model-apple-iphone-11',
        labelZh: 'iPhone 11',
        labelIt: 'iPhone 11',
        value: 'iPhone 11',
        children: [
          { id: 'cat-apple-iphone-11-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
          { id: 'cat-apple-iphone-11-tools', labelZh: '防水胶 / 耗材', labelIt: 'Adesivi e consumabili', value: 'Tools' },
        ],
      },
      {
        id: 'model-apple-iphone-12',
        labelZh: 'iPhone 12',
        labelIt: 'iPhone 12',
        value: 'iPhone 12',
        children: [
          { id: 'cat-apple-iphone-12-batteries', labelZh: '电池', labelIt: 'Batterie', value: 'Batteries' },
          { id: 'cat-apple-iphone-12-tools', labelZh: '防水胶 / 耗材', labelIt: 'Adesivi e consumabili', value: 'Tools' },
        ],
      },
      {
        id: 'model-apple-iphone-13',
        labelZh: 'iPhone 13',
        labelIt: 'iPhone 13',
        value: 'iPhone 13',
        children: [
          { id: 'cat-apple-iphone-13-cameras', labelZh: '摄像头', labelIt: 'Fotocamere', value: 'Cameras' },
          { id: 'cat-apple-iphone-13-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
        ],
      },
    ],
  },
  {
    id: 'brand-samsung',
    labelZh: 'Samsung',
    labelIt: 'Samsung',
    value: 'Samsung',
    children: [
      {
        id: 'model-samsung-a52',
        labelZh: 'Galaxy A52',
        labelIt: 'Galaxy A52',
        value: 'Galaxy A52',
        children: [
          { id: 'cat-samsung-a52-charging', labelZh: '尾插小板', labelIt: 'Connettori ricarica', value: 'Charging Ports' },
          { id: 'cat-samsung-a52-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
        ],
      },
      {
        id: 'model-samsung-s21',
        labelZh: 'Galaxy S21',
        labelIt: 'Galaxy S21',
        value: 'Galaxy S21',
        children: [
          { id: 'cat-samsung-s21-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
          { id: 'cat-samsung-s21-charging', labelZh: '尾插小板', labelIt: 'Connettori ricarica', value: 'Charging Ports' },
        ],
      },
    ],
  },
  {
    id: 'brand-xiaomi',
    labelZh: 'Xiaomi',
    labelIt: 'Xiaomi',
    value: 'Xiaomi',
    children: [
      {
        id: 'model-xiaomi-redmi-note-10',
        labelZh: 'Redmi Note 10',
        labelIt: 'Redmi Note 10',
        value: 'Redmi Note 10',
        children: [
          { id: 'cat-xiaomi-rn10-back-cover', labelZh: '后盖', labelIt: 'Cover posteriori', value: 'Back Covers' },
          { id: 'cat-xiaomi-rn10-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
        ],
      },
    ],
  },
  {
    id: 'brand-huawei',
    labelZh: 'Huawei',
    labelIt: 'Huawei',
    value: 'Huawei',
    children: [
      {
        id: 'model-huawei-p-series',
        labelZh: 'P 系列',
        labelIt: 'Serie P',
        value: 'P Series',
        children: [
          { id: 'cat-huawei-p-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
          { id: 'cat-huawei-p-batteries', labelZh: '电池', labelIt: 'Batterie', value: 'Batteries' },
        ],
      },
    ],
  },
  {
    id: 'brand-oppo',
    labelZh: 'Oppo',
    labelIt: 'Oppo',
    value: 'Oppo',
    children: [
      {
        id: 'model-oppo-reno',
        labelZh: 'Reno 系列',
        labelIt: 'Serie Reno',
        value: 'Reno Series',
        children: [
          { id: 'cat-oppo-reno-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
          { id: 'cat-oppo-reno-charging', labelZh: '尾插小板', labelIt: 'Connettori ricarica', value: 'Charging Ports' },
        ],
      },
    ],
  },
  {
    id: 'brand-honor',
    labelZh: 'Honor',
    labelIt: 'Honor',
    value: 'Honor',
    children: [
      {
        id: 'model-honor-number',
        labelZh: '数字系列',
        labelIt: 'Serie numerica',
        value: 'Number Series',
        children: [
          { id: 'cat-honor-number-screens', labelZh: '屏幕总成', labelIt: 'Schermi', value: 'Screens' },
          { id: 'cat-honor-number-batteries', labelZh: '电池', labelIt: 'Batterie', value: 'Batteries' },
        ],
      },
    ],
  },
]

function cloneDefaultTaxonomy() {
  return JSON.parse(JSON.stringify(defaultTaxonomy)) as TaxonomyBrandNode[]
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function readTaxonomy() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return cloneDefaultTaxonomy()
  }

  try {
    const rawTaxonomy = window.localStorage.getItem(taxonomyStorageKey)
    const parsed = rawTaxonomy ? (JSON.parse(rawTaxonomy) as TaxonomyBrandNode[]) : null
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : cloneDefaultTaxonomy()
  } catch {
    return cloneDefaultTaxonomy()
  }
}

function isTaxonomyGroup(value: unknown): value is TaxonomyBrandNode {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as TaxonomyBrandNode
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.labelZh === 'string' &&
    typeof candidate.labelIt === 'string' &&
    typeof candidate.value === 'string' &&
    Array.isArray(candidate.children)
  )
}

function normalizeTaxonomyGroups(value: unknown) {
  return Array.isArray(value) && value.every(isTaxonomyGroup)
    ? (value as TaxonomyBrandNode[])
    : cloneDefaultTaxonomy()
}

function writeLocalTaxonomy(groups: TaxonomyBrandNode[]) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }

  try {
    window.localStorage.setItem(taxonomyStorageKey, JSON.stringify(groups))
  } catch {
    // Storage can be unavailable in embedded/private contexts.
  }
}

export function getTaxonomyLabel(
  node: Pick<TaxonomyBrandNode, 'labelZh' | 'labelIt' | 'value'>,
  language: TaxonomyLanguage,
) {
  return language === 'zh' ? node.labelZh || node.value : node.labelIt || node.value
}

function nodeMatches(value: string, candidate: string) {
  return value.trim().toLowerCase() === candidate.trim().toLowerCase()
}

export const useTaxonomyStore = defineStore('taxonomy', {
  state: () => ({
    groups: readTaxonomy(),
    isLoaded: false,
    isSaving: false,
    syncError: '',
  }),
  getters: {
    cascaderOptions: (state) =>
      state.groups.map((brand) => ({
        label: `${brand.labelZh || brand.value} / ${brand.labelIt || brand.value}`,
        value: brand.id,
        children: brand.children.map((model) => ({
          label: `${model.labelZh || model.value} / ${model.labelIt || model.value}`,
          value: model.id,
          children: model.children.map((category) => ({
            label: `${category.labelZh || category.value} / ${category.labelIt || category.value}`,
            value: category.id,
          })),
        })),
      })),
  },
  actions: {
    async load() {
      if (this.isLoaded) {
        return
      }

      this.syncError = ''

      if (!shouldUseSupabaseData) {
        this.isLoaded = true
        return
      }

      try {
        const { data, error } = await supabase
          .from('catalog_taxonomy')
          .select('groups')
          .eq('id', taxonomyRecordId)
          .maybeSingle()

        if (error) {
          throw error
        }

        if (data?.groups) {
          this.groups = normalizeTaxonomyGroups(data.groups)
          writeLocalTaxonomy(this.groups)
        }
      } catch (error) {
        this.syncError = error instanceof Error ? error.message : 'Catalog taxonomy sync failed.'
        console.warn('[PartsPro] Catalog taxonomy fallback to local data', error)
      } finally {
        this.isLoaded = true
      }
    },
    persist() {
      writeLocalTaxonomy(this.groups)

      if (shouldUseSupabaseData) {
        void this.persistRemote()
      }
    },
    async persistRemote() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        return
      }

      this.isSaving = true
      this.syncError = ''

      try {
        const { error } = await supabase
          .from('catalog_taxonomy')
          .upsert({
            id: taxonomyRecordId,
            groups: this.groups,
            updated_by: session.user.id,
          })

        if (error) {
          throw error
        }
      } catch (error) {
        this.syncError = error instanceof Error ? error.message : 'Catalog taxonomy save failed.'
        console.warn('[PartsPro] Catalog taxonomy save failed', error)
      } finally {
        this.isSaving = false
      }
    },
    resetDefaults() {
      this.groups = cloneDefaultTaxonomy()
      this.persist()
    },
    addBrand() {
      const brandNumber = this.groups.length + 1
      this.groups.push({
        id: createId('brand'),
        labelZh: `新品牌 ${brandNumber}`,
        labelIt: `Nuovo brand ${brandNumber}`,
        value: `Brand ${brandNumber}`,
        children: [],
      })
      this.persist()
    },
    addModel(brandId: string) {
      const brand = this.groups.find((item) => item.id === brandId)
      if (!brand) {
        return
      }

      const modelNumber = brand.children.length + 1
      brand.children.push({
        id: createId('model'),
        labelZh: `新机型 ${modelNumber}`,
        labelIt: `Nuovo modello ${modelNumber}`,
        value: `Model ${modelNumber}`,
        children: [],
      })
      this.persist()
    },
    addCategory(brandId: string, modelId: string) {
      const brand = this.groups.find((item) => item.id === brandId)
      const model = brand?.children.find((item) => item.id === modelId)
      if (!model) {
        return
      }

      const categoryNumber = model.children.length + 1
      model.children.push({
        id: createId('category'),
        labelZh: `新分类 ${categoryNumber}`,
        labelIt: `Nuova categoria ${categoryNumber}`,
        value: `Category ${categoryNumber}`,
      })
      this.persist()
    },
    getValuesForPath(path: string[]) {
      const [brandId, modelId, categoryId] = path
      const brand = this.groups.find((item) => item.id === brandId)
      const model = brand?.children.find((item) => item.id === modelId)
      const category = model?.children.find((item) => item.id === categoryId)

      if (!brand || !model || !category) {
        return null
      }

      return {
        brand: brand.value,
        model: model.value,
        category: category.value,
      }
    },
    findPathForProduct(brandValue: string, modelValue: string, categoryValue: string) {
      for (const brand of this.groups) {
        if (!nodeMatches(brand.value, brandValue) && !nodeMatches(brand.labelZh, brandValue) && !nodeMatches(brand.labelIt, brandValue)) {
          continue
        }

        for (const model of brand.children) {
          if (!nodeMatches(model.value, modelValue) && !nodeMatches(model.labelZh, modelValue) && !nodeMatches(model.labelIt, modelValue)) {
            continue
          }

          for (const category of model.children) {
            if (
              nodeMatches(category.value, categoryValue) ||
              nodeMatches(category.labelZh, categoryValue) ||
              nodeMatches(category.labelIt, categoryValue)
            ) {
              return [brand.id, model.id, category.id]
            }
          }
        }
      }

      return []
    },
  },
})
