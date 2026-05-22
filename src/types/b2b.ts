export type B2BApplication = {
  email: string
  password?: string
  contactName: string
  phone: string
  whatsapp: string
  companyName: string
  vatNumber: string
  fiscalCode: string
  sdi: string
  pec: string
  companyType: string
  registeredAddress: string
  shippingAddress: string
  monthlyPurchase: string
  interestedCategories: string[]
  paymentNeeds: string[]
  acceptsTerms: boolean
  acceptsPrivacy: boolean
  acceptsMarketing: boolean
}

export type B2BApplicationResult = {
  id: string
  status: 'submitted'
  submittedAt: string
}
