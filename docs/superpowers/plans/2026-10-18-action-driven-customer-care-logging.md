# Kế Hoạch Triển Khai: Nhật Ký Chăm Sóc Theo Hành Vi Thực Tế (Action-Driven Customer Care)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai cơ chế tự động ghi nhật ký chăm sóc (Customer Care Log) gắn liền 100% với hành vi thực tế của Sales (Gọi điện phân biệt Mobile/Desktop, Gửi email, Đặt lịch hẹn gặp mặt 2 chiều, Ô ghi chú hành động tiếp theo cho Sales), loại bỏ hoàn toàn các log ảo.

**Architecture:** 
- Frontend xây dựng các Action Handler thông minh:
  - Phone Click: Nhận diện thiết bị (Mobile gọi trực tiếp `tel:`, Desktop mở Popup sao chép & ghi nhận kết quả cuộc gọi thực tế).
  - Email Click: Gửi email đồng thời tự động ghi nhận log `EMAIL`.
  - Meeting Action: Modal đặt lịch hẹn cụ thể (ngày giờ, địa điểm) 2 chiều (từ Khách hàng -> Lịch và từ Lịch -> Khách hàng) và tự động ghi log `MEETING`.
  - Sales Next Action: Thêm cột ô ghi chú ở cuối bảng khách hàng cho role Sales, hỗ trợ ghi nhanh kế hoạch cần làm với khách và tự động ghi log `NOTE`.
- Backend tận dụng API hiện hữu `POST /customers/{customerId}/cares` và `GET /customers/cares` trong `customer-service`.

**Tech Stack:** React 19, TypeScript, Ant Design 5, TanStack Query, Zustand, Spring Boot 3 / PostgreSQL.

## Global Constraints
- Log phải phản ánh đúng hành động thật của người dùng, không sinh dữ liệu giả lập.
- Mobile: Dùng `window.location.href = 'tel:...'` cho cuộc gọi; Desktop: Mở modal tương tác có form ghi kết quả.
- Role Sales: Cột ghi chú hành động tiếp theo hiển thị nổi bật, dễ thao tác inline.
- Toàn bộ code mới phải pass 100% typecheck và không có lỗi TypeScript.

---

### Task 1: Bộ Tiện Ích Thiết Bị & Modal Hành Động Cuộc Gọi (`QuickCallActionModal`)

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/src/lib/device.ts`
- Create: `d:/PROJECT/FE_Estate_System/src/features/customers/components/QuickCallActionModal.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/pages/CustomersPage.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/components/CustomerDetailModal.tsx`

**Interfaces:**
- Consumes: `Customer` object, `phone` string.
- Produces: `isMobileDevice(): boolean`, modal gọi điện và ghi nhận log `CALL` qua `POST /customers/{id}/cares`.

- [ ] **Step 1: Viết module kiểm tra thiết bị `device.ts` (Mobile vs Desktop/Laptop)**
- [ ] **Step 2: Viết component `QuickCallActionModal.tsx`:**
  - Nếu Mobile: gọi `tel:${phone}` kèm thông báo hỏi xác nhận lưu kết quả cuộc gọi.
  - Nếu Desktop/Laptop: hiển thị số to, nút copy nhanh, form chọn kết quả (Nghe máy, Thuê bao/Bận, Hẹn gọi lại) + ghi chú nội dung.
- [ ] **Step 3: Gắn sự kiện click vào số điện thoại trong `CustomersPage.tsx` và `CustomerDetailModal.tsx` mở `QuickCallActionModal`**
- [ ] **Step 4: Kiểm tra build TypeScript `npm run build`**

---

### Task 2: Hành Động Gửi Email & Tự Động Ghi Log Chăm Sóc (`QuickEmailAction`)

**Files:**
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/components/SendCustomerEmailModal.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/pages/CustomersPage.tsx`

**Interfaces:**
- Consumes: `customer.email`, `subject`, `body`.
- Produces: Gửi email và đảm bảo ghi nhận log `type: 'EMAIL'` vào lịch sử chăm sóc khách hàng.

- [ ] **Step 1: Kiểm tra và hoàn thiện callback sau khi gửi email trong `SendCustomerEmailModal.tsx` để tự động tạo log `EMAIL` nếu chưa có**
- [ ] **Step 2: Cho phép bấm trực tiếp vào địa chỉ email của khách hàng để mở modal gửi email hoặc `mailto:` kèm tự động ghi nhận log**
- [ ] **Step 3: Thêm nút thao tác nhanh gửi email trong danh sách khách hàng**
- [ ] **Step 4: Kiểm tra build TypeScript `npm run build`**

