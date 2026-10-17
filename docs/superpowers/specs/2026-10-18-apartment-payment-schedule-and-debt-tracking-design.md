# Thiết Kế Kỹ Thuật: Quản Lý Tiến Độ Thanh Toán Theo Đợt & Nhắc Nợ Căn Hộ (Giai Đoạn 4)

## 1. Bối Cảnh & Vấn Đề (Context & Problem)
- Hệ thống CRM BĐS hiện tại đã có bảng `deals` (Hợp đồng) và `deal_payments` (Ghi nhận thanh toán thực tế).
- **Vấn đề**:
  - Giao dịch BĐS căn hộ chung cư luôn nộp tiền theo các đợt thi công xây dựng (7 đợt chuẩn, 95% thanh toán nhanh nhận chiết khấu, hoặc vay ngân hàng hỗ trợ lãi suất).
  - Chưa có bảng tiến độ dự kiến (Schedules) gắn với ngày hạn chót (`due_date`) và tỷ lệ phần trăm (`percentage`).
  - Chưa có cơ chế cảnh báo quá hạn nợ (`OVERDUE`), sắp đến hạn (`DUE_SOON`) và tự động gạch nợ theo thứ tự đợt (FIFO).

---

## 2. Mô Hình Dữ Liệu (Data Model - CRM Database)

### 2.1. Bảng `deal_payment_schedules`
Tạo trong cơ sở dữ liệu `CRM_DB` của `crm-service`:
```sql
CREATE TABLE deal_payment_schedules (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id uuid NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    installment_no int NOT NULL,            -- Số thứ tự đợt (1, 2, 3...)
    name varchar(150) NOT NULL,             -- Tên đợt (VD: "Đợt 1: Cọc", "Đợt 2: Ký HĐMB"...)
    percentage numeric(5,2),                -- Tỷ lệ % giá trị căn hộ (VD: 15.00)
    amount_due numeric(15,2) NOT NULL,      -- Số tiền phải nộp đợt này (VNĐ)
    due_date date NOT NULL,                 -- Hạn chót thanh toán
    notes text,                             -- Ghi chú điều kiện / mốc nghiệm thu
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_deal_installment UNIQUE (deal_id, installment_no)
);

CREATE INDEX idx_deal_payment_schedules_deal ON deal_payment_schedules(deal_id);
CREATE INDEX idx_deal_payment_schedules_due_date ON deal_payment_schedules(due_date);
```

### 2.2. Ba Mẫu Tiến Độ Chuẩn Cho Căn Hộ (Apartment Templates)
1. **`TEMPLATE_CONSTRUCTION_7` (Tiến độ xây dựng căn hộ chuẩn 7 đợt)**:
   - Đợt 1: Đặt cọc (lấy từ `deal.deposit_amount`, mặc định 100tr) — Hạn: Ngày ký hợp đồng (`deal.signedDate`).
   - Đợt 2: Ký Hợp đồng mua bán (Đủ 15% GTCH, gồm cọc) — Hạn: `signedDate + 10 ngày`.
   - Đợt 3: Xong sàn móng hầm (10% GTCH) — Hạn: `signedDate + 60 ngày`.
   - Đợt 4: Thi công phần thân tầng 10 (10% GTCH) — Hạn: `signedDate + 120 ngày`.
   - Đợt 5: Cất nóc tòa nhà (Topping out) (15% GTCH) — Hạn: `signedDate + 180 ngày`.
   - Đợt 6: Bàn giao căn hộ nhận chìa khóa (45% GTCH) — Hạn: `signedDate + 270 ngày`.
   - Đợt 7: Nhận sổ hồng quyền sở hữu (5% GTCH) — Hạn: `signedDate + 360 ngày`.

2. **`TEMPLATE_FAST_DISCOUNT_3` (Thanh toán sớm 95% nhận chiết khấu mở bán)**:
   - Đợt 1: Đặt cọc (lấy từ `deal.deposit_amount`).
   - Đợt 2: Ký HĐMB & Thanh toán 95% GTCH (trừ cọc) — Hạn: `signedDate + 15 ngày`.
   - Đợt 3: Nhận sổ hồng (5% GTCH) — Hạn: `signedDate + 180 ngày`.

3. **`TEMPLATE_BANK_LOAN_4` (Vay ngân hàng hỗ trợ lãi suất 0%)**:
   - Đợt 1: Đặt cọc (lấy từ `deal.deposit_amount`).
   - Đợt 2: Vốn tự có ký HĐMB (Đủ 30% GTCH) — Hạn: `signedDate + 15 ngày`.
   - Đợt 3: Ngân hàng đối tác giải ngân 65% GTCH — Hạn: `signedDate + 35 ngày`.
   - Đợt 4: Nhận sổ hồng (5% GTCH) — Hạn: `signedDate + 270 ngày`.

---

## 3. Kiến Trúc Backend (`crm-service`)

