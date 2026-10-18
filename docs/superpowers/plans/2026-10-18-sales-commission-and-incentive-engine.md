# Sales Commission & Incentive Engine Implementation Plan (Giai Đoạn 5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai hệ thống Tính Hoa hồng & Thưởng Doanh số Sales (Commission & Incentives) tự động theo tỷ lệ % Dự án và kích hoạt giải ngân theo tiến độ thanh toán thực tế của khách mua căn hộ.

**Architecture:**
- Backend `crm-service` (Spring Boot / JPA / PostgreSQL): Bảng `project_commission_policies`, `deal_commissions`, `deal_commission_milestones`. Logic tự động đối soát tỷ lệ nộp tiền của khách mỗi khi có thanh toán mới trong `deal_payments` để chuyển mốc sang `ELIGIBLE` cho Manager duyệt (`APPROVED`) và kế toán chi trả (`PAID`).
- Frontend `FE_Estate_System` (React 19 / TypeScript / Vite / Ant Design): Trang `/commissions` với 4 thẻ KPIs, tab Bảng kê cá nhân Sales, tab Phê duyệt Manager 1 chạm, tab Thiết lập chính sách dự án; tích hợp khối hoa hồng vào modal chi tiết Hợp đồng.

**Tech Stack:** Java 17, Spring Boot 3, Hibernate JPA, PostgreSQL, React 19, Vite, Ant Design v5, Playwright.

## Global Constraints
- Bảng dữ liệu hoa hồng nằm trong database của `crm-service` (`CRM_DB`).
- Mọi script test phát sinh lưu trong thư mục `logs/` (đã gitignore).
- Giữ vững quy tắc: YAGNI, DRY, TDD, kiểm thử E2E xác minh trước khi hoàn thành.

---

### Task 1: Backend Database Entities, Enums & Repositories (`crm-service`)

**Files:**
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/enums/CommissionStatus.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/enums/CommissionMilestoneStatus.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/entity/ProjectCommissionPolicy.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/entity/DealCommission.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/entity/DealCommissionMilestone.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/repository/ProjectCommissionPolicyRepository.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/repository/DealCommissionRepository.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/repository/DealCommissionMilestoneRepository.java`

**Interfaces:**
- Produces: `DealCommission`, `DealCommissionMilestone`, `ProjectCommissionPolicy` entities and Spring Data repositories.

- [ ] **Step 1: Create Enums `CommissionStatus` & `CommissionMilestoneStatus`**
- [ ] **Step 2: Create Entity `ProjectCommissionPolicy`**
- [ ] **Step 3: Create Entities `DealCommission` & `DealCommissionMilestone`**
- [ ] **Step 4: Create Spring Data Repositories**
- [ ] **Step 5: Verify build with Maven**
- [ ] **Step 6: Commit**

---

### Task 2: Backend Commission Engine, Milestone Sync & Unit Tests (`crm-service`)

**Files:**
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/dto/CommissionDtos.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/service/DealCommissionService.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/test/java/com/estatecrm/crm_service/service/DealCommissionServiceTests.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/service/DealService.java` (trigger create commission on deal approval)

**Interfaces:**
- Consumes: Task 1 entities & repositories.
- Produces: `DealCommissionService.initCommissionForDeal()`, `syncMilestonesFromPayments()`, `approveMilestone()`, `payoutMilestone()`.

- [ ] **Step 1: Write Unit Tests for Commission calculation & Milestone thresholds**
- [ ] **Step 2: Run test to verify failure**
- [ ] **Step 3: Implement `DealCommissionService` with milestone threshold check**
- [ ] **Step 4: Hook into payment creation/approval to trigger `syncMilestonesFromPayments`**
- [ ] **Step 5: Run unit tests to verify 100% pass**
- [ ] **Step 6: Commit**

---

### Task 3: Backend REST Controllers & Policy Management (`crm-service`)

**Files:**
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/controller/CommissionController.java`
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/controller/CommissionPolicyController.java`

**Interfaces:**
- Consumes: `DealCommissionService`, `ProjectCommissionPolicyRepository`.
- Produces: REST Endpoints `/api/v1/commissions/my`, `/api/v1/commissions`, `/api/v1/commissions/milestones/{id}/approve`, `/api/v1/commissions/milestones/{id}/payout`, `/api/v1/projects/{id}/commission-policy`.

