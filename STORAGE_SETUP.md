# 🔧 Hướng dẫn Setup Storage Bucket

## 🚨 Lỗi hiện tại

```
Storage upload error: {
  statusCode: '403',
  error: 'Unauthorized',
  message: 'new row violates row-level security policy'
}
```

## ✅ Giải pháp

### Bước 1: Tạo Bucket thủ công (Nếu gặp lỗi quyền)

1. **Mở Supabase Dashboard**

    - Truy cập: https://supabase.com/dashboard
    - Chọn project của bạn

2. **Mở Storage**

    - Click vào "Storage" trong sidebar
    - Click "Create a new bucket"

3. **Tạo bucket**
    - **Name**: `ticket-attachments`
    - **Public bucket**: ✅ Checked
    - **File size limit**: `5MB`
    - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/gif, image/webp`
    - Click "Create bucket"

### Bước 2: Chạy SQL Setup

1. **Mở SQL Editor**

    - Click vào "SQL Editor" trong sidebar
    - Click "New query"

2. **Chạy script setup**

    - Copy nội dung từ file `supabase/migrations/setup_storage_simple.sql`
    - Paste vào SQL Editor
    - Click "Run" để thực thi

3. **Nếu vẫn lỗi quyền, chạy script policies only**
    - Copy nội dung từ file `supabase/migrations/create_policies_only.sql`
    - Paste vào SQL Editor
    - Click "Run" để thực thi

### Bước 3: Kiểm tra kết quả

1. **Chạy script kiểm tra**

    - Copy nội dung từ file `supabase/migrations/check_storage_status.sql`
    - Paste vào SQL Editor mới
    - Click "Run" để kiểm tra

2. **Kết quả mong đợi**

    ```
    ✅ Bucket ticket-attachments exists
    ✅ Upload policy created successfully
    ✅ Read policy created successfully
    ```

3. **Hoặc kiểm tra thủ công**

    ```sql
    -- Kiểm tra bucket
    SELECT * FROM storage.buckets WHERE id = 'ticket-attachments';

    -- Kiểm tra policies
    SELECT policyname FROM pg_policies
    WHERE tablename = 'objects'
    AND schemaname = 'storage';
    ```

## 📋 Nội dung SQL Setup

### Tạo Bucket

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ticket-attachments',
    'ticket-attachments',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);
```

### Tạo RLS Policies

```sql
-- Upload policy
CREATE POLICY "Allow authenticated users to upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments'
    AND auth.role() = 'authenticated'
);

-- Read policy
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'ticket-attachments');
```

## 🔍 Kiểm tra thủ công

### 1. Kiểm tra bucket

```sql
SELECT * FROM storage.buckets WHERE id = 'ticket-attachments';
```

### 2. Kiểm tra policies

```sql
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

### 3. Kiểm tra RLS

```sql
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'objects'
AND schemaname = 'storage';
```

## 🧪 Test Upload

Sau khi setup xong, thử upload lại avatar để kiểm tra:

1. Mở ứng dụng
2. Thử upload avatar
3. Kiểm tra console log
4. Nếu thành công, sẽ thấy URL Supabase thay vì lỗi 403

## 📁 Cấu trúc thư mục

Sau khi setup thành công, bucket sẽ có cấu trúc:

```
ticket-attachments/
├── avatars/          # Avatar files (100x100px)
└── images/           # Regular images
```

## 🚀 Lưu ý

-   **Public bucket**: Ảnh sẽ có thể truy cập công khai
-   **File size limit**: 5MB cho ảnh thường, 2MB cho avatar
-   **File types**: Chỉ cho phép image files
-   **Authentication**: Chỉ user đã đăng nhập mới upload được

## 🔧 Troubleshooting

### Nếu vẫn lỗi 403:

1. Kiểm tra user đã đăng nhập chưa
2. Kiểm tra JWT token có hợp lệ không
3. Chạy lại script setup
4. Kiểm tra Supabase project có active không

### Nếu bucket không tạo được:

1. Kiểm tra quyền admin trong Supabase
2. Tạo bucket thủ công trong Storage dashboard
3. Sau đó chạy script tạo policies
