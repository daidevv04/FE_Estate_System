# UI consistency — nghiệm thu ngày 26/10/2026

Đã thực hiện hướng thiết kế được duyệt trong `specs/2026-10-26-ui-consistency-design.md`.

## Thay đổi

- Giữ nhận diện xanh, thống nhất màu nền/bề mặt và chữ trong theme hiện có.
- PageHeader hiển thị breadcrumb có điều hướng và tiêu đề h1; KPI dùng skeleton khi đang tải.
- Điện thoại dùng Drawer thay sidebar cố định; menu tài khoản hoạt động bằng click và bàn phím. Thêm skip link và focus rõ.
- Bảng xếp hạng dùng header, thanh lọc và thẻ nhân viên dẫn đầu gọn hơn; phân biệt loading, lỗi, rỗng và dữ liệu có thật. Retry hoạt động và export bị khóa khi lỗi.
- Hoa hồng dùng header/KPI chung, có báo lỗi và thông điệp rỗng rõ; bỏ CSS của các thẻ cũ đã được thay thế.
- Sửa header tràn ngang và bảng doanh thu kéo giãn trang trên mobile; bảng vẫn cuộn ngang trong vùng riêng.
- Sửa khoảng phân trang email rỗng, thay nội dung kỹ thuật trên báo cáo bằng mô tả nghiệp vụ.
- Route `/login/2fa` sử dụng luồng đăng nhập/2FA đã có; `/profile/security` mở đúng vùng bảo mật hiện có và đặt focus tại đó.

## Bằng chứng

`npm run build`: đạt TypeScript và Vite build.

`npm run verify:ui`: đạt 43 mục kiểm tra, gồm 34 lượt hiển thị trên 17 trang ở 1440 px và 390 px, menu mobile, ba vai trò ADMIN/MANAGER/SALES, ba trạng thái bảng xếp hạng, focus vùng bảo mật và loading của KPI. Không có tràn ngang toàn trang hoặc lỗi runtime trong 34 lượt hiển thị.

Các trang được rà: tổng quan, khách hàng, nhật ký chăm sóc, lịch hẹn, dự án, sản phẩm, lead, hợp đồng, hoa hồng, email, bảng xếp hạng, hiệu suất sales, tổng quan pipeline, doanh thu, hiệu suất dự án, thông báo, người dùng.

Ảnh và kết quả JSON được lưu local trong `output/playwright/ui-consistency/` (gitignored). `after-reports-leaderboard-1440.png` và `after-reports-leaderboard-390.png` là ví dụ desktop/mobile; `state-loading.png`, `state-error.png`, `state-empty.png` minh chứng các trạng thái dữ liệu.

## Chạy lại

1. Chạy Vite bằng `npm run dev -- --host 127.0.0.1 --port 5178`.
2. Chạy `npm run verify:ui`; có thể đặt `UI_BASE_URL` nếu Vite dùng cổng khác.
3. Chromium phải có sẵn cho dependency Playwright đã được cài trong dự án.

Script chỉ dùng tài khoản và dữ liệu fixture trong browser, chặn API ghi và không dùng dữ liệu Supabase thật. Đây là kiểm tra giao diện, không thay thế nghiệm thu các giao dịch thực tế giữa frontend và backend. Các bản ghi mẫu chỉ phục vụ ảnh kiểm tra.

Chưa push hoặc deploy. Vite vẫn có cảnh báo bundle lớn; đợt này không thay đổi cách chia bundle hay luồng nghiệp vụ backend.
