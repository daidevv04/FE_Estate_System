# Kế Hoạch Triển Khai Giai Đoạn 1: Chuẩn Hóa Nghiệp Vụ Bất Động Sản (Lead & Bán Căn)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chuẩn hóa logic bán Bất động sản nội bộ: Cho phép Sales tạo Lead linh hoạt theo Dự án mà chưa cần chốt ngay mã căn (nullable productId, bắt buộc projectId, ghi chú nhu cầu), và tự động đồng bộ trạng thái sản phẩm sang SOLD khi hợp đồng (Deal) được duyệt APPROVED, ngăn chặn bán trùng căn.

**Architecture:** 
- Backend `crm-service`: Bổ sung migration Flyway `V5` cho bảng `leads`, cập nhật Entity `Lead`, các DTO (`CreateLeadRequest`, `LeadResponse`, `UpdateLeadRequest`), logic phân quyền và xác thực trong `LeadService`. Cập nhật `DealService` kiểm tra ràng buộc mã căn và trạng thái `SOLD` khi tạo/duyệt/hủy hợp đồng.
- Frontend `FE_Estate_System`: Cập nhật Types trong `api.ts`, nâng cấp `LeadFormModal` với lựa chọn Dự án trước (bắt buộc) rồi lọc mã căn tương ứng (tùy chọn) và vùng nhập Nhu cầu khách hàng. Cập nhật thẻ Kanban `LeadCard`, bảng `LeadsPage` và trang `LeadDetailPage`.
- Testing: Unit test JUnit/Mockito cho `LeadServiceTests`, `DealServiceTests`, build verification `npm run build` và E2E script với Playwright.

**Tech Stack:** Java 21, Spring Boot 3, Spring Data JPA, PostgreSQL, Flyway, React 18, TypeScript, Vite, Ant Design 5, TanStack Query, Playwright.

## Global Constraints
- Tính tương thích ngược: Các Lead cũ đã có trong cơ sở dữ liệu phải được tự động backfill `project_id` từ sản phẩm đang liên kết.
- Ràng buộc nghiệp vụ chốt cọc/bán: Không cho phép tạo Hợp đồng (Deal) nếu Lead chưa được gán mã căn cụ thể (`productId != null`).
- Ràng buộc độc quyền căn: Không thể tạo hợp đồng hoặc duyệt hợp đồng cho căn nhà đã ở trạng thái `SOLD`.
- Quy chuẩn hiển thị: Khi Lead chưa chọn căn, giao diện hiển thị tên Dự án kèm nhãn "Chưa gán căn" hoặc tóm tắt nhu cầu, không bao giờ bị lỗi crash JavaScript do `slice` trên `null`.
- TDD & Kiểm thử nghiêm ngặt: Mỗi task đều phải chạy test xác thực trước khi commit git.

---

### Task 1: Backend `crm-service` — Migration V5 & Cập nhật Entity, DTO, Service cho Lead

**Files:**
- Create: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/resources/db/migration/V5__alter_lead_project_and_nullable_product.sql`
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/entity/Lead.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/dto/CreateLeadRequest.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/dto/UpdateLeadRequest.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/dto/LeadResponse.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/repository/LeadRepository.java`
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/service/LeadService.java`
- Test: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/test/java/com/estatecrm/crm_service/service/LeadServiceTests.java`

**Interfaces:**
- Consumes: `CreateLeadRequest(customerId, projectId, productId, demandNotes, stage, expectedValue, closeDate, assignedTo)`
- Produces: `LeadResponse` chứa `projectId`, `productId` (có thể null), `demandNotes`.

- [x] **Step 1: Tạo file migration `V5__alter_lead_project_and_nullable_product.sql`**
- [x] **Step 2: Cập nhật Entity `Lead.java` với trường `projectId` và `demandNotes`, cho phép `productId` nullable**
- [x] **Step 3: Cập nhật DTO `CreateLeadRequest`, `UpdateLeadRequest`, `LeadResponse`**
- [x] **Step 4: Cập nhật `LeadRepository.java` hỗ trợ query và filter theo `projectId`**
- [x] **Step 5: Cập nhật `LeadService.java`: validate `projectId`, cho phép `productId` là null hoặc kiểm tra thuộc đúng dự án**
- [x] **Step 6: Cập nhật và bổ sung unit test `LeadServiceTests.java` (test tạo lead không có product, test tạo lead với product khác dự án)**
- [x] **Step 7: Chạy `mvn test -Dtest=LeadServiceTests` xác nhận pass toàn bộ và commit git**

