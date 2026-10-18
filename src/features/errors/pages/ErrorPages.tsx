import { Button, Result } from 'antd'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom'
import { paths } from '@/routes/paths'

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <Result
      status="403"
      title="Không có quyền truy cập"
      subTitle="Bạn không có quyền xem trang này."
      extra={<Button type="primary" onClick={() => navigate(paths.dashboard)}>Về trang tổng quan</Button>}
    />
  )
}

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Result
      status="404"
      title="Không tìm thấy trang"
      subTitle="Đường dẫn không tồn tại hoặc bản ghi đã bị xoá."
      extra={
        <>
          <Button type="primary" onClick={() => navigate(paths.dashboard)}>Về trang tổng quan</Button>
          <Button onClick={() => navigate(-1)}>Về trang trước</Button>
        </>
      }
    />
  )
}

export function ServerErrorPage() {
  const navigate = useNavigate()
  const error = useRouteError()

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />
  }

  return (
    <Result
      status="500"
      title="Có lỗi từ hệ thống"
      subTitle="Vui lòng thử lại. Nếu vẫn lỗi, gửi mã tra cứu (X-Request-ID) cho bộ phận hỗ trợ."
      extra={
        <>
          <Button type="primary" onClick={() => window.location.reload()}>Thử lại</Button>
          <Button onClick={() => navigate(paths.dashboard)}>Về trang tổng quan</Button>
        </>
      }
    />
  )
}
