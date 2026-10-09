import {
  CloudUploadOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, MoreOutlined, PauseCircleOutlined,
  PlusOutlined, SearchOutlined, StarOutlined, TeamOutlined, UserSwitchOutlined,
} from '@ant-design/icons'
import { App, Avatar, Button, Card, Col, Dropdown, Input, Modal, Row, Select, Space, Table, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import { api } from '@/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'

import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  CUSTOMER_STATUS, DEMAND_TYPE, apiErrorMessage, customerCode, demandLabel, statusLabel,
  useCustomerMutations, useCustomers, useStaff,
  type Customer, type CustomerInput, type CustomerStatus, type DemandType,
} from '../api'
import { CustomerFormModal } from '../components/CustomerFormModal'
import { CustomerDetailModal } from '../components/CustomerDetailModal'

type Tone = 'green' | 'amber' | 'blue' | 'teal' | 'gray' | 'red' | 'purple'
const TONE: Record<Tone, { bg: string; fg: string; dot: string }> = {
  green: { bg: t.colorSuccessBg, fg: t.colorSuccessText, dot: t.colorSuccess },
  amber: { bg: t.colorWarningBg, fg: t.colorWarningText, dot: t.colorWarning },
  blue: { bg: t.colorInfoBg, fg: t.colorInfoText, dot: t.colorInfo },
  teal: { bg: t.colorTealBg, fg: t.colorTeal, dot: t.colorTeal },
  gray: { bg: t.colorSurfaceSunken, fg: t.colorTextMuted, dot: t.colorBorderStrong },
  red: { bg: t.colorErrorBg, fg: t.colorErrorText, dot: t.colorError },
  purple: { bg: t.colorVioletBg, fg: t.colorVioletText, dot: t.colorViolet },
}

/** Trạng thái khách hàng → tông màu (đúng ngữ nghĩa enum backend) */
const STATUS_TONE: Record<CustomerStatus, Tone> = {
  NEW: 'blue', POTENTIAL: 'amber', CUSTOMER: 'green', INACTIVE: 'gray',
}

function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const c = TONE[tone]
  return (
    <span className="stitch-pill" style={{ background: c.bg, color: c.fg }}>
      <span className="stitch-pill__dot" style={{ background: c.dot }} />
      {children}
    </span>
  )
}

const AVATAR_COLORS = ['#16A34A', '#0D9488', '#7C3AED', '#0EA5E9', '#F59E0B', '#EF4444']
const colorOf = (seed: string) => AVATAR_COLORS[[...seed].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AVATAR_COLORS.length]