---

### Task 2: Backend `crm-service` — Ràng Buộc Hợp Đồng & Tự Động Đồng Bộ Trạng Thái Căn SOLD

**Files:**
- Modify: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/main/java/com/estatecrm/crm_service/service/DealService.java`
- Test: `d:/PROJECT/CRM_Estate_System/services/crm-service/src/test/java/com/estatecrm/crm_service/service/DealServiceTests.java`

**Interfaces:**
- Consumes: `CreateDealRequest`, `UpdateDealRequest` với `approvalStatus`
- Produces: Cập nhật `Product.status = ProductStatus.SOLD` khi `approvalStatus == APPROVED`; hoàn trả về `AVAILABLE` khi hợp đồng bị `REJECTED` hoặc `CANCELLED` hoặc bị xóa.

- [x] **Step 1: Viết test failing trong `DealServiceTests.java` kiểm tra việc chuyển `ProductStatus.SOLD` khi Deal duyệt `APPROVED` và chặn tạo Deal nếu Lead chưa có `productId`**
- [x] **Step 2: Cập nhật `DealService.create`: Kiểm tra `lead.getProductId() != null` và kiểm tra sản phẩm chưa bị `SOLD`**
- [x] **Step 3: Cập nhật `DealService.update`: Xử lý chuyển `product.setStatus(ProductStatus.SOLD)` khi `request.approvalStatus() == ApprovalStatus.APPROVED`**
- [x] **Step 4: Xử lý revert trạng thái sản phẩm về `AVAILABLE` khi Deal bị chuyển sang `REJECTED` hoặc `CANCELLED` hoặc bị xóa**
- [x] **Step 5: Chạy `mvn test -Dtest=DealServiceTests` xác nhận 100% test pass và commit git**

---

### Task 3: Frontend `FE_Estate_System` — Cập Nhật API Types & Giao Diện Lead

**Files:**
- Modify: `d:/PROJECT/FE_Estate_System/src/features/leads/api.ts`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/leads/components/LeadFormModal.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/leads/components/LeadCard.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/leads/pages/LeadsPage.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/leads/pages/LeadDetailPage.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/deals/pages/DealsPage.tsx`

**Interfaces:**
- Consumes: Cấu trúc Lead mới có `projectId`, `productId?: string | null`, `demandNotes?: string | null`
- Produces: Form tạo lead chọn Dự án trước, mã căn lọc theo dự án (tùy chọn), nhập ghi chú nhu cầu; Kanban card và Table hiển thị an toàn không crash.

- [x] **Step 1: Cập nhật interfaces `Lead`, `LeadInput` trong `src/features/leads/api.ts`**
- [x] **Step 2: Cập nhật `LeadFormModal.tsx` thêm chọn Dự án (bắt buộc), lọc danh sách Căn theo dự án (tùy chọn để trống) và ô nhập Nhu cầu khách hàng**
- [x] **Step 3: Sửa `productLabel` trong `LeadCard.tsx`, `LeadsPage.tsx`, `DealsPage.tsx` và thông tin chi tiết trong `LeadDetailPage.tsx` phòng chống null pointer**
- [x] **Step 4: Chạy `cmd /c npm run build` kiểm tra typecheck và bundle sạch 100% và commit git**

---

### Task 4: Kiểm Thử Toàn Diện & Kịch Bản E2E Playwright

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/audit-phase1.cjs`

**Interfaces:**
- Consumes: API backend và ứng dụng frontend Vite trên port 5173
- Produces: Báo cáo kiểm thử tự động xác minh:
  1. Tạo lead mới không chọn căn (chỉ chọn dự án và nhập nhu cầu) $\rightarrow$ thành công, hiển thị đúng trên Kanban và Table.
  2. Tạo hợp đồng cho lead đã có căn $\rightarrow$ duyệt hợp đồng $\rightarrow$ sản phẩm chuyển sang SOLD trên bảng hàng.

- [x] **Step 1: Viết script `audit-phase1.cjs` kiểm thử luồng tạo Lead không gán căn và kiểm tra phản ứng bảng hàng**
- [x] **Step 2: Chạy script Playwright, ghi nhận kết quả và chụp screenshot**
- [x] **Step 3: Cập nhật progress ledger và hoàn tất Giai đoạn 1**
