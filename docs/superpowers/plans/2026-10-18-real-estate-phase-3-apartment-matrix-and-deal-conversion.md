# Giai Đoạn 3: Sơ Đồ Bảng Hàng Matrix Căn Hộ Trực Quan & Luồng Chốt Hợp Đồng (Apartment Matrix & Deal Conversion)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng chế độ xem Bảng hàng Matrix căn hộ trực quan theo Block/Tầng cho nhân viên kinh doanh BĐS và hoàn thiện luồng chuyển đổi từ Giữ chỗ (RESERVED) sang Hợp đồng bán chính thức (`CONVERTED_TO_DEAL` / `SOLD`).

**Architecture:** 
- Backend (`crm-service`): Cập nhật `DealService` để khi hợp đồng được duyệt (`APPROVED`), hệ thống tự động đánh dấu đặt chỗ liên kết thành `CONVERTED_TO_DEAL` và xóa thông tin lock tạm thời trên bảng `products`.
- Frontend (`FE_Estate_System`): Xây dựng component `ProductMatrixView.tsx` hỗ trợ xem sơ đồ tầng/lưới căn hộ trực quan, thanh thống kê tỷ lệ hấp thụ theo block, bộ lọc tầng, và menu tương tác nhanh (Xem chi tiết, Giữ chỗ, Mở khóa, Lên hợp đồng). Bổ sung bộ chuyển đổi giao diện (Table vs Matrix) trên `ProductsPage.tsx`.

**Tech Stack:** Java 21, Spring Boot 3, Spring Data JPA, React 18, TypeScript, Ant Design 5, CSS Grid/Flexbox, Playwright.

## Global Constraints
- Bảng hàng Matrix phải hiển thị trực quan theo cấu trúc Block -> Tầng -> Căn hộ.
- Mã màu chuẩn hóa:
  - 🟢 Xanh lá `#10B981` / `#DCFCE7`: Còn trống (`AVAILABLE`).
  - 🟡 Vàng hổ phách `#F59E0B` / `#FEF3C7`: Đang giữ chỗ (`RESERVED`) kèm hiển thị hạn giữ chỗ.
  - 🔵 Xanh dương `#0284C7` / `#E0F2FE`: Đã bán (`SOLD`).
- Khi duyệt Deal, reservation phải được cập nhật thành `CONVERTED_TO_DEAL`.
- Hoàn toàn tương thích ngược với chế độ xem Bảng (Table View) hiện tại.

---

### Task 1: Backend `crm-service` — Đồng Bộ Chốt Hợp Đồng Khi Duyệt Deal
**Files:**
- Modify: `services/crm-service/src/main/java/com/estatecrm/crm_service/service/DealService.java`
- Modify: `services/crm-service/src/test/java/com/estatecrm/crm_service/service/DealServiceTests.java`

- [ ] **Step 1: Inject `ProductReservationRepository` vào `DealService`**
- [ ] **Step 2: Trong method `syncProductStatus`, khi chuyển sang `ProductStatus.SOLD`:**
  - Tìm active reservation của sản phẩm và cập nhật `status = ReservationStatus.CONVERTED_TO_DEAL`.
  - Reset các trường lock tạm thời: `lockedBy = null`, `lockedCustomerId = null`, `lockExpiresAt = null`, `lockDepositAmount = null`.
- [ ] **Step 3: Cập nhật `DealServiceTests.java` với mock `productReservationRepository` và test case xác nhận reservation đổi thành `CONVERTED_TO_DEAL`**
- [ ] **Step 4: Chạy test `./mvnw test -Dtest=DealServiceTests` pass 100%**
- [ ] **Step 5: Commit git Task 1**

---

### Task 2: Frontend `FE_Estate_System` — Xây Dựng Component Bảng Hàng Matrix Căn Hộ
**Files:**
- Create: `src/features/products/components/ProductMatrixView.tsx`
- Create: `src/features/products/components/ProductMatrixView.css`

- [ ] **Step 1: Thiết kế thuật toán phân nhóm sản phẩm theo Block và Tầng (Floor Parser từ mã căn)**
- [ ] **Step 2: Xây dựng thanh Thống kê Block (Tổng căn, Trống, Đang giữ, Đã bán, Tỷ lệ hấp thụ %) & Thanh chú thích (Legend)**
- [ ] **Step 3: Xây dựng lưới ma trận căn hộ (Matrix Grid): Trục Y là số tầng, Trục X là vị trí căn hộ**
- [ ] **Step 4: Mỗi ô căn hộ hiển thị mã căn, diện tích, giá, màu sắc trạng thái, hạn chót nếu đang giữ chỗ**
- [ ] **Step 5: Thêm Popover / Action Menu khi click vào ô căn hộ (Xem chi tiết, Giữ chỗ, Mở khóa)**

---

### Task 3: Frontend `FE_Estate_System` — Tích Hợp Chế Độ Xem Matrix Vào `ProductsPage.tsx`
**Files:**
- Modify: `src/features/products/pages/ProductsPage.tsx`
- Modify: `src/features/products/pages/ProductsPage.css` (nếu cần)

- [ ] **Step 1: Thêm bộ chuyển đổi chế độ xem (Segmented: Dạng bảng 📋 vs Sơ đồ Matrix 🏢) trên thanh công cụ**
- [ ] **Step 2: Render linh hoạt `ProductTable` hoặc `ProductMatrixView` theo chế độ được chọn**
- [ ] **Step 3: Kết nối các hành động từ Matrix vào Modal Giữ chỗ, Modal Chi tiết và Mở khóa**
- [ ] **Step 4: Kiểm tra `npx tsc --noEmit` và `npm run build` đảm bảo không có lỗi type/bundle**
- [ ] **Step 5: Commit git Task 2 & Task 3**

---

### Task 4: Kiểm Thử Toàn Diện E2E Bằng Playwright
**Files:**
- Create: `audit-phase3-matrix.cjs`

- [ ] **Step 1: Viết kịch bản kiểm thử E2E Playwright:**
  - Đăng nhập Sales, mở `/products`.
  - Chuyển sang chế độ Sơ đồ Matrix (Matrix View).
  - Kiểm tra hiển thị sơ đồ tầng và các ô căn hộ với 3 màu sắc chuẩn (Trống, Giữ chỗ, Đã bán).
  - Bấm Giữ chỗ trực tiếp trên một ô căn hộ trống ở Matrix -> Hoàn tất giữ chỗ -> Căn trên sơ đồ chuyển sang màu Vàng (RESERVED) kèm hạn chót.
  - Bấm Mở khóa trực tiếp từ ô căn hộ -> Xác nhận mở khóa -> Căn trở về màu Xanh lá (AVAILABLE).
  - Chụp ảnh màn hình lưu vào artifact directory.
- [ ] **Step 2: Chạy script Playwright, xác nhận pass 100%**
- [ ] **Step 3: Commit git Task 4 và xuất báo cáo tổng kết**
