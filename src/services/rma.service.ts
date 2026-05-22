import type { RmaCase, RmaRequest } from '@/types/rma'

export async function submitRmaRequest(request: RmaRequest): Promise<RmaCase> {
  console.info('RMA placeholder submit', request)

  return {
    id: `RMA-${Date.now()}`,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  }
}
