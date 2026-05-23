import type {
  AdminBatch,
  AdminOrderStatus,
  AdminProduct,
  AdminStaffRole,
  B2BApprovalStatus,
  CustomerStatus,
  CustomerTier,
  PaymentStatus,
  StockMovementType,
  StockRisk,
} from '@/types/admin'

// 后台界面中文优先：新增后台功能时优先在这里补充状态和枚举显示文案。
export const orderStatusLabels: Record<AdminOrderStatus, string> = {
  submitted: '已提交',
  accepted: '已受理',
  picking: '拣货中',
  packed: '已打包',
  shipped: '已发货',
  completed: '已完成',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  pending: '待付款',
  paid: '已付款',
  bank_waiting: '等转账核对',
  failed: '付款失败',
}

export const stockRiskLabels: Record<StockRisk, string> = {
  clear: '库存正常',
  low: '库存偏低',
  split: '需拆单',
  blocked: '已阻塞',
}

export const stockStatusLabels: Record<'available' | 'low_stock' | 'reserved' | 'incoming', string> = {
  available: '可用',
  low_stock: '低库存',
  reserved: '已预留',
  incoming: '在途',
}

export const productStockStatusLabels: Record<AdminProduct['stockStatus'], string> = {
  in_stock: '现货',
  low_stock: '低库存',
  out_of_stock: '缺货',
  incoming: '在途',
}

export const productStatusLabels: Record<AdminProduct['status'], string> = {
  active: '已上架',
  draft: '草稿',
  hidden: '已隐藏',
  blocked: '已冻结',
}

export const frameLabels: Record<AdminProduct['frame'], string> = {
  'With Frame': '带框',
  'Without Frame': '不带框',
  'N/A': '不适用',
}

export const customerTierLabels: Record<CustomerTier, string> = {
  standard: '标准客户',
  silver: '银牌客户',
  gold: '金牌客户',
}

export const customerStatusLabels: Record<CustomerStatus, string> = {
  active: '正常',
  pending: '待审核',
  suspended: '已暂停',
}

export const approvalStatusLabels: Record<B2BApprovalStatus, string> = {
  submitted: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

export const batchStatusLabels: Record<AdminBatch['status'], string> = {
  incoming: '在途',
  qc_hold: '质检暂挂',
  released: '已放行',
  blocked: '已阻塞',
}

export const qcStatusLabels: Record<AdminBatch['qcStatus'], string> = {
  pending: '待质检',
  passed: '已通过',
  failed: '未通过',
}

export const movementTypeLabels: Record<StockMovementType, string> = {
  purchase_in: '采购入库',
  order_lock: '订单锁定',
  ship_out: '发货出库',
  rma_in: 'RMA 入库',
  qc_hold: '质检暂挂',
  adjustment: '库存调整',
}

export const staffRoleLabels: Record<AdminStaffRole, string> = {
  customer: '客户账号',
  sales: '销售',
  warehouse: '仓库',
  purchasing: '采购',
  admin: '管理员',
}

export const categoryLabels: Record<string, string> = {
  Screens: '屏幕',
  Batteries: '电池',
  'Charging Ports': '尾插',
  'Back Covers': '后盖',
  Cameras: '摄像头',
  Tools: '工具',
}

export function labelCategory(value: string) {
  return categoryLabels[value] || value
}

export function labelOrderStatus(value: AdminOrderStatus) {
  return orderStatusLabels[value] || value
}

export function labelPaymentStatus(value: PaymentStatus) {
  return paymentStatusLabels[value] || value
}

export function labelStockRisk(value: StockRisk) {
  return stockRiskLabels[value] || value
}

export function labelStockStatus(value: keyof typeof stockStatusLabels) {
  return stockStatusLabels[value] || value
}

export function labelProductStockStatus(value: AdminProduct['stockStatus']) {
  return productStockStatusLabels[value] || value
}

export function labelProductStatus(value: AdminProduct['status']) {
  return productStatusLabels[value] || value
}

export function labelFrame(value: AdminProduct['frame']) {
  return frameLabels[value] || value
}

export function labelCustomerTier(value: CustomerTier) {
  return customerTierLabels[value] || value
}

export function labelCustomerStatus(value: CustomerStatus) {
  return customerStatusLabels[value] || value
}

export function labelApprovalStatus(value: B2BApprovalStatus) {
  return approvalStatusLabels[value] || value
}

export function labelBatchStatus(value: AdminBatch['status']) {
  return batchStatusLabels[value] || value
}

export function labelQcStatus(value: AdminBatch['qcStatus']) {
  return qcStatusLabels[value] || value
}

export function labelMovementType(value: StockMovementType) {
  return movementTypeLabels[value] || value
}

export function labelStaffRole(value: AdminStaffRole) {
  return staffRoleLabels[value] || value
}
