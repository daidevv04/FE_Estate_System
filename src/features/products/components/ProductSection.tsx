import type { ReactNode } from 'react'

interface Props {
  /** Tiêu đề section — Stitch dùng thanh xanh bo tròn bên trái + h3 đậm. */
  title: ReactNode
  /** Dòng phụ xám căn phải ngay cạnh tiêu đề (ví dụ "Quy chuẩn xây dựng ..."). */
  subtitle?: ReactNode
  /** Nút / điều khiển căn phải (ví dụ "Nháp xem bản vẽ chi tiết"). */
  extra?: ReactNode
  children: ReactNode
}

/** Vỏ section dùng chung cho mọi khối của màn 9.17 — tránh lặp card + tiêu đề ở từng component. */
export function ProductSection({ title, subtitle, extra, children }: Props) {
  return (
    <section className="stitch-card pd-card">
      <div className="pd-card__head">
        <div className="pd-sec">
          <i className="pd-sec__bar" />
          <h3 className="pd-sec__title">{title}</h3>
          {subtitle && <span className="pd-sec__sub">{subtitle}</span>}
        </div>
        {extra}
      </div>
      {children}
    </section>
  )
}