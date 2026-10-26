# Đồng bộ giao diện Estate CRM

## Hướng thiết kế đề xuất

Giữ nhận diện xanh của CRM, nền sáng dịu, bề mặt trắng và phân cấp chữ rõ. Giữ React, Ant Design và component hiện có. Thiết kế cho công việc xử lý dữ liệu: hành động chính dễ tìm, trạng thái rõ nghĩa và số tiền dễ đọc. Không thêm thư viện hoặc thay API/backend.

Ba lựa chọn:

1. **Đồng bộ toàn bộ nền tảng dùng chung, hoàn thiện màn hình lệch chuẩn (đề xuất):** tác động đến nhiều màn hình, giữ quy trình người dùng đã quen.
2. Chỉ chỉnh màu/font/khoảng cách: thay đổi ít nhưng không giải quyết điều hướng mobile và trạng thái dữ liệu.
3. Thiết kế lại hoàn toàn: khác biệt hình ảnh lớn, phạm vi rộng và cần nghiệm thu lại nhiều luồng.

## Các vấn đề đã xác nhận từ code

- `PageHeader` khai báo breadcrumb và nhiều màn hình truyền vào nhưng component không render.
- `KpiCard` có prop loading nhưng không sử dụng, dễ hiện số 0 trong lúc chờ API.
- Mobile vẫn giữ sidebar 80 px; nút menu chưa cung cấp điều hướng dạng ngăn kéo toàn diện.
- Menu tài khoản chỉ kích hoạt hover, chưa phù hợp điện thoại và bàn phím.
- Màn hình bảng xếp hạng tự tạo header với chữ in hoa dài, khác header dùng chung; lỗi API chưa được phân biệt rõ với dữ liệu rỗng.
- Danh sách email có thể hiển thị khoảng `0 - -1` khi không có dữ liệu.
- Route `/login/2fa` và `/profile/security` đang dùng màn placeholder chứa nội dung kỹ thuật; cần đối chiếu luồng 2FA hiện có trước khi nối về giao diện thực.
- Cần kiểm tra thực tế overflow, filter, bảng và modal trên màn hình nhỏ; không kết luận chỉ từ mã CSS.

## Phạm vi triển khai

### 1. Nền tảng dùng chung

- Breadcrumb hoạt động qua router, một tiêu đề h1/màn, nhóm hành động co giãn đúng trên mobile.
- KPI có skeleton theo đúng cấu trúc; định dạng số dùng tabular figures.
- Chuẩn hóa token màu/bề mặt, khoảng cách và các biến CSS liên quan; giữ màu riêng có ý nghĩa cho trạng thái nghiệp vụ.
- Điều hướng desktop giữ sidebar có thể thu gọn; mobile dùng Drawer có đóng bằng Esc, click backdrop và sau khi chọn trang.
- Skip link tới nội dung chính, tên truy cập cho tìm kiếm và menu tài khoản; focus rõ, hỗ trợ reduced motion hiện có.

### 2. Màn hình và trạng thái chưa đồng bộ

- Bảng xếp hạng dùng PageHeader, thanh lọc gọn, loading/error/empty khác nhau, retry khi lỗi và không hiển thị thành tích giả khi API thất bại.
- Rà các trang danh sách/chính: dashboard, khách hàng, dự án, sản phẩm, lead, hợp đồng, hoa hồng, email, báo cáo. Sửa các lỗi cụ thể về bố cục và trạng thái được tái hiện; không viết lại màn hình đã đạt.
- Sửa khoảng phân trang email khi rỗng.
- Nối route bảo mật/2FA tới luồng thật đã có nếu tương thích; không dựng giao diện giả cho nghiệp vụ chưa có backend.
- Trang lỗi dùng ngôn ngữ thống nhất và đường quay lại rõ.

### 3. Kiểm tra và bàn giao

- Build TypeScript/Vite.
- Dùng browser với dữ liệu fixture cô lập để kiểm tra desktop/mobile, ba vai trò, điều hướng, loading, lỗi và rỗng; không dùng thao tác ghi trên dữ liệu Supabase thật để kiểm tra thiết kế.
- Chụp ảnh màn hình minh chứng trước/sau vào `output/playwright/`.
- Đọc diff, commit và merge main khi kiểm tra đạt theo yêu cầu đã có.

## Điều kiện hoàn thành

Các thành phần dùng chung và màn được sửa tuân theo cùng hệ thống; sidebar không chiếm chỗ trên mobile; hành động có thể dùng bằng bàn phím; lỗi API không bị trình bày như số liệu thật bằng 0; dữ liệu rỗng có thông điệp hợp lý; build đạt và kiểm tra browser có bằng chứng. Những màn hoặc luồng chưa thể nghiệm thu được phải được ghi rõ.
