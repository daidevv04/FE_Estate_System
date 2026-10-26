import {
  CalendarOutlined, CheckCircleOutlined, CloudUploadOutlined, CompassOutlined, DeleteOutlined,
  DownloadOutlined, EditOutlined, EyeOutlined, MailOutlined, MessageOutlined, PauseCircleOutlined, PhoneOutlined, PlusOutlined,
  ReloadOutlined, SaveOutlined, SearchOutlined, ShareAltOutlined, StarOutlined, TeamOutlined, UserOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { Alert, App, Button, Card, Col, Input, Modal, Popover, Row, Select, Space, Table, Tooltip } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'

import { useAuthStore } from '@/store/authStore'
import { tokens as t } from '@/theme/tokens'
import {
  CUSTOMER_STATUS, DEMAND_TYPE, apiErrorMessage, customerCode, demandLabel, statusLabel,
  useAllCustomerCares, useCustomerMutations, useCustomers, useMyManagedUserIds, useStaff,
  type Customer, type CustomerInput, type CustomerStatus, type DemandType,
} from '../api'
import { CustomerFormModal } from '../components/CustomerFormModal'
import { CustomerDetailModal } from '../components/CustomerDetailModal'
import { SendCustomerEmailModal } from '../components/SendCustomerEmailModal'
import { QuickCallActionModal } from '../components/QuickCallActionModal'
import { CustomerMeetingModal } from '../components/CustomerMeetingModal'
import { StatusPill as Pill, type StatusTone as Tone } from '@/components/common/StatusPill'
import { KpiCard } from '@/components/common/KpiCard'
import { SelectableTableContainer } from '@/components/common/SelectableTableContainer'
import { notifyCustomerCreated } from '@/api/notificationEventHelper'

const STATUS_TONE: Record<CustomerStatus, Tone> = {
  NEW: 'blue', POTENTIAL: 'amber', CUSTOMER: 'green', INACTIVE: 'gray',
}

const fmtDate = (v: string | null) => (v ? dayjs(v).format('DD/MM/YYYY') : '—')

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

function SalesNextActionCell({
  customer,
  initialNote,
  onSaved,
}: {
  customer: Customer
  initialNote: string
  onSaved: () => void
}) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState(initialNote)
  const [loading, setLoading] = useState(false)
  const { message } = App.useApp()

  useEffect(() => {
    setNote(initialNote)
  }, [initialNote])

  const handleSave = async () => {
    if (!note.trim()) {
      message.warning('Vui lòng nhập nội dung ghi chú kế hoạch cần làm')
      return
    }
    setLoading(true)
    try {
      await api.post(`/customers/${customer.id}/cares`, {
        type: 'NOTE',
        content: `[Kế hoạch tiếp theo] ${note.trim()}`,
      })
      await qc.invalidateQueries({ queryKey: ['customer-cares'] })
      message.success(`Đã lưu kế hoạch tiếp theo cho khách ${customer.fullName}`)
      setOpen(false)
      onSaved()
    } catch (e) {
      message.error(apiErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const cleanNote = initialNote.replace(/^\[Kế hoạch tiếp theo\]\s*/, '')

  const content = (
    <div
      style={{ width: 310, padding: '4px 0' }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, color: '#1e293b' }}>
        Kế hoạch / Hành động tiếp theo với khách hàng:
      </div>
      <Input.TextArea
        rows={3}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Ví dụ: Gửi bảng giá Regal trước 17h, gọi điện lại sáng mai lúc 9h..."
        style={{ marginBottom: 10, fontSize: 13 }}
        maxLength={500}
        showCount
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            setOpen(false)
          }}
        >
          Hủy
        </Button>
        <Button
          size="small"
          type="primary"
          loading={loading}
          icon={<SaveOutlined />}
          onClick={(e) => {
            e.stopPropagation()
            void handleSave()
          }}
          style={{ background: '#059669', borderColor: '#059669' }}
        >
          Lưu ghi chú
        </Button>
      </div>
    </div>
  )

  return (
    <div
      className="sales-next-action-cell"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Popover
        content={content}
        trigger="click"
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (v) setNote(cleanNote)
        }}
        placement="leftBottom"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            background: cleanNote ? '#f8fafc' : 'rgba(245, 158, 11, 0.06)',
            border: '1px dashed',
            borderColor: cleanNote ? '#cbd5e1' : '#f59e0b',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            minHeight: 32,
          }}
          title="Bấm để cập nhật ghi chú nên làm gì tiếp theo cho khách hàng này"
        >
          <span
            style={{
              fontSize: 12,
              color: cleanNote ? '#334155' : '#d97706',
              fontStyle: cleanNote ? 'normal' : 'italic',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {cleanNote || '+ Thêm hành động tiếp theo...'}
          </span>
          <EditOutlined style={{ fontSize: 12, color: cleanNote ? '#64748b' : '#d97706', flexShrink: 0 }} />
        </div>
      </Popover>
    </div>
  )
}