---

### Task 3: Modal Đặt Lịch Hẹn Gặp Mặt 2 Chiều (`CustomerMeetingModal` & `CustomerCarePage`)

**Files:**
- Create: `d:/PROJECT/FE_Estate_System/src/features/customers/components/CustomerMeetingModal.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/pages/CustomersPage.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/components/CustomerDetailModal.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/pages/CustomerCarePage.tsx`

**Interfaces:**
- Consumes: `customerId`, `meetingTime` (DateTime), `location`, `note`.
- Produces: Bản ghi `CustomerCare` với `type: 'MEETING'`, nội dung chuẩn hóa: `[Hẹn gặp lúc DD/MM/YYYY HH:mm tại {địa điểm}] {ghi chú}`.

- [ ] **Step 1: Viết component `CustomerMeetingModal.tsx`:**
  - Form gồm: Chọn khách hàng (nếu mở từ trang tổng), Chọn thời gian cụ thể (`DatePicker showTime`), Địa điểm (Văn phòng, Quán cafe, Nhà mẫu dự án, Vị trí lô đất...), Ghi chú chuẩn bị.
- [ ] **Step 2: Tích hợp nút "Hẹn gặp mặt" (icon `<CalendarOutlined />`) vào từng dòng khách hàng và trong `CustomerDetailModal.tsx`**
- [ ] **Step 3: Tích hợp vào `CustomerCarePage.tsx`: khi nhấn "Đặt lịch hẹn", mở modal cho phép chọn thời gian cụ thể và khách hàng, sau khi lưu sẽ đồng bộ vào nhật ký**
- [ ] **Step 4: Kiểm tra build TypeScript `npm run build`**

---

### Task 4: Cột "Ghi Chú Hành Động Tiếp Theo" Cho Role Sales Trong Bảng Khách Hàng

**Files:**
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/pages/CustomersPage.tsx`
- Modify: `d:/PROJECT/FE_Estate_System/src/features/customers/api.ts`

**Interfaces:**
- Consumes: `user.role === 'SALES'` (hoặc `canManage`), `customer.notes`.
- Produces: Cột cuối cùng trong bảng khách hàng cho phép Sales ghi chú nhanh: "Khách hàng này nên làm gì tiếp theo?".

- [ ] **Step 1: Bổ sung hook cập nhật ghi chú nhanh `useUpdateCustomerNotes` hoặc lưu đồng thời vào nhật ký chăm sóc `type: 'NOTE'`**
- [ ] **Step 2: Thêm cột "Hành động tiếp theo (Sales)" ở vị trí cuối cùng trong bảng khách hàng:**
  - Hiển thị ghi chú hiện tại của khách hàng.
  - Cho phép Sales click vào ô để nhập nhanh ghi chú (Inline edit hoặc Popover form nhỏ gọn với nút Lưu).
- [ ] **Step 3: Khi Sales lưu: Cập nhật thông tin khách hàng và tự động thêm 1 dòng nhật ký chăm sóc `NOTE` với nội dung "Cập nhật kế hoạch: {ghi chú}"**
- [ ] **Step 4: Kiểm tra build TypeScript `npm run build`**

---

### Task 5: Kiểm Thử Toàn Diện & Đánh Giá Giao Diện

**Files:**
- Test toàn bộ luồng:
  1. Click Số điện thoại trên Desktop -> Hiện popup cuộc gọi, nhập kết quả -> Xem nhật ký chăm sóc xuất hiện dòng `CALL`.
  2. Click Email -> Gửi email -> Xem nhật ký xuất hiện dòng `EMAIL`.
  3. Click Hẹn gặp mặt -> Chọn giờ và địa điểm -> Xem nhật ký xuất hiện dòng `MEETING`.
  4. Nhập ô Ghi chú hành động ở cột cuối cùng -> Nhấn Lưu -> Dữ liệu cập nhật và có log `NOTE`.

- [ ] **Step 1: Chạy `npm run build` kiểm tra 0 lỗi**
- [ ] **Step 2: Chạy kiểm thử tự động / xác minh giao diện trên trình duyệt**
- [ ] **Step 3: Báo cáo kết quả chi tiết cho người dùng**