/** "Nguyễn Nhật Minh" → NM (chữ đầu + chữ cuối, đúng kiểu avatar màn 9.8) */
const initials = (name: string) => {
  const w = name.trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w.length > 1 ? w[w.length - 1][0] : '')).toUpperCase()
}
const fmtDate = (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY') : '—')

/** Thẻ KPI Stitch: nhãn hoa 11px + icon tint góc phải + số 28px */
function KpiCard({ label, value, sub, icon, tone }: { label: string; value: string; sub: string; icon: ReactNode; tone: Tone }) {
  const c = TONE[tone]
  return (
    <Card className="stitch-card" variant="borderless" style={{ height: '100%' }} styles={{ body: { padding: 20 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <Typography.Text className="stitch-label" style={{ color: t.colorTextMuted }}>{label}</Typography.Text>
        <span style={{
          flex: '0 0 auto', width: 36, height: 36, borderRadius: t.radiusMd, display: 'grid', placeItems: 'center',
          background: c.bg, color: c.fg, fontSize: 17,
        }}>
          {icon}
        </span>
      </div>
      <div className="stitch-num" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, marginTop: 6 }}>
        {value}
      </div>
      <div style={{ fontSize: 12.5, color: t.colorTextMuted, marginTop: 4 }}>{sub}</div>
    </Card>
  )
}

/** Xuất CSV (Excel mở được) — BOM để không lỗi dấu tiếng Việt */
function exportCsv(rows: Customer[], ownerName: (id: string) => string) {
  const head = ['Mã khách hàng', 'Họ tên', 'Số điện thoại', 'Email', 'Nhu cầu', 'Nguồn', 'Nhân viên phụ trách', 'Trạng thái', 'Ngày tạo']
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`
  const lines = rows.map((c) => [
    customerCode(c), c.fullName, c.phone ?? '', c.email ?? '', demandLabel(c.demandType),
    c.source ?? '', ownerName(c.ownerId), statusLabel(c.status), fmtDate(c.createdAt),
  ].map(q).join(','))
  const blob = new Blob(['\uFEFF' + [head.map(q).join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `khach-hang-${dayjs().format('YYYYMMDD-HHmm')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** CSV nhập hàng loạt: dòng đầu là tên cột (fullName, phone, email, demandType, source, status) */
function parseCsv(text: string): CustomerInput[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []
  const head = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^\uFEFF/, ''))
  const col = (cells: string[], key: string) => {
    const i = head.indexOf(key)
    return i >= 0 ? cells[i]?.trim().replace(/^"|"$/g, '') || null : null
  }
  return lines.slice(1).map((line) => {
    const cells = line.split(',')
    return {
      fullName: col(cells, 'fullname') ?? '',
      phone: col(cells, 'phone'),
      email: col(cells, 'email'),
      demandType: (col(cells, 'demandtype')?.toUpperCase() as DemandType) ?? 'BUY',
      source: col(cells, 'source'),
      status: (col(cells, 'status')?.toUpperCase() as CustomerStatus) ?? 'NEW',
    }
  }).filter((r) => r.fullName)
}

export function CustomersPage() {
  const { message, modal } = App.useApp()
  const role = useAuthStore((s) => s.user?.role)
  const canWrite = role === 'ADMIN' || role === 'MANAGER'

  const { data, isLoading, isError, error } = useCustomers()
  const { data: staff = [] } = useStaff()
  const { create, update, remove } = useCustomerMutations()

  const [keyword, setKeyword] = useState('')
  const [demandType, setDemandType] = useState<DemandType | undefined>()
  const [source, setSource] = useState<string | undefined>()
  const [ownerId, setOwnerId] = useState<string | undefined>()
  const [status, setStatus] = useState<CustomerStatus | undefined>()

  const [selected, setSelected] = useState<string[]>([])
  const [bulk, setBulk] = useState<{ mode: 'assign' | 'status'; value?: string } | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [detailCustomerId, setDetailCustomerId] = useState<string>()
  const fileRef = useRef<HTMLInputElement>(null)

  const rows = data?.content ?? []
  const staffById = useMemo(() => new Map(staff.map((u) => [u.id, u])), [staff])
  const ownerName = (id: string) => staffById.get(id)?.fullName ?? 'Chưa phân công'

  const kpi = useMemo(() => {
    const since = dayjs().subtract(30, 'day')
    return {
      total: rows.length,
      fresh: rows.filter((c) => dayjs(c.createdAt).isAfter(since)).length,
      potential: rows.filter((c) => c.status === 'POTENTIAL').length,
      inactive: rows.filter((c) => c.status === 'INACTIVE').length,
    }
  }, [rows])

  // Nguồn là chuỗi tự do ở DB → dựng lựa chọn từ dữ liệu thật đang có
  const sources = useMemo(
    () => [...new Set(rows.map((c) => c.source).filter((s): s is string => !!s))].sort(),
    [rows],
  )

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase()
    return rows.filter((c) => {
      if (kw && ![c.fullName, c.phone ?? '', c.email ?? ''].some((v) => v.toLowerCase().includes(kw))) return false
      if (demandType && c.demandType !== demandType) return false
      if (source && c.source !== source) return false
      if (status && c.status !== status) return false
      if (ownerId === '__none__' ? staffById.has(c.ownerId) : ownerId && c.ownerId !== ownerId) return false
      return true
    })
  }, [rows, keyword, demandType, source, status, ownerId, staffById])

  const onError = (e: unknown) => message.error(apiErrorMessage(e))
  const afterWrite = (msg: string) => {
    setSelected([])
    setFormOpen(false)
    setBulk(null)
    message.success(msg)
  }
  const openEdit = (customer: Customer) => {
    setDetailCustomerId(undefined)
    setEditing(customer)
    setFormOpen(true)
  }

  /** Ghi chú chăm sóc lúc tạo khách → POST /customers/{id}/cares (type NOTE), đúng mô tả màn 9.8 */
  const saveCareNote = async (customerId: string, content: string) => {
    try {
      await api.post(`/customers/${customerId}/cares`, { type: 'NOTE', content })
    } catch (e) {
      message.warning(`Đã tạo khách hàng nhưng chưa lưu được ghi chú chăm sóc: ${apiErrorMessage(e)}`)
    }
  }

  const submitForm = (values: CustomerInput, careNote: string) => {
    const body: CustomerInput = {
      ...values,
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      source: values.source?.trim() || null,
      ownerId: canWrite ? values.ownerId ?? null : undefined,
    }
    if (editing) update.mutate({ id: editing.id, body }, { onSuccess: () => afterWrite('Đã cập nhật khách hàng'), onError })
    else {
      create.mutate(body, {
        onSuccess: async (created) => {
          if (careNote) await saveCareNote(created.id, careNote)
          afterWrite('Đã tạo khách hàng mới')
        },
        onError,
      })
    }
  }

  const removeOne = (c: Customer) =>
    modal.confirm({
      title: `Xóa khách hàng ${c.fullName}?`,
      content: 'Hành động này không hoàn tác được.',
      okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Hủy',
      onOk: () => remove.mutateAsync(c.id),
    })

  /** Hàng loạt: gọi từng PATCH/DELETE (customer-service chưa có endpoint bulk) */
  const bulkRun = (fn: (id: string) => Promise<unknown>, doneMsg: string) => {
    const ids = [...selected]
    void Promise.allSettled(ids.map(fn)).then((res) => {
      const failedIds = ids.filter((_, i) => res[i].status === 'rejected')
      setSelected(failedIds)
      setBulk(null)
      if (failedIds.length) message.warning(`${ids.length - failedIds.length}/${ids.length} thành công, ${failedIds.length} lỗi`)
      else message.success(doneMsg)
    })
  }

  const onPickFile = async (file: File) => {
    const parsed = parseCsv(await file.text())
    if (!parsed.length) { message.warning('File CSV không có dòng dữ liệu hợp lệ'); return }
    const results = await Promise.allSettled(parsed.map((row) => create.mutateAsync(row)))
    const ok = results.filter((r) => r.status === 'fulfilled').length
    message.info(`Nhập file xong: ${ok}/${parsed.length} khách hàng được tạo`)
  }

  const columns: ColumnsType<Customer> = [
    {
      title: 'Khách hàng', dataIndex: 'fullName', width: 240,
      render: (_v, row) => (
        <button type="button" className="customer-table__identity" onClick={() => setDetailCustomerId(row.id)}>
          <Avatar size={34} style={{ background: colorOf(row.fullName), fontWeight: 700 }}>{initials(row.fullName)}</Avatar>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{row.fullName}</div>
            <div className="stitch-num" style={{ fontSize: 13, color: t.colorBrand, fontWeight: 600 }}>{customerCode(row)}</div>
          </div>
        </button>
      ),
    },
    {
      title: 'Thông tin liên hệ', width: 210,
      render: (_v, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <div className="stitch-num" style={{ fontSize: 14, fontWeight: 500 }}>{row.phone ?? '—'}</div>
          <div style={{ fontSize: 13, color: t.colorTextMuted }}>{row.email ?? '—'}</div>
        </div>
      ),
    },
    {
      title: 'Nhu cầu', dataIndex: 'demandType', width: 150,
      render: (d: DemandType | null) => <Pill tone="teal">{demandLabel(d)}</Pill>,
    },
    {
      title: 'Nguồn', dataIndex: 'source', width: 150,
      render: (s: string | null) => s ?? <span style={{ color: t.colorTextMuted }}>—</span>,
    },
    {
      title: 'Nhân viên phụ trách', dataIndex: 'ownerId', width: 200,
      render: (id: string) => {
        const u = staffById.get(id)
        if (!u) return <span style={{ color: t.colorTextMuted }}>Chưa phân công</span>
        return (
          <Space size={8}>
            <Avatar size={26} style={{ background: colorOf(u.fullName), fontSize: 11 }}>{initials(u.fullName)}</Avatar>
            {u.fullName}
          </Space>
        )
      },
    },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 150,
      render: (s: CustomerStatus) => <Pill tone={STATUS_TONE[s] ?? 'gray'}>{statusLabel(s)}</Pill>,
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', width: 110,
      render: (v: string) => <span className="stitch-num">{fmtDate(v)}</span>,
    },
    {
      title: 'Thao tác', key: 'action', width: 70, align: 'center',
      render: (_v, row) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'Xem chi tiết', onClick: () => setDetailCustomerId(row.id) },
              ...(canWrite ? [{ key: 'edit', icon: <EditOutlined />, label: 'Cập nhật', onClick: () => openEdit(row) }, { key: 'del', icon: <DeleteOutlined />, label: 'Xóa', danger: true, onClick: () => removeOne(row) }] : []),
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} aria-label="Thao tác" />
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Danh sách khách hàng"
        breadcrumb={[{ title: 'Trang chủ', href: paths.dashboard }, { title: 'Khách hàng' }]}
        meta="Quản lý toàn bộ khách hàng, theo dõi hoạt động và phân công nhân viên phụ trách."
        actions={
          <>
            <Tooltip title="Xuất danh sách đang lọc ra CSV (mở bằng Excel)">
              <Button icon={<DownloadOutlined />} onClick={() => exportCsv(filtered, ownerName)}>Xuất Excel</Button>
            </Tooltip>
            <Tooltip title="CSV cột: fullName, phone, email, demandType, source, status">
              <Button icon={<CloudUploadOutlined />} onClick={() => fileRef.current?.click()}>Nhập file</Button>
            </Tooltip>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setFormOpen(true) }}>
              Thêm khách hàng mới
            </Button>
          </>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void onPickFile(f)
          e.target.value = ''
        }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}><KpiCard label="Tổng khách hàng" value={String(kpi.total)} sub="Toàn hệ thống" tone="green" icon={<TeamOutlined />} /></Col>
        <Col xs={24} sm={12} xl={6}><KpiCard label="Khách hàng mới" value={String(kpi.fresh)} sub="Trong 30 ngày qua" tone="blue" icon={<PlusOutlined />} /></Col>
        <Col xs={24} sm={12} xl={6}><KpiCard label="Khách tiềm năng" value={String(kpi.potential)} sub="Trạng thái POTENTIAL" tone="teal" icon={<StarOutlined />} /></Col>
        <Col xs={24} sm={12} xl={6}><KpiCard label="Chưa hoạt động" value={String(kpi.inactive)} sub="INACTIVE / Tạm ngưng" tone="amber" icon={<PauseCircleOutlined />} /></Col>
      </Row>


      <Card className="stitch-card" variant="borderless" style={{ marginTop: 16 }} styles={{ body: { padding: 20 } }}>
        <Space wrap size={12}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên, số điện thoại hoặc email khách hàng..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 340 }}
          />
          <Select allowClear placeholder="Tất cả nhu cầu" options={DEMAND_TYPE} value={demandType} onChange={setDemandType} style={{ width: 170 }} />
          <Select
            allowClear placeholder="Tất cả nguồn" style={{ width: 180 }}
            options={sources.map((s) => ({ value: s, label: s }))} value={source} onChange={setSource}
          />
          <Select
            allowClear placeholder="Tất cả nhân viên" style={{ width: 190 }} value={ownerId} onChange={setOwnerId}
            options={[...staff.map((u) => ({ value: u.id, label: u.fullName })), { value: '__none__', label: 'Chưa phân công' }]}
          />
          <Select allowClear placeholder="Tất cả trạng thái" options={CUSTOMER_STATUS} value={status} onChange={setStatus} style={{ width: 170 }} />
        </Space>

        {selected.length > 0 && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: t.radiusMd, background: t.colorSurfaceAlt,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 600 }}>Đã chọn {selected.length} khách hàng</span>
            <Button icon={<UserSwitchOutlined />} onClick={() => setBulk({ mode: 'assign' })}>Phân công nhân viên</Button>
            <Button icon={<StarOutlined />} onClick={() => setBulk({ mode: 'status' })}>Cập nhật trạng thái</Button>
            <Button
              danger icon={<DeleteOutlined />}
              onClick={() => modal.confirm({
                title: `Xóa ${selected.length} khách hàng đã chọn?`,
                content: 'Khách hàng còn nhật ký chăm sóc hoặc lịch hẹn sẽ không xóa được.',
                okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Hủy',
                onOk: () => bulkRun((id) => remove.mutateAsync(id), `Đã xóa ${selected.length} khách hàng`),
              })}
            >
              Xóa
            </Button>
            <div style={{ flex: 1 }} />
            <Button type="text" onClick={() => setSelected([])}>Bỏ chọn</Button>
          </div>
        )}

        <Table<Customer>
          rowKey="id"
          style={{ marginTop: 14 }}
          columns={columns}
          dataSource={filtered}
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: isError
              ? `Không tải được danh sách khách hàng: ${apiErrorMessage(error)}`
              : 'Không có khách hàng phù hợp bộ lọc',
          }}
          rowSelection={{
            selectedRowKeys: selected,
            onChange: (keys) => setSelected(keys.map(String)),
            preserveSelectedRowKeys: true,
          }}
          pagination={{
            defaultPageSize: 8,
            pageSizeOptions: [8, 10, 20, 50],
            showSizeChanger: true,
            showTotal: (total, range) => `Hiển thị ${range[0]} - ${range[1]} trong tổng số ${total} khách hàng`,
          }}
        />
      </Card>

      <CustomerFormModal
        open={formOpen}
        editing={editing}
        staff={staff}
        existing={rows}
        submitting={create.isPending || update.isPending}
        onCancel={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={submitForm}
      />

      <CustomerDetailModal
        customerId={detailCustomerId}
        staff={staff}
        canWrite={canWrite}
        onClose={() => setDetailCustomerId(undefined)}
        onEdit={openEdit}
      />

      <Modal
        open={!!bulk}
        title={bulk?.mode === 'assign' ? 'Phân công nhân viên phụ trách' : 'Cập nhật trạng thái'}
        okText="Áp dụng"
        cancelText="Hủy"
        okButtonProps={{ disabled: !bulk?.value }}
        onCancel={() => setBulk(null)}
        onOk={() => {
          const picked = bulk
          if (!picked?.value) return
          const n = selected.length
          if (picked.mode === 'assign') {
            bulkRun((id) => update.mutateAsync({ id, body: { ownerId: picked.value } }), `Đã phân công ${n} khách hàng`)
          } else {
            bulkRun(
              (id) => update.mutateAsync({ id, body: { status: picked.value as CustomerStatus } }),
              `Đã cập nhật trạng thái ${n} khách hàng`,
            )
          }
        }}
      >
        <Select
          style={{ width: '100%', marginTop: 8 }}
          placeholder={bulk?.mode === 'assign' ? 'Chọn nhân viên' : 'Chọn trạng thái'}
          value={bulk?.value}
          onChange={(v) => setBulk((b) => (b ? { ...b, value: v } : b))}
          options={bulk?.mode === 'assign' ? staff.map((u) => ({ value: u.id, label: u.fullName })) : CUSTOMER_STATUS}
        />
      </Modal>
    </>
  )
}
