# Implementation Plan: Quản Lý Công Nợ & Cảnh Báo Nhắc Nộp Tiền (Debt Aging & Payment Reminder)

## User Intent & Requirements
- **Mục tiêu**: Xây dựng hệ thống quản lý công nợ khách hàng mua BĐS theo từng đợt thanh toán, phân loại tuổi nợ (Debt Aging), và gửi thông báo nhắc nộp tiền tức thì cho Sales phụ trách (kênh In-app SSE và Email Gmail khi tài khoản đã xác thực).
- **Phạm vi triển khai**:
  - Backend: `CRM_Estate_System/services/crm-service`
  - Frontend: `FE_Estate_System`

---

## Danh Sách Tasks Triển Khai (SDD Workflow)

### Task 1: Backend `crm-service` — DTOs & Service Phân Loại Tuổi Nợ
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/DebtAgingItemResponse.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/DebtAgingSummaryResponse.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/RemindPaymentRequest.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/RemindPaymentResponse.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/service/DebtAgingService.java`
- Create: `services/crm-service/src/test/java/com/estatecrm/crm_service/service/DebtAgingServiceTests.java`

- [ ] **Step 1: Tạo các DTOs cho Debt Aging Summary và Reminder**
- [ ] **Step 2: Viết DebtAgingService với thuật toán phân loại Aging Bucket (DUE_SOON, OVERDUE_1_30, OVERDUE_31_60, OVERDUE_60_PLUS)**
- [ ] **Step 3: Viết Unit Tests kiểm thử logic tính tiền còn lại và phân loại mốc ngày**
- [ ] **Step 4: Chạy test và commit Task 1**

---

### Task 2: Backend `crm-service` — REST Controller `DebtAgingController`
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/controller/DebtAgingController.java`
- Create: `services/crm-service/src/test/java/com/estatecrm/crm_service/controller/DebtAgingControllerTests.java`

- [ ] **Step 1: Thêm endpoint `GET /api/v1/deals/debt-aging`**
- [ ] **Step 2: Thêm endpoint `POST /api/v1/deals/schedules/{scheduleId}/remind`**
- [ ] **Step 3: Viết Unit Tests MockMvc kiểm thử phân quyền và kết quả trả về**
- [ ] **Step 4: Chạy test và commit Task 2**

---

### Task 3: Frontend `FE_Estate_System` — API Client & Types
**Files:**
- Create: `src/features/debt/api.ts`

- [ ] **Step 1: Định nghĩa TypeScript interfaces cho Debt Aging Item, Summary và Reminder**
- [ ] **Step 2: Viết hooks React Query `useDebtAgingSummary` và mutation `useRemindPayment`**
- [ ] **Step 3: Chạy typecheck xác nhận không lỗi**
- [ ] **Step 4: Commit Task 3**

---

### Task 4: Frontend `FE_Estate_System` — Thẻ KPI Dòng Tiền & Công Nợ
**Files:**
- Create: `src/features/debt/components/DebtKpiCards.tsx`

- [ ] **Step 1: Thiết kế 4 thẻ KPI chuẩn thiết kế DXMT tokens (Tổng nợ, Thu trong tháng, Sắp đến hạn <= 7 ngày, Quá hạn nộp tiền)**
- [ ] **Step 2: Chạy typecheck và commit Task 4**

---

### Task 5: Frontend `FE_Estate_System` — Bảng Danh Sách Công Nợ & Modal Nhắc Nợ
**Files:**
- Create: `src/features/debt/components/RemindPaymentModal.tsx`
- Create: `src/features/debt/components/DebtAgingTable.tsx`
- Create: `src/features/debt/components/DebtAgingTable.css`

- [ ] **Step 1: Tạo modal xem trước nội dung nhắc nợ (khách hàng, số tiền, hạn nộp, tài khoản CĐT, ghi chú)**
- [ ] **Step 2: Tạo bảng danh sách công nợ với thanh filter theo tuổi nợ, tìm kiếm, và nút "Nhắc nộp tiền"**
- [ ] **Step 3: Chạy typecheck và commit Task 5**

---

### Task 6: Frontend `FE_Estate_System` — Tích Hợp Tab Công Nợ Vào `DealsPage`
**Files:**
- Modify: `src/features/deals/pages/DealsPage.tsx`
- Modify: `src/routes/paths.ts`

- [ ] **Step 1: Thêm tab chuyển đổi giữa "Danh Sách Hợp Đồng" và "Công Nợ & Dòng Tiền" trên `DealsPage.tsx`**
- [ ] **Step 2: Thêm liên kết mở nhanh từ Bảng công nợ sang Modal chi tiết hợp đồng**
- [ ] **Step 3: Chạy typecheck và commit Task 6**

---

### Task 7: Kiểm Thử Toàn Diện E2E Bằng Playwright
**Files:**
- Create: `logs/audit-phase7-debt-aging.cjs`

- [ ] **Step 1: Viết kịch bản Playwright mở tab Công nợ & Dòng tiền, kiểm tra 4 KPI Cards, lọc danh sách theo bucket, mở modal nhắc nợ và gửi thành công**
- [ ] **Step 2: Chạy kiểm thử tự động, xuất 5 ảnh audit vào thư mục artifact**
- [ ] **Step 3: Cập nhật progress ledger và tạo báo cáo tổng kết**
