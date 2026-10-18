# Implementation Plan: Chính Sách Bán Hàng & Bảng Xếp Hạng Thi Đua (Phase 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cơ chế Bảng Tính Chiết Khấu Tự Động theo Chính Sách Bán Hàng cho Deal/Hợp đồng BĐS và Bảng Xếp Hạng Thi Đua Sales (Sales Leaderboard & KPI Pacing) chuẩn CRM nội bộ.

**Architecture:**
- Backend Spring Boot (`crm-service`): Cung cấp service tính toán chiết khấu theo chính sách bán hàng (`SalesPolicyService`) và service tổng hợp xếp hạng đua top Sales (`SalesLeaderboardService`).
- Frontend React Vite (`FE_Estate_System`): Tích hợp widget tính giá Net tự động vào `DealFormModal` và nâng cấp trang Bảng Xếp Hạng Vinh Danh Sales (`SalesLeaderboardPage.tsx`) kèm thước đo KPI Pacing.

**Tech Stack:** Java 21, Spring Boot, JPA, JUnit 5, React 19, TypeScript, Ant Design v5, TanStack Query, Playwright.

## Global Constraints
- `crm-service` cấu hình `spring.jpa.hibernate.ddl-auto=validate`. Không thêm cột mới chưa migrate vào entity JPA để tránh crash startup.
- Tuân thủ tiền tệ VND (`formatMoney`), làm tròn số chuẩn theo nghiệp vụ kế toán BĐS.
- Code-first, lazy senior dev: YAGNI, không sinh code thừa.

---

## Tasks Triển Khai (SDD Workflow)

### Task 1: Backend `crm-service` — DTOs & Service Bảng Tính Chiết Khấu Bán Hàng
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/SalesPolicyDtos.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/service/SalesPolicyService.java`
- Create: `services/crm-service/src/test/java/com/estatecrm/crm_service/service/SalesPolicyServiceTests.java`

**Interfaces:**
- `SalesPolicyService.getAvailablePolicies()`: Danh sách các gói chính sách chuẩn (Chuẩn 0%, Nhanh 70% CK 3.5%, Nhanh 95% CK 6.0%, Vay NH HTLS 0%).
- `SalesPolicyService.calculateDiscount(DiscountCalculateRequest)`: Trả về `DiscountCalculateResponse` gồm tỷ lệ chiết khấu, số tiền giảm, giá Net hợp đồng và diễn giải.

- [ ] **Step 1: Viết Unit Test `SalesPolicyServiceTests.java` với các kịch bản tính chiết khấu (thanh toán sớm, mua sỉ, khách cũ, voucher)**
- [ ] **Step 2: Tạo DTOs `SalesPolicyDtos.java`**
- [ ] **Step 3: Triển khai `SalesPolicyService.java` đảm bảo test pass 100%**
- [ ] **Step 4: Chạy test và commit Task 1**

---

### Task 2: Backend `crm-service` — DTOs & Service Bảng Xếp Hạng Thi Đua Sales
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/LeaderboardDtos.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/service/SalesLeaderboardService.java`
- Create: `services/crm-service/src/test/java/com/estatecrm/crm_service/service/SalesLeaderboardServiceTests.java`

**Interfaces:**
- `SalesLeaderboardService.getLeaderboard(period, year, month)`: Tổng hợp số liệu chốt cọc, doanh thu, hoa hồng, phân hạng Podium (Gold, Silver, Bronze, Standard) và KPI Pacing sàn.

- [ ] **Step 1: Viết Unit Test `SalesLeaderboardServiceTests.java` kiểm thử logic sắp xếp rank và tính pacing**
- [ ] **Step 2: Tạo DTOs `LeaderboardDtos.java`**
- [ ] **Step 3: Triển khai `SalesLeaderboardService.java` pass 100%**
- [ ] **Step 4: Chạy test và commit Task 2**

---

