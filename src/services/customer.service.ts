import { shouldUseSupabaseData, supabase } from '@/lib/supabase'
import type {
  CustomerProfile,
  CustomerProfileField,
  CustomerProfileValidation,
} from '@/types/customer'

const demoCustomerProfileKey = 'partspro.customerProfile'
let demoCustomerProfileMemory: CustomerProfile | null = null

type CustomerProfileRpcResponse = Partial<CustomerProfile> & {
  user_id?: string
  company_name?: string
  contact_name?: string
  vat_number?: string
  fiscal_code?: string
  registered_address?: string
  billing_address?: string
  shipping_address?: string
  profile_completed_at?: string
}

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function createEmptyCustomerProfile(email = ''): CustomerProfile {
  return {
    email,
    companyName: '',
    contactName: '',
    phone: '',
    vatNumber: '',
    fiscalCode: '',
    sdi: '',
    pec: '',
    registeredAddress: '',
    billingAddress: '',
    shippingAddress: '',
  }
}

export function normalizeCustomerProfile(rawProfile: Partial<CustomerProfileRpcResponse> | null | undefined) {
  const profile = rawProfile || {}

  return {
    id: clean(profile.id) || undefined,
    userId: clean(profile.userId || profile.user_id) || undefined,
    email: clean(profile.email),
    companyName: clean(profile.companyName || profile.company_name),
    contactName: clean(profile.contactName || profile.contact_name),
    phone: clean(profile.phone),
    vatNumber: clean(profile.vatNumber || profile.vat_number),
    fiscalCode: clean(profile.fiscalCode || profile.fiscal_code),
    sdi: clean(profile.sdi),
    pec: clean(profile.pec),
    registeredAddress: clean(profile.registeredAddress || profile.registered_address),
    billingAddress: clean(profile.billingAddress || profile.billing_address),
    shippingAddress: clean(profile.shippingAddress || profile.shipping_address),
    profileCompletedAt: clean(profile.profileCompletedAt || profile.profile_completed_at) || undefined,
  } satisfies CustomerProfile
}

export function validateCustomerProfile(profile: CustomerProfile): CustomerProfileValidation {
  const missingFields: CustomerProfileField[] = []

  if (!profile.companyName) {
    missingFields.push('companyName')
  }

  if (!profile.contactName) {
    missingFields.push('contactName')
  }

  if (!profile.phone) {
    missingFields.push('phone')
  }

  if (!profile.vatNumber) {
    missingFields.push('vatNumber')
  }

  if (!profile.billingAddress) {
    missingFields.push('billingAddress')
  }

  if (!profile.shippingAddress) {
    missingFields.push('shippingAddress')
  }

  if (!profile.sdi && !profile.pec) {
    missingFields.push('electronicInvoice')
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  }
}

function readDemoCustomerProfile(email = '') {
  if (!canUseStorage()) {
    return demoCustomerProfileMemory ? normalizeCustomerProfile({ ...demoCustomerProfileMemory, email }) : createEmptyCustomerProfile(email)
  }

  try {
    const rawProfile = window.localStorage.getItem(demoCustomerProfileKey)
    const profile = normalizeCustomerProfile(rawProfile ? JSON.parse(rawProfile) : { email })

    if (email) {
      profile.email = email
    }

    return profile
  } catch {
    return createEmptyCustomerProfile(email)
  }
}

function writeDemoCustomerProfile(profile: CustomerProfile) {
  const normalizedProfile = normalizeCustomerProfile(profile)
  const validation = validateCustomerProfile(normalizedProfile)
  const nextProfile: CustomerProfile = {
    ...normalizedProfile,
    profileCompletedAt: validation.isComplete ? normalizedProfile.profileCompletedAt || new Date().toISOString() : undefined,
  }

  demoCustomerProfileMemory = nextProfile

  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(demoCustomerProfileKey, JSON.stringify(nextProfile))
}

async function hasRealSupabaseSession() {
  if (!shouldUseSupabaseData) {
    return false
  }

  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw error
  }

  return Boolean(data.session?.user)
}

export async function fetchCurrentCustomerProfile(email = '') {
  if (await hasRealSupabaseSession()) {
    const { data, error } = await supabase.rpc('get_my_customer_profile')

    if (error) {
      throw error
    }

    return normalizeCustomerProfile((data as CustomerProfileRpcResponse | null) || { email })
  }

  return readDemoCustomerProfile(email)
}

export async function saveCurrentCustomerProfile(profile: CustomerProfile) {
  const normalizedProfile = normalizeCustomerProfile(profile)

  if (await hasRealSupabaseSession()) {
    const { data, error } = await supabase.rpc('upsert_my_customer_profile', {
      profile: {
        companyName: normalizedProfile.companyName,
        contactName: normalizedProfile.contactName,
        email: normalizedProfile.email,
        phone: normalizedProfile.phone,
        vatNumber: normalizedProfile.vatNumber,
        fiscalCode: normalizedProfile.fiscalCode,
        sdi: normalizedProfile.sdi,
        pec: normalizedProfile.pec,
        registeredAddress: normalizedProfile.registeredAddress,
        billingAddress: normalizedProfile.billingAddress,
        shippingAddress: normalizedProfile.shippingAddress,
      },
    })

    if (error) {
      throw error
    }

    return normalizeCustomerProfile(data as CustomerProfileRpcResponse)
  }

  writeDemoCustomerProfile(normalizedProfile)
  return readDemoCustomerProfile(normalizedProfile.email)
}
