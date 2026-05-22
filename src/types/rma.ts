export type RmaIssueType =
  | 'arrival_damage'
  | 'functional_defect'
  | 'wrong_model'
  | 'missing_wrong_item'
  | 'installation_damage'
  | 'shipping_damage'
  | 'batch_issue'

export type RmaRequest = {
  orderNumber: string
  skuCode: string
  quantity: number
  issueType: RmaIssueType
  description: string
  testedBeforeInstall: boolean
  installed: boolean
  hasPhysicalDamage: boolean
  requestedResolution: 'replacement' | 'refund' | 'credit_note'
}

export type RmaCase = {
  id: string
  status: 'submitted'
  submittedAt: string
}
