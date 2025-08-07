# API Upload Thống Nhất

API upload thống nhất cho việc upload ảnh và avatar trong hệ thống TicketLMS.

## Endpoint

```
POST /api/upload
```

## Query Parameters

-   `type` (optional): Loại upload
    -   `"avatar"`: Upload avatar (crop về 100x100px, max 2MB)
    -   `"image"`: Upload ảnh thường (max 5MB)
    -   Mặc định: `"image"`

## Request

### Headers

```
Content-Type: multipart/form-data
Authorization: Bearer <access_token>
```

### Body

```
FormData với field "file" chứa file ảnh
```

## Response

### Success Response (200)

```json
{
    "success": true,
    "data": {
        "url": "https://xxx.supabase.co/storage/v1/object/public/ticket-attachments/images/1234567890_abc123.png",
        "filename": "images/1234567890_abc123.png",
        "size": 1024000,
        "type": "image/png",
        "uploadType": "image",
        "message": "image upload successful"
    },
    "message": "image uploaded successfully"
}
```

### Error Response (400/500)

```json
{
    "success": false,
    "error": "Error message",
    "details": "Detailed error information"
}
```

## Cách sử dụng

### Upload Avatar

```javascript
const formData = new FormData();
formData.append("file", file);

const response = await fetch("/api/upload?type=avatar", {
    method: "POST",
    body: formData,
});
```

### Upload Ảnh Thường

```javascript
const formData = new FormData();
formData.append("file", file);

const response = await fetch("/api/upload?type=image", {
    method: "POST",
    body: formData,
});
```

## Lưu trữ

-   **Bucket**: `ticket-attachments`
-   **Avatar**: Lưu trong thư mục `avatars/`
-   **Ảnh thường**: Lưu trong thư mục `images/`
-   **URL**: Public URL từ Supabase Storage

## Validation

### File Types

-   `image/jpeg`
-   `image/jpg`
-   `image/png`
-   `image/gif`
-   `image/webp`

### File Size

-   Avatar: Tối đa 2MB
-   Ảnh thường: Tối đa 5MB

## Setup Storage

Chạy lệnh sau để setup Supabase storage bucket:

```bash
npm run setup:storage
```

Lệnh này sẽ:

1. Tạo bucket `ticket-attachments` nếu chưa có
2. Cấu hình bucket là public
3. Tạo thư mục `avatars/` và `images/`
4. Thiết lập các quyền cần thiết

## Migration từ API cũ

Các API cũ đã được xóa:

-   `/api/upload/avatar` → `/api/upload?type=avatar`
-   `/api/upload/image` → `/api/upload?type=image`
-   `/api/upload/avatar-simple` → `/api/upload?type=avatar`
-   `/api/upload/simple` → `/api/upload?type=image`

Các component đã được cập nhật để sử dụng API mới.
