# Kế Hoạch Triển Khai: Nhật Ký Chăm Sóc Khách Hàng (Sales Role)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai hoàn chỉnh tính năng Nhật ký chăm sóc khách hàng (Customer Care Log) cho vai trò Sales bao gồm trang tổng hợp lịch sử tương tác trên Sidebar và tích hợp trực tiếp Timeline vào Modal chi tiết khách hàng.

**Architecture:** Bổ sung endpoint tổng hợp `GET /customers/cares` có phân quyền dữ liệu theo actorId/ownerId trên Spring Boot `customer-service`. Xây dựng component dùng chung `CustomerCareTimeline` và trang độc lập `CustomerCarePage` trên React/Ant Design, tích hợp form tạo nhanh và thống kê KPI.

**Tech Stack:** Java 21, Spring Boot 3, Spring Data JPA, PostgreSQL, React 18, TypeScript, Vite, Ant Design 5, TanStack Query, Zustand.

## Global Constraints
- Phân quyền nghiêm ngặt: SALES chỉ xem/tạo nhật ký của khách hàng mình phụ trách; MANAGER xem trong phạm vi dự án quản lý; ADMIN xem toàn quyền.
- Tông màu chuẩn: Xanh ngọc lục bảo `#059669`, nền mềm `#f8fafc`.
- Không làm gián đoạn các luồng tương tác hiện tại của khách hàng.
- Tất cả các bước đều có kiểm thử xác thực trước khi kết thúc.

---

### Task 1: Backend `customer-service` — Bổ sung API tổng hợp `GET /customers/cares`

**Files:**
- Modify: `d:/PROJECT/CRM_Estate_System/services/customer-service/src/main/java/com/estatecrm/customer_service/repository/CustomerCareRepository.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/customer-service/src/main/java/com/estatecrm/customer_service/service/CustomerCareService.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/customer-service/src/main/java/com/estatecrm/customer_service/controller/CustomerCareController.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/customer-service/src/main/java/com/estatecrm/customer_service/entity/CustomerCare.java`

**Interfaces:**
- Consumes: `actorId` (UUID) và `role` (String) từ JWT token.
- Produces: `Page<CustomerCareResponse>` tại endpoint `GET /customers/cares?type=&keyword=&page=&size=`.

- [x] **Step 1: Sửa typo `ackage` -> `package` trong các file của `customer-service`**
- [x] **Step 2: Thêm Specification filter trong `CustomerCareRepository` hỗ trợ query theo `ownerId` hoặc danh sách `allowedOwnerIds`, `type` và `keyword` (tên/sđt khách hàng hoặc nội dung care)**
- [x] **Step 3: Thêm method `listAll` trong `CustomerCareService` xử lý phân quyền theo role SALES / MANAGER / ADMIN**
- [x] **Step 4: Mở endpoint `GET /customers/cares` tại `CustomerCareController`**
- [x] **Step 5: Kiểm thử API bằng script PowerShell với token SALES và ADMIN, xác nhận trả về mã 200 OK đúng danh sách**

---

### Task 2: Frontend — Định nghĩa API Types, Hooks & Định Tuyến

