export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'incoming'

export type Product = {
  skuCode: string
  name: string
  brand: string
  model: string
  modelCodes: string[]
  category: string
  qualityGrade: string
  color: string
  frame: 'With Frame' | 'Without Frame' | 'N/A'
  stockStatus: StockStatus
  imagePath?: string
  imageUrl?: string
  imageAlt?: string
  galleryImagePaths?: string[]
  moq: number
  b2bPrice: number
  vatMode: 'IVA esclusa' | 'IVA inclusa'
  warrantyDays: number
  compatibility: Array<{
    model: string
    code: string
    note: string
  }>
  highlights: string[]
}
