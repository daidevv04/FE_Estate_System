# Stitch — màn 9.7 Tổng quan (/dashboard), dữ liệu THẬT

Dán prompt dưới đây vào Stitch (project `Đất Xanh Miền Trung CRM`, design system
`assets/252639cd0c3d481a955ef45cc061e264`, device DESKTOP). Dữ liệu bên dưới là số
THẬT lấy từ backend đang chạy ngày 28/09/2026 — không thay bằng dữ liệu mẫu.

Nguồn: `GET /api/deals?sort=createdAt,desc`, `GET /api/deals/{id}/payments`,
`GET /api/leads?size=200`, `GET /api/appointments?from=<hôm nay>T00:00:00&to=<hôm nay>T23:59:59`.
Backend CHƯA có `/api/dashboard/overview` (analytic-service chưa làm) nên các chỉ số
tổng hợp phải là số tính từ 3 endpoint trên, ghi rõ nguồn ở chân trang.

## Prompt

```text
Desktop 1440x1000, route /dashboard của CRM BĐS (sidebar + header của hệ thống), tiêu đề "Tổng quan",
filter thời gian: Hôm nay | 7 ngày | 30 ngày (active) | Quý này | Tuỳ chọn.
Dùng đúng số liệu sau, không thêm dữ liệu mẫu:

4 KPI card (3/12 cột mỗi card, nền gradient nhạt khác màu, số 30px/700):
1 amber "Doanh thu kỳ này" — 500.000.000 ₫ — "5 phiếu thu · 25/09/2026" — "— chưa có kỳ trước"
2 xanh lá "Hợp đồng mới" — 5 — "tất cả ký ngày 25/09/2026" — "—"
3 xanh ngọc "Lead đang mở" — 2 — "Mới 1 · Đã liên hệ 1" — "—"
4 tím "Tỉ lệ thắng" — 71% — "5 thắng / 7 lead" — "—"

Chart cột 8/12 "Doanh thu theo tháng": chỉ 1 cột 09/2026 = 500, đơn vị trục Y "triệu ₫",
tháng 07/2026 và 08/2026 để trống hoàn toàn.

Chart ngang 4/12 "Pipeline theo bước": Đã thắng 5 (12,5 tỷ) · Đã liên hệ 1 (2,5 tỷ) ·
Mới 1 (2,5 tỷ) · Đã quan tâm 0 · Gửi báo giá 0 · Đàm phán 0 · Thất bại 0.

Bảng 6/12 "Hợp đồng gần đây" 5 dòng, cột Mã HĐ (mono) · Giá trị · Đã thu · Thanh toán ·
Phê duyệt · Ngày ký: HD-20260925-174459, HD-20260925-174259, HD-20260925-174105,
HD-20260925-173610, HD-20260925-173249 — mỗi dòng: 2.500.000.000 ₫ · 100.000.000 ₫ ·
"Một phần" · "Chờ duyệt" · 25/09/2026.

Card 6/12 "Lịch hẹn hôm nay": trạng thái rỗng, "Hôm nay không có lịch hẹn" + nút "Xem lịch hẹn"
+ ghi chú nhỏ "Lịch hẹn gần nhất: 27/09/2026 22:25 · Hen gap 20260925-231213".

Chân trang chữ nhỏ: "Số liệu lấy trực tiếp từ GET /api/deals, GET /api/appointments,
GET /api/leads — backend chưa có /api/dashboard/overview".
```

## Các màn 9.7 đang có trong project Stitch

| Screen id | Tiêu đề | Trạng thái dữ liệu |
|---|---|---|
| `c2e2d51e05384a97985b33b4ea6beef1` | 9.7 Tổng quan (/dashboard) | MẪU (12,4 tỷ · 8 HĐ · 27 lead · HD-2026-0012) |
| `1b6f13e7fce0402daf16637c06e732d2` | 9.7 Admin Dashboard Tổng quan hệ thống (/dashboard) - Enterprise | MẪU (148,6 tỷ · 34 HĐ · 186 lead · HD-2026-0033) |

Giữ 1 màn làm bản chuẩn, xoá màn còn lại để tránh nhầm khi bàn giao.
