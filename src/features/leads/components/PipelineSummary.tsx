import { ArrowUpOutlined, BellOutlined, FunnelPlotOutlined, WalletOutlined } from '@ant-design/icons'
import { compactVnd, fullVnd } from '../api'

export interface PipelineSummaryData {
  openCount: number
  expected: number
  lateCount: number
  growth: number | null
  quarter: number
  year: number
}

/** 3 thẻ chỉ số đầu trang 9.18 — con số lớn, label nhỏ, icon nền tint bên phải */
export function PipelineSummary({ data, canViewAll }: { data: PipelineSummaryData; canViewAll: boolean }) {
  return (
    <div className="pipe-kpis">
      <div className="pipe-kpi">
        <div>
          <p className="pipe-kpi__label">Lead đang mở</p>
          <div className="pipe-kpi__val">
            {data.openCount} <span className="pipe-kpi__unit">cơ hội</span>
            {data.growth !== null && (
              <span className="pipe-kpi__trend">
                <ArrowUpOutlined style={{ fontSize: 12 }} />
                {data.growth >= 0 ? '+' : ''}{data.growth}%
              </span>
            )}
          </div>
          <p className="pipe-kpi__sub">
            {canViewAll ? 'Toàn công ty' : 'Lead của tôi'} · so với cùng kỳ tháng trước
          </p>
        </div>
        <div className="pipe-kpi__icon is-brand"><FunnelPlotOutlined /></div>
      </div>

      <div className="pipe-kpi">
        <div>
          <p className="pipe-kpi__label">Tổng giá trị kỳ vọng</p>
          <div className="pipe-kpi__val is-brand">
            {compactVnd(data.expected)}
            <span className="pipe-kpi__full">({fullVnd(data.expected)})</span>
          </div>
          <p className="pipe-kpi__sub">Dự phóng trong chu kỳ Q{data.quarter}/{data.year}</p>
        </div>
        <div className="pipe-kpi__icon is-teal"><WalletOutlined /></div>
      </div>

      <div className="pipe-kpi is-warn">
        <div>
          <p className="pipe-kpi__label">
            <span>Cần xử lý / Quá hạn</span>
            <span className="pipe-kpi__alert" />
          </p>
          <div className="pipe-kpi__val is-warn">
            {data.lateCount} <span className="pipe-kpi__unit">cơ hội</span>
            {data.lateCount > 0 && <span className="pipe-kpi__chip">Cần nhắc việc</span>}
          </div>
          <p className="pipe-kpi__sub">{data.lateCount} lead đã qua hạn chốt nhưng chưa chốt Thắng / Mất</p>
        </div>
        <div className="pipe-kpi__icon is-amber"><BellOutlined /></div>
      </div>
    </div>
  )
}
