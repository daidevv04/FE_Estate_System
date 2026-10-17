# Giai Đoạn 2: Cơ Chế Giữ Chỗ & Khóa Căn Theo Ngày (Product Lock & Reservation)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng tính năng Giữ chỗ / Khóa căn tính theo Ngày cho Sales trên bảng hàng, hỗ trợ đặt cọc booking, tự động nhả căn khi hết hạn, cho phép Sales hoặc Manager mở khóa.

**Architecture:** 
- Backend (`crm-service`): Cập nhật `Product` entity (chứa snapshot `lockedBy`, `lockedCustomerId`, `lockExpiresAt`, `lockDepositAmount` để query nhanh), thêm entity `ProductReservation` lưu lịch sử và danh sách giữ chỗ. Cung cấp API `/api/products/{id}/lock` và `/api/products/{id}/unlock`, cùng scheduled job quét giải phóng căn quá hạn.
- Frontend (`FE_Estate_System`): Bổ sung action "Giữ chỗ" (modal chọn ngày hết hạn, tiền cọc) và "Mở khóa" trên danh sách sản phẩm/matrix, hiển thị badge hạn giữ chỗ.

**Tech Stack:** Java 21, Spring Boot 3, Spring Data JPA, PostgreSQL, React 18, TypeScript, TailwindCSS, Playwright.

## Global Constraints
- Khóa căn tính theo **NGÀY** (`LocalDate`), không tính theo phút/giờ.
- Trạng thái căn khi khóa chuyển sang `RESERVED`.
- Căn `RESERVED` không được phép bán (chặn ở Deal creation).
- Sales giữ căn hoặc Manager/Admin được quyền Mở khóa (`unlock`).
- Giữ nguyên toàn bộ cấu trúc dự án hiện tại, không cài thêm thư viện ngoài không cần thiết.

---

### Task 1: Backend `crm-service` — Entity, Enum & Repository cho Giữ Chỗ
**Files:**
- Modify: `services/crm-service/src/main/java/com/estatecrm/crm_service/entity/Product.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/enums/ReservationStatus.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/entity/ProductReservation.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/repository/ProductReservationRepository.java`
- Test: `services/crm-service/src/test/java/com/estatecrm/crm_service/repository/ProductReservationRepositoryTest.java` (hoặc kiểm tra JPA mapping)

- [ ] **Step 1: Tạo Enum `ReservationStatus` (`ACTIVE`, `EXPIRED`, `CANCELLED`, `CONVERTED_TO_DEAL`)**
- [ ] **Step 2: Cập nhật Entity `Product` thêm 4 trường: `lockedBy`, `lockedCustomerId`, `lockExpiresAt`, `lockDepositAmount`**
- [ ] **Step 3: Tạo Entity `ProductReservation` ánh xạ bảng `product_reservations`**
- [ ] **Step 4: Tạo `ProductReservationRepository` với các query tìm active reservation theo productId**
- [ ] **Step 5: Chạy unit test / compile build để verify**

---

### Task 2: Backend `crm-service` — DTOs, Service & Controller (Lock, Unlock, Auto-release)
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/LockProductRequest.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/ProductReservationResponse.java`
- Modify/Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/service/ProductReservationService.java`
- Modify: `services/crm-service/src/main/java/com/estatecrm/crm_service/controller/ProductController.java`
- Test: `services/crm-service/src/test/java/com/estatecrm/crm_service/service/ProductReservationServiceTest.java`

- [ ] **Step 1: Viết test case service lock căn (đổi status RESERVED, lưu reservation)**
- [ ] **Step 2: Viết test case service unlock căn (đổi status về AVAILABLE, cập nhật reservation CANCELLED)**
- [ ] **Step 3: Triển khai logic trong `ProductReservationService`**
- [ ] **Step 4: Thêm `@Scheduled` job tự động nhả các căn có `lockExpiresAt < LocalDate.now()`**
- [ ] **Step 5: Expose endpoints: `POST /api/products/{id}/lock` & `POST /api/products/{id}/unlock`**
- [ ] **Step 6: Chạy test service và build pass 100%**

---

### Task 3: Frontend `FE_Estate_System` — UI Giữ Chỗ & Mở Khóa Căn
**Files:**
- Modify: `src/features/products/types.ts` (hoặc types chung)
- Modify: `src/features/products/api/productsApi.ts`
- Create/Modify: `src/features/products/components/ProductLockModal.tsx`
- Modify: `src/features/products/pages/ProductsPage.tsx` (hoặc component bảng hàng sản phẩm)

- [ ] **Step 1: Cập nhật TypeScript interface Product thêm các trường lock**
- [ ] **Step 2: Thêm hàm gọi API `lockProduct` và `unlockProduct`**
- [ ] **Step 3: Tạo Modal `ProductLockModal` cho Sales chọn ngày hết hạn (1-3 ngày hoặc chọn lịch) và nhập tiền cọc**
- [ ] **Step 4: Thêm nút "Giữ chỗ" (cho căn AVAILABLE) và "Mở khóa" (cho căn RESERVED)**
- [ ] **Step 5: Hiển thị badge trực quan: "ĐANG GIỮ ĐẾN dd/MM/yyyy"**
- [ ] **Step 6: Chạy `npm run build` kiểm tra typecheck và build frontend**

---

### Task 4: Kiểm Thử Toàn Diện E2E Bằng Playwright
**Files:**
- Create: `audit-phase2-lock.cjs`

- [ ] **Step 1: Viết kịch bản test Playwright:**
  - Login tài khoản Sales / Admin
  - Mở trang Quản lý Sản phẩm / Bảng hàng
  - Tìm căn đang `AVAILABLE` -> bấm "Giữ chỗ" -> chọn hạn 2 ngày -> Xác nhận
  - Verify căn chuyển sang `RESERVED` kèm badge hạn giữ chỗ
  - Bấm "Mở khóa" -> Xác nhận hủy giữ chỗ
  - Verify căn trả về `AVAILABLE`
- [ ] **Step 2: Chạy script Playwright, ghi log và chụp ảnh màn hình minh chứng**
