import type { B2BApplication, B2BApplicationResult } from '@/types/b2b'
import { shouldUseSupabaseData, supabase } from '@/lib/supabase'

type B2BApplicationRow = {
  id: string
  status: B2BApplicationResult['status']
  submitted_at: string
}

export async function submitB2BApplication(
  application: B2BApplication,
): Promise<B2BApplicationResult> {
  if (shouldUseSupabaseData) {
    const { data, error } = await supabase
      .from('b2b_applications')
      .insert({
        company_name: application.companyName.trim(),
        contact_name: application.contactName.trim(),
        email: application.email.trim().toLowerCase(),
        phone: application.phone.trim(),
        whatsapp: application.whatsapp.trim(),
        vat_number: application.vatNumber.trim(),
        fiscal_code: application.fiscalCode.trim(),
        sdi: application.sdi.trim(),
        pec: application.pec.trim(),
        company_type: application.companyType,
        registered_address: application.registeredAddress.trim(),
        shipping_address: application.shippingAddress.trim(),
        monthly_purchase: application.monthlyPurchase,
        interested_categories: application.interestedCategories,
        payment_needs: application.paymentNeeds,
        status: 'submitted',
        review_note: '',
        accepts_terms: application.acceptsTerms,
        accepts_privacy: application.acceptsPrivacy,
        accepts_marketing: application.acceptsMarketing,
      })
      .select('id,status,submitted_at')
      .single()

    if (error) {
      throw error
    }

    const row = data as B2BApplicationRow

    return {
      id: row.id,
      status: row.status,
      submittedAt: row.submitted_at,
    }
  }

  return {
    id: `b2b-${Date.now()}`,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  }
}
