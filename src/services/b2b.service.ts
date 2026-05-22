import type { B2BApplication, B2BApplicationResult } from '@/types/b2b'

export async function submitB2BApplication(
  application: B2BApplication,
): Promise<B2BApplicationResult> {
  console.info('B2B application placeholder submit', application)

  return {
    id: `b2b-${Date.now()}`,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
  }
}
