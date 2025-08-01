# Changelog

Tất cả các thay đổi quan trọng của dự án TicketLMS sẽ được ghi lại trong file này.

## [1.2.0] - 2024-12-19

### Tính năng mới
- **Cải thiện Rich Text Editor và HTML Content**: Thêm hỗ trợ bullet list, auto-link, paste ảnh từ clipboard, và đồng bộ UI giữa editor và preview

### Cải thiện
- **Cải thiện bộ lọc tìm kiếm**: Tìm kiếm chỉ hoạt động khi bấm Enter hoặc icon tìm kiếm, không tự động search khi gõ
- **Đổi tên Dashboard thành Tổng quan**: Cập nhật tất cả label từ 'Dashboard' thành 'Tổng quan' để phù hợp với tiếng Việt
- **Cải thiện UI Tasks Gần Đây**: Đồng bộ màu sắc trạng thái và thêm icon cho loại task giống màn danh sách

## [1.1.0] - 2024-12-18

### Tính năng mới
- **Hệ thống thông báo**: Thêm hệ thống thông báo real-time cho các thay đổi ticket và comment
- **Quản lý profile người dùng**: Cho phép người dùng cập nhật thông tin cá nhân và đổi mật khẩu

## [1.0.0] - 2024-12-17

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