### Task 3: Backend `crm-service` — REST Controllers (`SalesPolicyController` & `SalesLeaderboardController`)
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/controller/SalesPolicyController.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/controller/SalesLeaderboardController.java`
- Create: `services/crm-service/src/test/java/com/estatecrm/crm_service/controller/SalesPolicyAndLeaderboardControllerTests.java`

**Interfaces:**
- `GET /api/v1/sales-policies`: Danh sách chính sách bán hàng.
- `POST /api/v1/sales-policies/calculate`: Tính chiết khấu tự động.
- `GET /api/v1/reports/leaderboard`: Dữ liệu bảng xếp hạng thi đua.

- [ ] **Step 1: Viết MockMvc Tests cho các endpoints**
- [ ] **Step 2: Triển khai 2 Controllers với tiền tố URL `/api/v1` chuẩn**
- [ ] **Step 3: Chạy test và commit Task 3**

---

### Task 4: Frontend `FE_Estate_System` — API Clients & Types
**Files:**
- Create: `src/features/policies/api.ts`
- Create: `src/features/reports/leaderboardApi.ts`

- [ ] **Step 1: Định nghĩa TypeScript interfaces cho SalesPolicy, DiscountCalculation và Leaderboard**
- [ ] **Step 2: Viết các hook TanStack Query `useSalesPolicies`, `useCalculateDiscount`, `useSalesLeaderboard`**
- [ ] **Step 3: Chạy typecheck và commit Task 4**

---

### Task 5: Frontend `FE_Estate_System` — Bộ Tính Chiết Khấu & Tích Hợp Vào `DealFormModal.tsx`
**Files:**
- Create: `src/features/policies/components/DiscountCalculatorModal.tsx`
- Modify: `src/features/deals/components/DealFormModal.tsx`

- [ ] **Step 1: Xây dựng modal/widget tính chiết khấu trực quan: chọn gói thanh toán, phụ trội mua sỉ, khách cũ, voucher trừ thẳng**
- [ ] **Step 2: Tích hợp nút "Tính chiết khấu chính sách" cạnh trường Giá trị hợp đồng trong `DealFormModal.tsx`**
- [ ] **Step 3: Khi bấm áp dụng, tự động điền giá Net vào `contractValue` và ghi chú tóm tắt chính sách vào `note`**
- [ ] **Step 4: Chạy typecheck và commit Task 5**

---

### Task 6: Frontend `FE_Estate_System` — Bảng Xếp Hạng Thi Đua Sales & Thước Đo KPI Pacing
**Files:**
- Create: `src/features/reports/pages/SalesLeaderboardPage.tsx`
- Create: `src/features/reports/components/LeaderboardPodium.tsx`
- Create: `src/features/reports/components/KpiPacingCard.tsx`
- Modify: `src/routes/paths.ts`

- [ ] **Step 1: Tạo component bục vinh danh `LeaderboardPodium.tsx` Top 1 (Vàng), Top 2 (Bạc), Top 3 (Đồng)**
- [ ] **Step 2: Tạo thẻ thước đo `KpiPacingCard.tsx` hiển thị tiến độ hoàn thành chỉ tiêu doanh số sàn**
- [ ] **Step 3: Xây dựng trang `SalesLeaderboardPage.tsx` tích hợp bộ lọc kỳ (Tháng này / Quý này / Năm nay) và bảng Top 10**
- [ ] **Step 4: Chạy typecheck và commit Task 6**

---

### Task 7: Kiểm Thử Toàn Diện E2E Bằng Playwright
**Files:**
- Create: `logs/audit-phase8-policy-leaderboard.cjs`

- [ ] **Step 1: Viết kịch bản Playwright kiểm thử 2 luồng:**
  1. Mở form tạo hợp đồng, chọn căn hộ 3.5 tỷ, mở bộ tính chiết khấu chọn Thanh toán sớm 95% (-6%) + Mua sỉ (-1%), xác nhận giá Net 3.255 tỷ được áp vào hợp đồng.
  2. Mở Bảng xếp hạng Sales Leaderboard, xác nhận 3 bục Podium hiển thị Top 3, thanh đo KPI Pacing đạt % chuẩn và bảng xếp hạng chi tiết.
- [ ] **Step 2: Chạy kiểm thử tự động, xuất 5 ảnh audit vào artifact directory**
- [ ] **Step 3: Cập nhật progress ledger và tạo báo cáo tổng kết**
