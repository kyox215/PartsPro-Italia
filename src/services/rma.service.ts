import type { RmaCase, RmaRequest } from '@/types/rma'
import { shouldUseSupabaseData, supabase } from '@/lib/supabase'

type RmaCaseRow = {
  id: string
  status: RmaCase['status']
  created_at: string
}

function createLocalRmaCase(): RmaCase {
  return {
    id: `RMA-${Date.now()}`,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  }
}

export async function submitRmaRequest(request: RmaRequest): Promise<RmaCase> {
  if (shouldUseSupabaseData) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      throw sessionError
    }

    if (!session?.user) {
      return createLocalRmaCase()
    }

    const { data, error } = await supabase
      .from('rma_requests')
      .insert({
        user_id: session.user.id,
        order_no: request.orderNumber,
        sku_code: request.skuCode,
        quantity: request.quantity,
        status: 'submitted',
        problem_type: request.issueType,
        description: request.description.trim(),
        evidence_urls: [],
        tested_before_install: request.testedBeforeInstall,
        installed: request.installed,
        has_physical_damage: request.hasPhysicalDamage,
        requested_resolution: request.requestedResolution,
      })
      .select('id,status,created_at')
      .single()

    if (error) {
      throw error
    }

    const row = data as RmaCaseRow

    return {
      id: row.id,
      status: row.status,
      submittedAt: row.created_at,
    }
  }

  return createLocalRmaCase()
}
