export type CustomerProfile = {
  id?: string
  userId?: string
  email: string
  companyName: string
  contactName: string
  phone: string
  vatNumber: string
  fiscalCode: string
  sdi: string
  pec: string
  registeredAddress: string
  billingAddress: string
  shippingAddress: string
  profileCompletedAt?: string
}

export type CustomerProfileField =
  | 'companyName'
  | 'contactName'
  | 'phone'
  | 'vatNumber'
  | 'billingAddress'
  | 'shippingAddress'
  | 'electronicInvoice'

export type CustomerProfileValidation = {
  isComplete: boolean
  missingFields: CustomerProfileField[]
}