- [ ] **Step 1: Implement `CommissionController`**
- [ ] **Step 2: Implement `CommissionPolicyController`**
- [ ] **Step 3: Run Maven compile to verify no syntax or type errors**
- [ ] **Step 4: Commit**

---

### Task 4: Frontend API Client, TypeScript Interfaces & React Query Hooks (`FE_Estate_System`)

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/src/features/commissions/api.ts`
- Modify: `d:/PROJECT/FE_Estate_System/src/routes/paths.ts`

**Interfaces:**
- Produces: `useMyCommissions`, `useAllCommissions`, `useApproveMilestone`, `usePayoutMilestone`, `useProjectCommissionPolicy`, `useUpdateCommissionPolicy`.

- [ ] **Step 1: Define TypeScript types (`DealCommission`, `DealCommissionMilestone`, `CommissionSummaryDto`, `ProjectCommissionPolicy`)**
- [ ] **Step 2: Create React Query hooks**
- [ ] **Step 3: Add `commissions: '/commissions'` to `paths.ts`**
- [ ] **Step 4: Verify frontend typecheck (`npm run build` or `tsc --noEmit`)**
- [ ] **Step 5: Commit**

---

### Task 5: Frontend Commissions Page (`/commissions`) with KPIs & Tabs (`FE_Estate_System`)

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/src/features/commissions/pages/CommissionsPage.tsx`
- Create: `d:/PROJECT/FE_Estate_System/src/features/commissions/pages/CommissionsPage.css`
- Modify: `d:/PROJECT/FE_Estate_System/src/routes/router.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/components/layout/AppSidebar.tsx` (Add menu item under BÁN HÀNG)

**Interfaces:**
- Consumes: Task 4 hooks.
- Produces: Full page with 4 KPI summary cards, Sales Personal Table, Manager Approval Table & Policy Setup Drawer.

- [ ] **Step 1: Build 4 KPI summary header (Tổng dự kiến, Đã nhận, Đủ điều kiện, Chờ khách)**
- [ ] **Step 2: Build Sales Tab (Bảng kê hoa hồng cá nhân + thanh tiến độ giải ngân từng căn)**
- [ ] **Step 3: Build Manager Tab (Duyệt chi 1 chạm cho các mốc `ELIGIBLE`)**
- [ ] **Step 4: Build Policy Tab (Cấu hình % hoa hồng và mốc giải ngân dự án)**
- [ ] **Step 5: Add route in `router.tsx` and sidebar link in `AppSidebar.tsx`**
- [ ] **Step 6: Commit**

---

### Task 6: Frontend Integration into Deal Detail Modal (`FE_Estate_System`)

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/src/features/commissions/components/DealCommissionSection.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/deals/components/DealDetailDrawer.tsx`

**Interfaces:**
- Consumes: `useDealCommission(dealId)`.
- Produces: Compact commission block in Deal Detail Modal.

- [ ] **Step 1: Implement `DealCommissionSection.tsx`**
- [ ] **Step 2: Integrate into `DealDetailDrawer.tsx`**
- [ ] **Step 3: Verify frontend typecheck**
- [ ] **Step 4: Commit**

---

### Task 7: E2E Playwright Audit Verification (`FE_Estate_System`)

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/logs/audit-phase5-commission.cjs`

- [ ] **Step 1: Write Playwright audit script covering 5 steps:**
  1. Mở trang `/commissions` kiểm tra 4 KPIs và danh sách hợp đồng.
  2. Mở chi tiết hợp đồng xem khối hoa hồng (Mốc 1 đang chờ nộp tiền `PENDING_MILESTONE`).
  3. Khách nộp tiền đợt 2 ($\ge 15\%$) $\rightarrow$ Mốc 1 tự chuyển sang `ELIGIBLE`.
  4. Manager thực hiện duyệt mốc $\rightarrow$ Chuyển sang `APPROVED`.
  5. Sàn chi trả mốc $\rightarrow$ Chuyển sang `PAID`, tiền cộng dồn vào KPI "Đã thực nhận".
- [ ] **Step 2: Run Playwright audit and capture 5 screenshots to artifact directory**
- [ ] **Step 3: Verify 100% test pass**
- [ ] **Step 4: Update SDD progress ledger and summary artifact**
- [ ] **Step 5: Commit**
