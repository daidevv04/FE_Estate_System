import { Alert } from 'antd'
import { PageHeader } from '@/components/layout/PageHeader'
import { paths } from '@/routes/paths'

export function PlaceholderPage({ title, spec }: { title: string; spec: string }) {
  return (
    <>
      <PageHeader title={title} breadcrumb={[{ title: 'Trang chủ', href: paths.dashboard }, { title }]} />
      <Alert type="info" showIcon message={`Chưa code màn này — dựng theo mục ${spec} của docs/UI_DESIGN_PROMPT.md`} />
    </>
  )
}
