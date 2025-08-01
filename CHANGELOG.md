# Changelog

Tất cả các thay đổi quan trọng của dự án TicketLMS sẽ được ghi lại trong file này.

## [1.2.2] - 2025-08-02

### Cải thiện

- **Tách component Dashboard**: Tối ưu hóa cấu trúc code bằng cách tách trang dashboard thành các component nhỏ hơn
  - Tách `DashboardStats` component để hiển thị thống kê
  - Tách `RecentTickets` component để hiển thị tickets gần đây
  - Tách `RecentNotifications` component để hiển thị thông báo gần đây
  - Tách `DashboardHeader` component để hiển thị header
  - Tạo `dashboard-utils.ts` để chứa logic xử lý data
  - Giảm kích thước file chính từ 647 dòng xuống còn 80 dòng
- **Tách component Tickets**: Tối ưu hóa cấu trúc code bằng cách tách trang tickets thành các component nhỏ hơn
  - Tách `TicketTable` component để hiển thị bảng tickets
  - Tách `TicketFilters` component để xử lý bộ lọc và tìm kiếm
  - Tách `TicketDialog` component để tạo/chỉnh sửa ticket
  - Tách `TicketDetailView` component để hiển thị chi tiết ticket
  - Tách `TicketComments` component để quản lý bình luận
  - Tách `TicketEditForm` component để chỉnh sửa ticket
  - Tạo `useTicketList` và `useTicketDetail` hooks để quản lý state
  - Tạo `ticket-utils.ts` để chứa logic xử lý data tickets
- **Cải thiện khả năng bảo trì**: Code được tổ chức rõ ràng hơn, dễ test và tái sử dụng
- **Tối ưu performance**: Các component có thể được lazy load khi cần thiết

## [1.2.1] - 2025-08-01

### Tính năng mới

- **Tích hợp JIRA**: Thêm chức năng liên kết ticket với JIRA, hiển thị thông tin JIRA trong chi tiết ticket và danh sách tickets

### Cải thiện

- **Cải thiện hiển thị JIRA**: Cột JIRA chỉ hiển thị số (bỏ prefix CLD-), thu gọn độ rộng cột và chỉ hiển thị cho admin
- **Chuyển sắp xếp từ Frontend sang Backend**: Tối ưu hiệu suất bằng cách sắp xếp tickets ở database level thay vì JavaScript, thêm dropdown sắp xếp với 6 tùy chọn
- **Cải thiện bộ lọc trạng thái**: Thêm tùy chọn lọc 'Chưa đóng' để hiển thị tickets có trạng thái Mở hoặc Đang làm
- **Cải thiện cột Thời hạn**: Thêm đếm ngược thời hạn với màu sắc theo mức độ khẩn cấp, chỉ hiển thị trong 10 ngày gần deadline
- **Cải thiện UI phân trang**: Đồng bộ độ rộng phân trang với danh sách tickets để giao diện nhất quán
- **Đồng bộ màu sắc trạng thái ticket**: Cập nhật màu sắc trạng thái 'Đang làm' và 'Đã đóng' trong dashboard để đồng bộ với danh sách tickets

## [1.2.0] - 2025-07-30

### Tính năng mới

- **Cải thiện Rich Text Editor và HTML Content**: Thêm hỗ trợ bullet list, auto-link, paste ảnh từ clipboard, và đồng bộ UI giữa editor và preview

### Cải thiện

- **Cải thiện bộ lọc tìm kiếm**: Tìm kiếm chỉ hoạt động khi bấm Enter hoặc icon tìm kiếm, không tự động search khi gõ
- **Đổi tên Dashboard thành Tổng quan**: Cập nhật tất cả label từ 'Dashboard' thành 'Tổng quan' để phù hợp với tiếng Việt
- **Cải thiện UI Tasks Gần Đây**: Đồng bộ màu sắc trạng thái và thêm icon cho loại task giống màn danh sách

## [1.1.0] - 2025-07-29

### Tính năng mới

- **Hệ thống thông báo**: Thêm hệ thống thông báo real-time cho các thay đổi ticket và comment
- **Quản lý profile người dùng**: Cho phép người dùng cập nhật thông tin cá nhân và đổi mật khẩu

## [1.0.0] - 2025-07-25

### Tính năng mới

- **Phát hành phiên bản đầu tiên**: Hệ thống quản lý ticket với đầy đủ tính năng cơ bản: tạo, chỉnh sửa, xóa ticket, phân quyền theo role
- **Hệ thống phân quyền**: Phân quyền admin, manager, user với các chức năng khác nhau
- **Quản lý tổ chức**: Admin có thể tạo và quản lý các tổ chức, phân chia người dùng theo tổ chức

---

## Cách sử dụng Changelog

### Định dạng

Mỗi phiên bản sẽ có format như sau:

```
## [Version] - YYYY-MM-DD

### Tính năng mới
- Mô tả tính năng mới

### Cải thiện
- Mô tả cải thiện

### Sửa lỗi
- Mô tả lỗi đã sửa

### Breaking Changes
- Mô tả thay đổi breaking (nếu có)
```

### Loại thay đổi

- **Tính năng mới**: Tính năng hoàn toàn mới
- **Cải thiện**: Cải thiện tính năng hiện có
- **Sửa lỗi**: Sửa lỗi trong hệ thống
- **Bảo mật**: Cập nhật bảo mật
- **Breaking Changes**: Thay đổi có thể ảnh hưởng đến code hiện tại

### Cách thêm entry mới

1. Thêm entry vào file `src/app/changelog/page.tsx` trong array `changelogData`
2. Cập nhật file `CHANGELOG.md` này
3. Đảm bảo version và date chính xác