### 3.1. Thuật toán gạch nợ FIFO & Phân loại trạng thái
Tổng tiền khách đã nộp: `totalCollected = sum(deal_payments.amount)`.
Duyệt qua danh sách đợt thanh toán sắp xếp theo `installment_no ASC`:
```java
BigDecimal remainingPool = totalCollected;
for (DealPaymentSchedule item : schedules) {
    BigDecimal allocated = remainingPool.min(item.getAmountDue());
    remainingPool = remainingPool.subtract(allocated);
    BigDecimal remainingDue = item.getAmountDue().subtract(allocated);

    ScheduleStatus status;
    if (remainingDue.compareTo(BigDecimal.ZERO) == 0) {
        status = ScheduleStatus.PAID;
    } else if (item.getDueDate().isBefore(today)) {
        status = ScheduleStatus.OVERDUE;
    } else if (!item.getDueDate().isAfter(today.plusDays(7))) {
        status = ScheduleStatus.DUE_SOON;
    } else {
        status = ScheduleStatus.PENDING;
    }
}
```

### 3.2. RESTful APIs
- `GET /api/deals/{dealId}/schedules`: Trả về danh sách đợt kèm số tiền đã gạch nợ (`amountPaid`), số tiền còn thiếu (`amountRemaining`), trạng thái (`status`), và số ngày quá hạn/còn lại.
- `POST /api/deals/{dealId}/schedules`: Lưu hoặc ghi đè danh sách đợt tùy chỉnh.
- `POST /api/deals/{dealId}/schedules/apply-template`: Áp dụng mẫu (`templateCode` $\in$ {`TEMPLATE_CONSTRUCTION_7`, `TEMPLATE_FAST_DISCOUNT_3`, `TEMPLATE_BANK_LOAN_4`}). Tự động chia tiền theo `contractValue` và hạn ngày theo `signedDate`.

---

## 4. Giao Diện Người Dùng (`FE_Estate_System`)

### 4.1. Khối "Tiến độ thanh toán & Nhắc nợ" trong Chi tiết Hợp đồng
- **Thanh tổng kết KPIs**:
  - Tổng giá trị hợp đồng (`contractValue`).
  - Đã thu lũy kế (`totalCollected`).
  - Công nợ còn lại (`totalRemaining`).
  - Số đợt quá hạn nợ (`overdueCount`) hiển thị thẻ báo động đỏ nếu $> 0$.
- **Bảng Tiến độ Thanh toán**:
  - Cột: **Đợt** | **Tên mốc thanh toán** | **Tỷ lệ %** | **Số tiền phải nộp** | **Hạn thanh toán** | **Đã thu (FIFO)** | **Còn thiếu** | **Trạng thái**.
  - Trạng thái pill trực quan:
    - `Đã thu`: Badge xanh lá + Icon Check.
    - `Quá hạn`: Badge đỏ + Icon Cảnh báo + Số ngày quá hạn (VD: "Quá hạn 12 ngày").
    - `Sắp đến hạn`: Badge cam vàng + Số ngày còn lại (VD: "Còn 3 ngày").
    - `Chưa đến hạn`: Badge xám nhẹ.
- **Thao tác nhanh**:
  - Nút **"Áp dụng mẫu tiến độ BĐS"**: Mở modal chọn 1 trong 3 mẫu căn hộ chuẩn, preview các đợt trước khi lưu.
  - Nút **"Chỉnh sửa tiến độ"**: Thêm/sửa/xóa đợt linh hoạt theo phụ lục hợp đồng.
  - Nút **"Ghi nhận thanh toán"**: Nộp tiền thực tế, modal đóng lại bảng lập tức cập nhật gạch nợ FIFO thời gian thực.

### 4.2. Tích hợp Form tạo Hợp đồng mới (`DealModal`)
- Khi tạo Hợp đồng mới từ Bảng hàng Matrix:
  - Có trường chọn: **Mẫu tiến độ thanh toán**.
  - Khi chọn mẫu, tự động tạo sẵn các bản ghi đợt thanh toán tương ứng cho Deal.

---

## 5. Chiến Lược Kiểm Thử (Testing & Verification)
1. **Unit Tests Backend (`crm-service`)**:
   - `DealPaymentScheduleServiceTests`:
     - Test áp dụng 3 mẫu tiến độ căn hộ: Tổng tỷ lệ % đủ 100%, số tiền khớp với `contractValue`.
     - Test thuật toán gạch nợ FIFO: Nộp từng phần $\rightarrow$ đợt 1 đủ, đợt 2 thiếu. Nộp dư $\rightarrow$ tràn sang đợt tiếp theo.
     - Test tính toán trạng thái `OVERDUE` khi quá hạn ngày và `DUE_SOON` khi còn $\le 7$ ngày.
2. **Kiểm thử E2E Playwright (`logs/audit-phase4-payment-schedule.cjs`)**:
   - Mở Deal căn hộ $\rightarrow$ Áp dụng Mẫu tiến độ xây dựng 7 đợt.
   - Kiểm tra hiển thị bảng đợt: Đợt 1 cọc đã xanh (`PAID`), các đợt tiếp theo hiện đúng ngày và tiền.
   - Ghi nhận thanh toán Đợt 2 $\rightarrow$ Bảng tự gạch nợ Đợt 2 chuyển sang `PAID`.
   - Chụp ảnh minh chứng lưu vào thư mục artifact.
