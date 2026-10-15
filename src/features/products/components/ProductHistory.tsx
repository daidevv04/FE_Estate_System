import { ReloadOutlined } from '@ant-design/icons'
import { App, Button, Empty } from 'antd'
import { useNavigate } from 'react-router-dom'
import { STAGE_LABEL, type Lead } from '@/features/leads/api'
import type { Product } from '../../projects/api'
import { labelOf, PRODUCT_STATUS } from '../../projects/api'
import { formatDateTime } from '@/lib/format'
import { paths } from '@/routes/paths'
import { ProductSection } from './ProductSection'

interface Props {
  product: Product
  leads: Lead[]
  customerName: (id: string) => string
  onRefresh: () => void
}

interface Entry { key: string; title: string; desc: string; at: string; tone: 'brand' | 'amber' | 'teal' }

export function ProductHistory({ product, leads, customerName, onRefresh }: Props) {
  const { message } = App.useApp()
  const navigate = useNavigate()

  const entries: Entry[] = ([
    {
      key: 'created',
      title: 'Đưa sản phẩm vào bảng hàng',
      desc: `Sản phẩm ${product.code} được tạo với trạng thái ${labelOf(PRODUCT_STATUS, product.status)}`,
      at: product.createdAt,
      tone: 'teal' as const,
    },
    ...(product.updatedAt !== product.createdAt
      ? [{ key: 'updated', title: 'Cập nhật thông tin sản phẩm', desc: `Trạng thái hiện tại: ${labelOf(PRODUCT_STATUS, product.status)}`, at: product.updatedAt, tone: 'amber' as const }]
      : []),
    ...leads.map((lead) => ({
      key: lead.id,
      title: 'Đăng ký nguyện vọng',
      desc: `${customerName(lead.customerId)} · Giai đoạn ${STAGE_LABEL[lead.stage]}`,
      at: lead.createdAt,
      tone: 'brand' as const,
    })),
  ] as Entry[]).sort((a, b) => (a.at < b.at ? 1 : -1))

  return (
    <ProductSection
      title="Lịch sử biến động sản phẩm"
      extra={<Button type="text" size="small" aria-label="Làm mới lịch sử" icon={<ReloadOutlined />} onClick={() => { onRefresh(); message.success('Đã tải lại lịch sử') }} />}
    >
      {entries.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có biến động nào" />
      ) : (
        <ul className="pd-timeline">
          {entries.map((entry) => (
            <li className="pd-timeline__item" key={entry.key}>
              <span className={`pd-timeline__dot is-${entry.tone}`} />
              <div className="pd-timeline__body">
                <div className="pd-timeline__head">
                  <strong>{entry.title}</strong>
                  <span>{formatDateTime(entry.at)}</span>
                </div>
                <p>{entry.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button type="text" block onClick={() => navigate(paths.leads)}>Xem tất cả</Button>
    </ProductSection>
  )
}