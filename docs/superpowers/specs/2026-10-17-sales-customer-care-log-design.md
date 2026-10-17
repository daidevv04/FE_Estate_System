# Design Spec: Nhật Ký Chăm Sóc Khách Hàng cho Role SALES

**Ngày:** 2026-10-17  
**Tác giả:** Antigravity  
**Trạng thái:** Approved  

## 1. Bối cảnh & Mục tiêu
- **Vấn đề:** Hiện tại nhân viên kinh doanh (Role SALES) chưa có trang tập trung để theo dõi lịch sử chăm sóc khách hàng (nhật ký cuộc gọi, gặp gỡ, ghi chú, gửi email), và trong Modal chi tiết khách hàng (`CustomerDetailModal.tsx`) phần "Hoạt động CRM gần đây" chỉ là placeholder trống chưa tích hợp ghi chép tương tác.
- **Mục tiêu:**
  1. Thêm màn hình độc lập **"Nhật ký chăm sóc"** (`/customer-cares`) vào menu `BÁN HÀNG` dành cho SALES, MANAGER và ADMIN.
  2. Bổ sung endpoint tổng hợp `GET /customers/cares` trong `customer-service` để lọc nhanh toàn bộ nhật ký theo quyền (SALES chỉ thấy khách do mình phụ trách, MANAGER thấy khách trong phạm vi dự án, ADMIN thấy tất cả).
  3. Tích hợp trực tiếp **CustomerCareTimeline** và form ghi nhận nhanh vào `CustomerDetailModal.tsx`.

## 2. Kiến trúc & Dữ liệu

### 2.1 Backend (`customer-service`)
- Tận dụng entity `CustomerCare` đã có trong database:
  - `id`: UUID
  - `customer`: Customer
  - `type`: Enum `CALL`, `MEETING`, `EMAIL`, `NOTE`
  - `content`: String (text)
  - `createdAt`, `updatedAt`, `createdBy`, `updatedBy`
- Bổ sung endpoint tổng hợp tại `CustomerCareController`:
  - `GET /customers/cares`:
    - Query params: `type` (CareType, optional), `keyword` (String, tìm kiếm theo tên khách, SĐT hoặc nội dung), `page`, `size`, `sort`.
    - Phân quyền:
      - `SALES`: tự động lọc `customer.ownerId == actorId`.
      - `MANAGER`: lấy danh sách `managedUserIds` từ `crmClient` và lọc `customer.ownerId IN (:managedUserIds)`.
      - `ADMIN`: không giới hạn owner.
- Endpoint chi tiết khách hàng (đã có):
  - `POST /customers/{customerId}/cares`: Ghi nhận mới.
  - `GET /customers/{customerId}/cares`: Lấy danh sách chăm sóc của 1 khách hàng.
  - `DELETE /customers/{customerId}/cares/{careId}`: Xóa bản ghi chăm sóc.

### 2.2 Frontend (`FE_Estate_System`)
1. **API Client (`src/features/customers/api.ts`)**:
   - Thêm query hook `useAllCustomerCares(params)` gọi `GET /customers/cares`.
   - Thêm mutation hook `useCreateCustomerCare()` và `useDeleteCustomerCare()`.
2. **Thanh điều hướng (`src/components/layout/nav.tsx` & `paths.ts`)**:
   - `paths.customerCares = '/customer-cares'`
   - Trong nhóm `BÁN HÀNG`: Thêm mục `{ key: paths.customerCares, icon: <HistoryOutlined />, label: 'Nhật ký chăm sóc' }`.
3. **Trang danh sách tổng hợp (`src/features/customers/pages/CustomerCarePage.tsx`)**:
   - Hiển thị KPI cards: Tổng tương tác, Cuộc gọi, Cuộc gặp, Ghi chú & Email.
   - Bộ lọc: Loại tương tác (Tất cả, Cuộc gọi, Gặp mặt, Email, Ghi chú), Ô tìm kiếm theo tên khách / SĐT / nội dung.
   - Bảng danh sách nhật ký kết hợp dạng Timeline trực quan.
   - Nút `+ Ghi nhận chăm sóc` mở modal chọn khách hàng và ghi nội dung.
4. **Modal chi tiết khách hàng (`CustomerDetailModal.tsx`)**:
   - Thay thế khối `<Empty>` bằng component `CustomerCareTimeline` hiển thị các lần tương tác sắp xếp theo thời gian mới nhất.
   - Nút `+ Ghi nhận` mở modal nhanh để ghi log chăm sóc ngay tại chỗ mà không cần rời khỏi màn hình.

## 3. UI/UX Chuẩn Hệ Thống
- Sử dụng màu chủ đạo xanh ngọc lục bảo (`#059669`).
- Status pills cho từng loại chăm sóc:
  - `CALL`: Tím/Xanh dương với icon `<PhoneOutlined />`.
  - `MEETING`: Xanh ngọc với icon `<UserOutlined />`.
  - `EMAIL`: Hổ phách/Vàng với icon `<MailOutlined />`.
  - `NOTE`: Xám đậm với icon `<MessageOutlined />`.
- Phân trang, loading skeleton mượt mà, không giật lag.
