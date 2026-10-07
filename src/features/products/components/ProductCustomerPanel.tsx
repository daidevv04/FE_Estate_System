import { PhoneOutlined, TeamOutlined, UserAddOutlined } from '@ant-design/icons'
import { App, Button, Empty } from 'antd'
import { useNavigate } from 'react-router-dom'
import { STAGE_CLASS, STAGE_LABEL, type Lead } from '@/features/leads/api'
import type { Customer } from '@/features/customers/api'
import { formatDate } from '@/lib/format'
import { paths } from '@/routes/paths'
import { tokens as t } from '@/theme/tokens'
import { ProductSection } from './ProductSection'

interface Props {
  leads: Lead[]
  customerById: Map<string, Customer>
  ownerName: (id: string) => string
  loading: boolean
}

/**
 * 9.17 — cột phải "Khách hàng & Lead": danh sách lead đang gắn với căn (GET /leads?productId=)
 * kèm khách hàng và sales phụ trách. Chỉ hiện lead có thật; không có thì empty state.
 */
export function ProductCustomerPanel({ leads, customerById, ownerName, loading }: Props) {
  const { message } = App.useApp()
  const navigate = useNavigate()

  return (
    <ProductSection
      title="Khách hàng & Lead"
      subtitle={leads.length > 0 ? `${leads.length} cơ hội đang chăm sóc căn này` : 'Chưa có lead nào gắn với căn này'}
    >
      {loading ? null : leads.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lead nào" />
      ) : (
        <ul className="pd-leads">
          {leads.map((lead) => {
            const customer = customerById.get(lead.customerId)
            return (
              <li className="pd-lead" key={lead.id}>
                <div className="pd-lead__top">
                  <span className="pd-lead__name" title={customer?.fullName}>{customer?.fullName ?? 'Khách hàng ẩn danh'}</span>
                  <span className={`pd-lead__stage ${STAGE_CLASS[lead.stage]}`}>{STAGE_LABEL[lead.stage]}</span>
                </div>
                <div className="pd-lead__phone"><PhoneOutlined /> {customer?.phone ?? 'Chưa có SĐT'}</div>
                <div className="pd-lead__owner">
                  <span>Phụ trách:</span>
                  <strong>{ownerName(lead.assignedTo)}</strong>
                  <span>· Hạn chốt {formatDate(lead.closeDate)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Button
        type="text"
        block
        icon={<UserAddOutlined style={{ color: t.colorSuccess }} />}
        onClick={() => message.info('Gắp lead vào căn tại màn Lead (9.18)')}
      >
        Thêm khách hàng / gắp lead vào căn này
      </Button>
      <Button type="text" block icon={<TeamOutlined />} onClick={() => navigate(paths.leads)}>
        Xem tất cả lead
      </Button>
    </ProductSection>
  )
}