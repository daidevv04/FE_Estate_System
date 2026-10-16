import { useNotificationStore, type PublishEventInput } from '@/store/notificationStore'
import { STAGE_LABEL, type LeadStage } from '@/features/leads/api'

const nf = new Intl.NumberFormat('vi-VN')
const formatVnd = (n?: number | null) => (n ? `${nf.format(n)} ₫` : '')

/**
 * Phát sự kiện thông báo qua API của user-service.
 * Backend sẽ lưu thông báo và đẩy SSE realtime tới Admin, Manager và Sale phụ trách (loại trừ người thực hiện).
 */
export async function emitNotificationEvent(input: PublishEventInput) {
  try {
    await useNotificationStore.getState().publishEvent(input)
  } catch (err) {
    console.warn('Lỗi gửi sự kiện thông báo:', err)
  }
}

/**
 * Thông báo khi tạo Lead mới:
 * Admin + Manager + Sale được chỉ định (nếu khác người tạo) sẽ nhận được thông báo.
 */
export function notifyLeadCreated(params: {
  leadId: string
  customerName?: string
  creatorName?: string
  assignedTo?: string
  expectedValue?: number | null
}) {
  const targetName = params.customerName ? `khách hàng "${params.customerName}"` : 'mới'
  const valStr = params.expectedValue ? ` (Kỳ vọng: ${formatVnd(params.expectedValue)})` : ''
  const actorStr = params.creatorName ? `${params.creatorName} ` : ''

  void emitNotificationEvent({
    type: 'LEAD_CREATED',
    title: `Lead mới: ${params.customerName ?? 'Chưa đặt tên'}`,
    body: `${actorStr}vừa tạo cơ hội bán hàng ${targetName}${valStr}.`,
    refType: 'LEAD',
    refId: params.leadId,
    targetUserId: params.assignedTo,
    broadcastToManagersAndAdmins: true,
  })
}

/**
 * Thông báo khi Lead chuyển sang giai đoạn mới (bao gồm WON và LOST):
 */
export function notifyLeadStageChanged(params: {
  leadId: string
  customerName?: string
  updaterName?: string
  oldStage?: LeadStage
  newStage: LeadStage
  assignedTo?: string
  expectedValue?: number | null
}) {
  const stageName = STAGE_LABEL[params.newStage] ?? params.newStage
  const leadName = params.customerName ?? 'Cơ hội bán hàng'
  const actorStr = params.updaterName ? `${params.updaterName} ` : ''

  let eventType: PublishEventInput['type'] = 'LEAD_STAGE_CHANGED'
  let title = `Chuyển giai đoạn: ${leadName}`
  let body = `${actorStr}đã chuyển lead "${leadName}" sang giai đoạn "${stageName}".`

  if (params.newStage === 'WON') {
    eventType = 'DEAL_WON'
    const valStr = params.expectedValue ? ` trị giá ${formatVnd(params.expectedValue)}` : ''
    title = `🎉 Chốt Lead THÀNH CÔNG (WON): ${leadName}`
    body = `Chúc mừng! ${actorStr}vừa chốt thành công lead "${leadName}"${valStr}! 🎉`
  } else if (params.newStage === 'LOST') {
    eventType = 'DEAL_LOST'
    title = `Lead thất bại (LOST): ${leadName}`
    body = `${actorStr}đã đánh dấu thất bại lead "${leadName}".`
  }

  void emitNotificationEvent({
    type: eventType,
    title,
    body,
    refType: 'LEAD',
    refId: params.leadId,
    targetUserId: params.assignedTo,
    broadcastToManagersAndAdmins: true,
  })
}

/**
 * Thông báo khi thêm Khách hàng mới:
 */
export function notifyCustomerCreated(params: {
  customerId: string
  customerName: string
  creatorName?: string
  ownerId?: string
  phone?: string
}) {
  const phoneStr = params.phone ? ` • SĐT: ${params.phone}` : ''
  const actorStr = params.creatorName ? `${params.creatorName} ` : ''

  void emitNotificationEvent({
    type: 'CUSTOMER_CREATED',
    title: `Khách hàng mới: ${params.customerName}`,
    body: `${actorStr}vừa thêm khách hàng mới vào hệ thống${phoneStr}.`,
    refType: 'CUSTOMER',
    refId: params.customerId,
    targetUserId: params.ownerId,
    broadcastToManagersAndAdmins: true,
  })
}

/**
 * Thông báo khi tạo Deal / Hợp đồng mới:
 */
export function notifyDealCreated(params: {
  dealId: string
  contractCode: string
  customerName?: string
  creatorName?: string
  salesId?: string
  value?: number | null
}) {
  const valStr = params.value ? ` trị giá ${formatVnd(params.value)}` : ''
  const actorStr = params.creatorName ? `${params.creatorName} ` : ''
  const custStr = params.customerName ? ` cho khách hàng "${params.customerName}"` : ''

  void emitNotificationEvent({
    type: 'DEAL_CREATED',
    title: `Hợp đồng mới: #${params.contractCode}`,
    body: `${actorStr}vừa khởi tạo hợp đồng #${params.contractCode}${custStr}${valStr}.`,
    refType: 'DEAL',
    refId: params.dealId,
    targetUserId: params.salesId,
    broadcastToManagersAndAdmins: true,
  })
}

/**
 * Thông báo khi Deal chốt thành công (COMPLETED) hoặc bị hủy (CANCELLED):
 */
export function notifyDealStatusChanged(params: {
  dealId: string
  contractCode: string
  updaterName?: string
  status: string
  salesId?: string
  value?: number | null
}) {
  const isWon = params.status === 'COMPLETED'
  const isLost = params.status === 'CANCELLED'
  if (!isWon && !isLost) return

  const actorStr = params.updaterName ? `${params.updaterName} ` : ''
  const valStr = params.value ? ` trị giá ${formatVnd(params.value)}` : ''

  if (isWon) {
    void emitNotificationEvent({
      type: 'DEAL_WON',
      title: `🎉 Chốt hợp đồng THÀNH CÔNG: #${params.contractCode}`,
      body: `Hợp đồng #${params.contractCode}${valStr} đã hoàn tất và chốt thành công bởi ${actorStr.trim() || 'hệ thống'}.`,
      refType: 'DEAL',
      refId: params.dealId,
      targetUserId: params.salesId,
      broadcastToManagersAndAdmins: true,
    })
  } else {
    void emitNotificationEvent({
      type: 'DEAL_LOST',
      title: `Hợp đồng bị hủy: #${params.contractCode}`,
      body: `Hợp đồng #${params.contractCode} đã chuyển sang trạng thái Hủy bởi ${actorStr.trim() || 'hệ thống'}.`,
      refType: 'DEAL',
      refId: params.dealId,
      targetUserId: params.salesId,
      broadcastToManagersAndAdmins: true,
    })
  }
}
