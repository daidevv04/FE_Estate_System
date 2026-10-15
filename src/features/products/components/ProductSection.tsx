import type { ReactNode } from 'react'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  extra?: ReactNode
  children: ReactNode
}

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