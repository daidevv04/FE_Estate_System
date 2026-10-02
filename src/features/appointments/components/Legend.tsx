/** Chú giải dưới lịch tuần — chấm màu + nhãn chữ + số lượng tính theo tuần đang xem */
export function Legend({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#3e4a3d' }}>
      <span style={{ width: 10, height: 10, borderRadius: 9999, background: color, flex: '0 0 auto' }} />
      {label}
      <span className="stitch-num" style={{ fontWeight: 600 }}>{count}</span>
    </span>
  )
}