export function CustomersPage() {
  const { message, modal } = App.useApp()
  const user = useAuthStore((s) => s.user)
  const role = user?.role
  const canWrite = role === 'ADMIN' || role === 'MANAGER'
  const canSendEmail = role === 'MANAGER' || role === 'SALES'

  const { data, isLoading, isError, error, refetch } = useCustomers()
  const { data: staff = [] } = useStaff()
  const { data: myManagedUserIds = [] } = useMyManagedUserIds()
  const { create, update, remove } = useCustomerMutations()
  const { data: careNotesData, refetch: refetchCareNotes } = useAllCustomerCares({ type: 'NOTE', size: 1000 })
  const careNotes = careNotesData?.content ?? []

  const latestNoteByCustomer = useMemo(() => {
    const map = new Map<string, string>()
    careNotes.forEach((c) => {
      if (c.customerId && !map.has(c.customerId)) {
        map.set(c.customerId, c.content)
      }
    })
    return map
  }, [careNotes])

  const isManager = role === 'MANAGER'
  const rows = data?.content ?? []
  const hasNoProjects = isManager && myManagedUserIds.length <= 1 && rows.length === 0 && !isLoading

  const assignableStaff = useMemo(() => {
    if (role === 'ADMIN') return staff
    if (role === 'MANAGER') {
      const idSet = new Set(myManagedUserIds)
      return staff.filter((u) => idSet.has(u.id))
    }
    return staff.filter((u) => u.id === user?.id)
  }, [staff, role, myManagedUserIds, user?.id])

  const scopeText = useMemo(() => {
    if (role === 'ADMIN') return 'Toàn hệ thống'
    if (role === 'MANAGER') return hasNoProjects ? 'Chưa phân công dự án' : 'Dự án phụ trách (Theo đội ngũ)'
    return 'Khách hàng của tôi'
  }, [role, hasNoProjects])

  const kpiSubText = useMemo(() => {
    if (role === 'ADMIN') return 'Toàn hệ thống'
    if (role === 'MANAGER') return 'Thuộc dự án phụ trách'
    return 'Khách hàng của tôi'
  }, [role])

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
  const [emailCustomer, setEmailCustomer] = useState<Customer | null>(null)
  const [callCustomer, setCallCustomer] = useState<Customer | null>(null)
  const [meetingCustomer, setMeetingCustomer] = useState<Customer | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const sources = useMemo(
    () => [...new Set(rows.map((c) => c.source).filter((s): s is string => !!s))].sort(),
    [rows],
  )

  const norm = (s: string | null | undefined) =>
    (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

  const filtered = useMemo(() => {
    const kw = norm(keyword)
    return rows.filter((c) => {
      if (kw && ![c.fullName, c.phone ?? '', c.email ?? '', customerCode(c)].some((v) => norm(v).includes(kw))) return false
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
          notifyCustomerCreated({
            customerId: created.id,
            customerName: created.fullName,
            creatorName: user?.fullName,
            ownerId: created.ownerId,
            phone: created.phone ?? undefined,
          })
          afterWrite('Đã tạo khách hàng mới')
        },
        onError,
      })
    }
  }

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
      title: (
        <span>
          <UserOutlined style={{ marginRight: 5, color: '#059669' }} />
          Khách hàng
        </span>
      ),
      dataIndex: 'fullName',
      width: 210,
      fixed: 'left',
      render: (_v, row) => (
        <button
          type="button"
          onClick={() => setDetailCustomerId(row.id)}
          style={{
            background: 'transparent',
            border: 0,
            padding: 0,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 13, color: '#111c2d', lineHeight: '20px' }}>
            {row.fullName}
          </div>
          <div className="stitch-num" style={{ fontSize: 12, color: t.colorBrand, fontWeight: 600, lineHeight: '18px' }}>
            {customerCode(row)}
          </div>
        </button>
      ),
    },
    {
      title: (
        <span>
          <PhoneOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Thông tin liên hệ
        </span>
      ),
      width: 250,
      render: (_v, row) => (
        <div style={{ lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            {row.phone ? (
              <button
                type="button"
                onClick={() => setCallCustomer(row)}
                title="Bấm để gọi điện cho khách hàng (Tự động ghi log thực tế)"
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  color: '#059669',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <PhoneOutlined style={{ fontSize: 13 }} />
                <span className="stitch-num" style={{ textDecoration: 'underline' }}>{row.phone}</span>
              </button>
            ) : (
              <span style={{ fontSize: 13, color: '#94a3b8' }}>—</span>
            )}
            <div
              title={row.email ?? ''}
              style={{
                fontSize: 12,
                color: t.colorTextMuted,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 145,
                marginTop: 2,
              }}
            >
              {row.email ? (
                <button
                  type="button"
                  onClick={() => setEmailCustomer(row)}
                  title={`Gửi email chăm sóc tới ${row.email}`}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#6366f1',
                    fontSize: 12,
                  }}
                >
                  <MailOutlined style={{ fontSize: 11 }} />
                  <span style={{ textDecoration: 'underline' }}>{row.email}</span>
                </button>
              ) : (
                '—'
              )}
            </div>
          </div>
          <Space size={4}>
            {row.phone && (
              <Tooltip title="Gọi điện & Ghi log cuộc gọi thực tế">
                <Button
                  type="text"
                  size="small"
                  icon={<PhoneOutlined style={{ color: '#059669', fontSize: 13 }} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCallCustomer(row)
                  }}
                  style={{
                    background: 'rgba(5, 150, 105, 0.08)',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                />
              </Tooltip>
            )}
            {canSendEmail && (
              <Tooltip title={row.email ? `Gửi email chăm sóc tới ${row.email}` : 'Gửi email chăm sóc'}>
                <Button
                  type="text"
                  size="small"
                  icon={<MailOutlined style={{ color: '#6366f1', fontSize: 13 }} />}
                  onClick={(e) => {
                    e.stopPropagation()
                    setEmailCustomer(row)
                  }}
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                />
              </Tooltip>
            )}
            <Tooltip title="Đặt lịch hẹn gặp mặt (Tự động ghi log thực tế)">
              <Button
                type="text"
                size="small"
                icon={<CalendarOutlined style={{ color: '#0284c7', fontSize: 13 }} />}
                onClick={(e) => {
                  e.stopPropagation()
                  setMeetingCustomer(row)
                }}
                style={{
                  background: 'rgba(2, 132, 199, 0.08)',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              />
            </Tooltip>
          </Space>
        </div>
      ),
    },
    {
      title: (
        <span>
          <CompassOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Nhu cầu
        </span>
      ),
      dataIndex: 'demandType',
      width: 110,
      render: (d: DemandType | null) => <Pill tone="teal">{demandLabel(d)}</Pill>,
    },
    {
      title: (
        <span>
          <ShareAltOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Nguồn
        </span>
      ),
      dataIndex: 'source',
      width: 120,
      ellipsis: true,
      render: (s: string | null) => s ?? <span style={{ color: t.colorTextMuted }}>—</span>,
    },
    {
      title: (
        <span>
          <TeamOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Nhân viên phụ trách
        </span>
      ),
      dataIndex: 'ownerId',
      width: 160,
      ellipsis: true,
      render: (id: string) => {
        const u = staffById.get(id)
        if (!u) return <span style={{ color: t.colorTextMuted }}>Chưa phân công</span>
        return <span style={{ fontSize: 13, color: '#1e293b' }}>{u.fullName}</span>
      },
    },
    {
      title: (
        <span>
          <CheckCircleOutlined style={{ marginRight: 5, color: '#059669' }} />
          Trạng thái
        </span>
      ),
      dataIndex: 'status',
      width: 125,
      render: (s: CustomerStatus) => <Pill tone={STATUS_TONE[s] ?? 'gray'}>{statusLabel(s)}</Pill>,
    },
    {
      title: (
        <span>
          <CalendarOutlined style={{ marginRight: 5, color: '#64748b' }} />
          Ngày tạo
        </span>
      ),
      dataIndex: 'createdAt',
      width: 120,
      render: (v: string) => <span className="stitch-num" style={{ whiteSpace: 'nowrap' }}>{fmtDate(v)}</span>,
    },
    {
      title: (
        <span>
          <MessageOutlined style={{ marginRight: 5, color: '#d97706' }} />
          Hành động tiếp theo (Sales)
        </span>
      ),
      key: 'salesNextAction',
      width: 250,
      onCell: () => ({
        onClick: (e) => e.stopPropagation(),
      }),
      render: (_v, row) => (
        <SalesNextActionCell
          customer={row}
          initialNote={latestNoteByCustomer.get(row.id) ?? ''}
          onSaved={() => void refetchCareNotes()}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Danh sách khách hàng"
        breadcrumb={[{ title: 'Trang chủ', href: paths.dashboard }, { title: 'Khách hàng' }]}
        status={
          <span className="pipe-scope">
            <span className="pipe-scope__dot" />
            Phạm vi: {scopeText}
          </span>
        }
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

      {hasNoProjects && (
        <Alert
          showIcon
          type="warning"
          style={{ marginBottom: 16, borderRadius: 10, border: '1px solid #fde68a' }}
          message={<strong style={{ fontSize: 14 }}>Tài khoản Quản lý chưa được phân công dự án</strong>}
          description={
            <div style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>
              Bạn hiện chưa được phân công phụ trách dự án bất động sản nào. Theo cơ chế phân quyền bảo mật dữ liệu khách hàng, bạn chỉ quản lý khách hàng của chính mình và đội ngũ nhân sự Sales thuộc các dự án bạn phụ trách. Vui lòng liên hệ <strong>Quản trị viên (Admin)</strong> để được gán dự án.
            </div>
          }
        />
      )}

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
        <Col xs={24} sm={12} xl={6}><KpiCard loading={isLoading} label="Tổng khách hàng" value={String(kpi.total)} sub={kpiSubText} tone="green" icon={<TeamOutlined />} /></Col>
        <Col xs={24} sm={12} xl={6}><KpiCard loading={isLoading} label="Khách hàng mới" value={String(kpi.fresh)} sub="Trong 30 ngày qua" tone="blue" icon={<PlusOutlined />} /></Col>
        <Col xs={24} sm={12} xl={6}><KpiCard loading={isLoading} label="Khách tiềm năng" value={String(kpi.potential)} sub="Khách hàng đang có nhu cầu" tone="teal" icon={<StarOutlined />} /></Col>
        <Col xs={24} sm={12} xl={6}><KpiCard loading={isLoading} label="Chưa hoạt động" value={String(kpi.inactive)} sub="Tạm ngưng chăm sóc" tone="amber" icon={<PauseCircleOutlined />} /></Col>
      </Row>

      <Card className="stitch-card crm-filter-card" variant="borderless" styles={{ body: { padding: '12px 16px' } }}>
        <div className="crm-filter-bar">
          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            placeholder="Tìm theo tên, SĐT, email, mã KH..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ flex: '1.8 1 200px', minWidth: 180 }}
          />
          <Select
            allowClear
            placeholder="Tất cả nhu cầu"
            options={DEMAND_TYPE}
            value={demandType}
            onChange={setDemandType}
            style={{ flex: '1 1 130px', minWidth: 120 }}
          />
          <Select
            allowClear
            placeholder="Tất cả nguồn"
            options={sources.map((s) => ({ value: s, label: s }))}
            value={source}
            onChange={setSource}
            style={{ flex: '1 1 130px', minWidth: 120 }}
          />
          {canWrite && (
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Tất cả nhân viên"
              value={ownerId}
              onChange={setOwnerId}
              options={[...assignableStaff.map((u) => ({ value: u.id, label: u.fullName })), { value: '__none__', label: 'Chưa phân công' }]}
              style={{ flex: '1.2 1 150px', minWidth: 130 }}
            />
          )}
          <Select
            allowClear
            placeholder="Tất cả trạng thái"
            options={CUSTOMER_STATUS}
            value={status}
            onChange={setStatus}
            style={{ flex: '1 1 130px', minWidth: 120 }}
          />
          {(keyword || demandType || source || ownerId || status) && (
            <Button
              className="crm-filter-clear-btn"
              icon={<ReloadOutlined />}
              onClick={() => {
                setKeyword('')
                setDemandType(undefined)
                setSource(undefined)
                setOwnerId(undefined)
                setStatus(undefined)
              }}
            >
              Xoá lọc
            </Button>
          )}
        </div>

        {selected.length > 0 && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: t.radiusMd, background: t.colorSurfaceAlt,
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 600 }}>Đã chọn {selected.length} khách hàng</span>
            
            <Tooltip title={selected.length > 1 ? 'Chỉ xem chi tiết khi chọn 1 khách hàng' : undefined}>
              <span>
                <Button
                  icon={<EyeOutlined />}
                  disabled={selected.length !== 1}
                  style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                  onClick={() => {
                    const row = filtered.find((c) => c.id === selected[0])
                    if (row) setDetailCustomerId(row.id)
                  }}
                >
                  Xem chi tiết
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={selected.length > 1 ? 'Chỉ chỉnh sửa khi chọn 1 khách hàng' : undefined}>
              <span>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  disabled={selected.length !== 1}
                  style={{ opacity: selected.length !== 1 ? 0.45 : 1 }}
                  onClick={() => {
                    const row = filtered.find((c) => c.id === selected[0])
                    if (row) openEdit(row)
                  }}
                >
                  Chỉnh sửa
                </Button>
              </span>
            </Tooltip>

            {canWrite && (
              <Button icon={<UserSwitchOutlined />} onClick={() => setBulk({ mode: 'assign' })}>
                Phân công ({selected.length})
              </Button>
            )}
            <Button icon={<StarOutlined />} onClick={() => setBulk({ mode: 'status' })}>
              Cập nhật trạng thái ({selected.length})
            </Button>
            {role === 'ADMIN' && (
              <Button
                danger icon={<DeleteOutlined />}
                onClick={() => modal.confirm({
                  title: `Xóa ${selected.length} khách hàng đã chọn?`,
                  content: 'Khách hàng còn nhật ký chăm sóc hoặc lịch hẹn sẽ không xóa được.',
                  okText: 'Xóa', okButtonProps: { danger: true }, cancelText: 'Hủy',
                  onOk: () => bulkRun((id) => remove.mutateAsync(id), `Đã xóa ${selected.length} khách hàng`),
                })}
              >
                Xóa ({selected.length})
              </Button>
            )}
            <div style={{ flex: 1 }} />
            <Button type="text" onClick={() => setSelected([])}>Bỏ chọn</Button>
          </div>
        )}

        <SelectableTableContainer
          items={filtered}
          selectedKeys={selected}
          onSelectionChange={(keys) => setSelected(keys)}
          hintText="💡 Mẹo: Nhấn giữ chuột kéo để bôi đen chọn nhiều dòng, hoặc giữ Shift + Click để chọn dải"
        >
          <Table<Customer>
            size="middle"
            rowKey="id"
            style={{ marginTop: 14 }}
            columns={columns}
            dataSource={filtered}
            loading={isLoading}
            scroll={{ x: 1080 }}
            onRow={(record) => ({
              onClick: (e) => {
                const target = e.target as HTMLElement
                if (
                  target.closest('.ant-checkbox-wrapper') ||
                  target.closest('button') ||
                  target.closest('a') ||
                  target.closest('.sales-next-action-cell') ||
                  target.closest('.ant-popover')
                ) return
                setDetailCustomerId(record.id)
              },
              style: { cursor: 'pointer' },
            })}
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
        </SelectableTableContainer>
      </Card>

      <CustomerFormModal
        open={formOpen}
        editing={editing}
        staff={assignableStaff}
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

      <SendCustomerEmailModal
        open={Boolean(emailCustomer)}
        customer={emailCustomer}
        onClose={() => setEmailCustomer(null)}
        onSuccess={() => void refetch()}
      />

      <QuickCallActionModal
        open={Boolean(callCustomer)}
        customer={callCustomer}
        onClose={() => setCallCustomer(null)}
        onSuccess={() => {
          void refetch()
          void refetchCareNotes()
        }}
      />

      <CustomerMeetingModal
        open={Boolean(meetingCustomer)}
        customer={meetingCustomer}
        onClose={() => setMeetingCustomer(null)}
        onSuccess={() => {
          void refetch()
          void refetchCareNotes()
        }}
      />

      <Modal
        open={!!bulk}
        title={bulk?.mode === 'assign' ? 'Phân công nhân viên phụ trách' : 'Cập nhật trạng thái'}
        okText="Áp dụng"
        cancelText="Hủy"
        centered
        destroyOnHidden
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
          options={bulk?.mode === 'assign' ? assignableStaff.map((u) => ({ value: u.id, label: u.fullName })) : CUSTOMER_STATUS}
        />
      </Modal>
    </>
  )
}
