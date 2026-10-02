# ĐẤT XANH MIỀN TRUNG — CRM frontend

React 19 + TypeScript + Vite + Ant Design 5 + TanStack Query v5 + Zustand + React Router v7.
Bản đặc tả 33 màn: `../CRM_Estate_System/docs/UI_DESIGN_PROMPT.md`.

## Chạy

```powershell
Copy-Item .env.example .env.local
npm install
npm run dev
npm run typecheck
npm run build
```

Backend local: gateway `http://localhost:8080/api`. Cấu hình ở `.env.local`.

## Cấu trúc

```text
public/                         logo/favicons
src/
  api/                          axios instance, TanStack Query, endpoints theo domain
  assets/                       ảnh/SVG tĩnh
  components/
    brand/                      BrandLogo
    common/                     component dùng chung: DataTable, StatusTag, EmptyState...
    layout/                     AppShell, Sidebar, Header, PageHeader
  features/<domain>/            pages, hooks, components riêng từng nghiệp vụ
  hooks/                        hooks dùng chung
  lib/                          format, enum labels, quyền
  routes/                       paths, router, ProtectedRoute
  store/                        authStore, uiStore
  theme/                        tokens, AntD ConfigProvider
  types/                        type dùng chung
```

Quy ước:
- Route: chỉ khai báo ở `src/routes/paths.ts`.
- Màu: chỉ từ `src/theme/tokens.ts`.
- Route trừ `/login`, `/login/2fa`, `/forgot-password`: bắt buộc qua `ProtectedRoute`.
- Role duy nhất: `ADMIN`, `MANAGER`, `SALES`. Khách hàng là dữ liệu CRM, không có account/portal.
- Backend nhận `LocalDateTime` UTC không `Z`: dùng `toUtcString()` từ `src/lib/format.ts`.
