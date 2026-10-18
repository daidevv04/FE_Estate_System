# Kế Hoạch Triển Khai Giai Đoạn 6: Xuất Hồ Sơ & Văn Bản BĐS Tự Động (PDF Generator)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống tự động sinh và in ấn/xuất PDF 3 mẫu văn bản BĐS chuẩn (Phiếu đặt cọc, Phiếu thu tiền từng đợt, Bảng tiến độ thanh toán) trực tiếp từ dữ liệu hợp đồng CRM.

**Architecture:** Backend `crm-service` cung cấp API tổng hợp dữ liệu pháp lý và giao dịch (`/deals/{id}/print-data`). Frontend `FE_Estate_System` dựng modal xem trước khổ A4, engine chuyển số thành chữ tiếng Việt, watermark con dấu chìm, mã QR tra cứu và bộ style in ấn `@media print` chuyên dụng.

**Tech Stack:** Java 17, Spring Boot 3.4, React 19, TypeScript, Ant Design v5, CSS Print Styles, Playwright.

## Global Constraints
- Không dùng placeholder (TODO, TBD). Mọi đoạn code phải hoàn chỉnh.
- Mọi file log/test/audit phải đặt trong thư mục `logs/` (đã gitignore).
- Lệnh npm trên Windows PowerShell chạy qua `cmd.exe /c npm ...`.

---

### Task 1: Backend `crm-service` — DTOs & Service Tổng Hợp Dữ Liệu In Ấn
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/dto/DealPrintDataResponse.java`
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/service/DealDocumentService.java`
- Test: `services/crm-service/src/test/java/com/estatecrm/crm_service/service/DealDocumentServiceTests.java`

- [ ] **Step 1: Viết Unit Test kiểm tra tổng hợp dữ liệu in ấn**
- [ ] **Step 2: Chạy test để xác nhận fail**
- [ ] **Step 3: Tạo DTOs `DealPrintDataResponse` và implement `DealDocumentService`**
- [ ] **Step 4: Chạy test để xác nhận pass 100%**
- [ ] **Step 5: Commit Task 1**

---

### Task 2: Backend `crm-service` — REST Controller `DealDocumentController`
**Files:**
- Create: `services/crm-service/src/main/java/com/estatecrm/crm_service/controller/DealDocumentController.java`
- Test: `services/crm-service/src/test/java/com/estatecrm/crm_service/controller/DealDocumentControllerTests.java`

- [ ] **Step 1: Viết test controller endpoint `GET /api/v1/deals/{id}/print-data`**
- [ ] **Step 2: Viết implementation `DealDocumentController`**
- [ ] **Step 3: Chạy test compile toàn bộ backend**
- [ ] **Step 4: Commit Task 2**

---

### Task 3: Frontend `FE_Estate_System` — API Client & Chuyển Số Thành Chữ Tiếng Việt
**Files:**
- Create: `src/features/documents/api.ts`
- Create: `src/features/documents/utils/numberToVietnameseWords.ts`
- Test: `src/features/documents/utils/numberToVietnameseWords.test.ts` (hoặc kiểm tra hàm độc lập)

- [ ] **Step 1: Định nghĩa types và hook `useDealPrintData`**
- [ ] **Step 2: Viết thuật toán `numberToVietnameseWords(number)` (hỗ trợ hàng triệu, tỷ, đồng chẵn)**
- [ ] **Step 3: Chạy typecheck xác nhận không lỗi**
- [ ] **Step 4: Commit Task 3**

---

### Task 4: Frontend `FE_Estate_System` — CSS In Khổ A4 & 3 Templates Văn Bản
**Files:**
- Create: `src/features/documents/styles/documentPrint.css`
- Create: `src/features/documents/components/templates/DepositAgreementTemplate.tsx`
- Create: `src/features/documents/components/templates/PaymentReceiptTemplate.tsx`
- Create: `src/features/documents/components/templates/PaymentScheduleTemplate.tsx`

- [ ] **Step 1: Tạo CSS chuẩn A4 dọc (210mm x 297mm), căn lề 15mm, watermark con dấu chìm "ĐÃ THU TIỀN"**
- [ ] **Step 2: Tạo template Mẫu 1: Phiếu đăng ký đặt cọc căn hộ**
- [ ] **Step 3: Tạo template Mẫu 2: Biên nhận / Phiếu thu tiền từng đợt kèm mã QR**
- [ ] **Step 4: Tạo template Mẫu 3: Bảng kế hoạch tiến độ thanh toán 7 đợt**
- [ ] **Step 5: Chạy typecheck và commit Task 4**

---

### Task 5: Frontend `FE_Estate_System` — Modal Xem Trước & Thao Tác In (`PrintPreviewModal`)
**Files:**
- Create: `src/features/documents/components/PrintPreviewModal.tsx`
- Create: `src/features/documents/components/PrintPreviewModal.css`

- [ ] **Step 1: Tạo `PrintPreviewModal` có thanh công cụ chọn 3 mẫu văn bản**
- [ ] **Step 2: Thêm nút "In tài liệu" kích hoạt `window.print()` và xem trước thực tế**
- [ ] **Step 3: Chạy typecheck và commit Task 5**

---

### Task 6: Frontend `FE_Estate_System` — Tích Hợp Vào Deal Detail Modal & Page
**Files:**
- Modify: `src/features/deals/components/DealDetailDrawer.tsx`
- Modify: `src/features/deals/pages/DealDetailPage.tsx`

- [ ] **Step 1: Thêm nút "In hồ sơ & Phiếu cọc" vào header/footer của `DealDetailDrawer`**
- [ ] **Step 2: Thêm nút in phiếu thu tiền nhanh trên từng hàng thanh toán**
- [ ] **Step 3: Tích hợp vào `DealDetailPage`**
- [ ] **Step 4: Chạy typecheck và commit Task 6**

---

### Task 7: Kiểm Thử Toàn Diện E2E Bằng Playwright
**Files:**
- Create: `logs/audit-phase6-document-print.cjs`

- [ ] **Step 1: Viết kịch bản Playwright mở Deal, mở Modal In, kiểm tra 3 mẫu, watermark, mã QR và nút print**
- [ ] **Step 2: Chạy kiểm thử tự động, xuất 5 ảnh audit vào thư mục artifact**
- [ ] **Step 3: Cập nhật progress ledger và tạo báo cáo tổng kết**