**Files:**
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/api.ts`
- Modify: `d:/PROJECT/FE_Estate_System/src/routes/paths.ts`
- Modify: `d:/PROJECT/FE_Estate_System/src/routes/router.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/components/layout/nav.tsx`

**Interfaces:**
- Consumes: Endpoint `GET /customers/cares` và `POST /customers/{id}/cares`.
- Produces: `useAllCustomerCares`, `useCareMutations`, đường dẫn `paths.customerCares` và mục menu `Nhật ký chăm sóc` trong nhóm `BÁN HÀNG`.

- [x] **Step 1: Thêm type `CustomerCareItem`, params `AllCareFilters` và hooks `useAllCustomerCares` trong `api.ts`**
- [x] **Step 2: Khai báo `customerCares: '/customer-cares'` trong `paths.ts`**
- [x] **Step 3: Thêm route `/customer-cares` vào `router.tsx` được bảo vệ với `allowedRoles: ['ADMIN', 'MANAGER', 'SALES']`**
- [x] **Step 4: Bổ sung mục `Nhật ký chăm sóc` (icon `<HistoryOutlined />`) vào danh sách menu `BÁN HÀNG` trong `nav.tsx`**
- [x] **Step 5: Chạy type-check để đảm bảo router và nav không có lỗi TypeScript**

---

### Task 3: Reusable Component `CustomerCareTimeline` & Tích hợp vào `CustomerDetailModal`

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/src/features/customers/components/CustomerCareTimeline.tsx`
- Create: `d:/PROJECT/FE_Estate_System/src/features/customers/components/CustomerCareTimeline.css`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/components/CustomerDetailModal.tsx`

**Interfaces:**
- Consumes: `customerId: string`, danh sách `cares` từ `useCustomerCares(customerId)`.
- Produces: Component hiển thị timeline tương tác chuyên nghiệp có filter loại (Gọi điện, Gặp mặt, Email, Ghi chú), nút thêm nhanh và popup xác nhận xóa.

- [x] **Step 1: Tạo component `CustomerCareTimeline.tsx` với icon cho từng loại CareType (`CALL`, `MEETING`, `EMAIL`, `NOTE`), hiển thị thời gian tương đối (`fromNow()`) và tên nhân viên phụ trách**
- [x] **Step 2: Tạo Modal/Form ghi nhận chăm sóc nhanh ngay trong component (`CreateCareModal`)**
- [x] **Step 3: Tích hợp `CustomerCareTimeline` vào `CustomerDetailModal.tsx` thay thế thẻ Card Empty trước đây**
- [x] **Step 4: Kiểm tra hiển thị và thao tác thêm ghi chép chăm sóc trực tiếp từ Modal khách hàng**

---

### Task 4: Xây dựng Trang Tổng Hợp `CustomerCarePage` Cho Sales

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/src/features/customers/pages/CustomerCarePage.tsx`
- Create: `d:/PROJECT/FE_Estate_System/src/features/customers/pages/CustomerCarePage.css`

**Interfaces:**
- Consumes: `useAllCustomerCares`, `useCustomers`.
- Produces: Màn hình độc lập tại `/customer-cares` hiển thị toàn bộ hoạt động tương tác của Sales.

- [x] **Step 1: Thiết kế giao diện KPI Cards đầu trang: Tổng lượt chăm sóc, Cuộc gọi, Cuộc gặp gỡ, Ghi chú & Email**
- [x] **Step 2: Xây dựng thanh công cụ lọc: Lọc theo loại tương tác, khoảng thời gian (DatePicker), tìm kiếm theo tên khách/SĐT/nội dung**
- [x] **Step 3: Xây dựng bảng danh sách nhật ký kết hợp Timeline view, hiển thị mã khách hàng, tên khách hàng có thể click mở modal chi tiết**
- [x] **Step 4: Thêm nút `+ Ghi nhận chăm sóc` đầu trang cho phép chọn khách hàng từ danh sách của Sales và nhập nội dung**
- [x] **Step 5: Gắn trang `CustomerCarePage` vào `router.tsx`**

---

### Task 5: Kiểm Thử Toàn Diện & Tối Ưu UI/UX

**Files:**
- Test script: `d:/PROJECT/FE_Estate_System/audit-care.cjs`

- [x] **Step 1: Biên dịch toàn bộ Frontend bằng `cmd /c npm run build` đảm bảo không có lỗi bundle/TypeScript**
- [x] **Step 2: Chạy script tự động Playwright đăng nhập với vai trò SALES (`demo1`) và thực hiện:**
  - Truy cập menu `Nhật ký chăm sóc` (`/customer-cares`)
  - Kiểm tra các thẻ KPI và bảng hiển thị
  - Tạo thử 1 bản ghi chăm sóc mới
  - Mở Modal chi tiết khách hàng và xác nhận timeline hiển thị đúng bản ghi vừa tạo
- [x] **Step 3: Chụp ảnh màn hình lưu vào artifacts và báo cáo kết quả**
