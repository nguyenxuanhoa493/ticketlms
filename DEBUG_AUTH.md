# Debug Authentication Issues

## Vấn đề hiện tại

API `/api/organizations` trả về lỗi 403 Forbidden, có thể do:

1. **User chưa đăng nhập**
2. **Session đã hết hạn**
3. **Cookie không được gửi đúng cách**
4. **Middleware authentication có vấn đề**

## Các bước debug

### 1. Kiểm tra authentication status

Truy cập: `http://localhost:3000/test-auth`

Trang này sẽ hiển thị:
- Trạng thái authentication
- User data nếu đã đăng nhập
- Error message nếu có lỗi

### 2. Kiểm tra API endpoints

```bash
# Test current-user API
curl -X GET http://localhost:3000/api/current-user -v

# Test organizations API
curl -X GET http://localhost:3000/api/organizations -v
```

### 3. Kiểm tra browser console

Mở Developer Tools > Console và xem:
- Network requests
- Error messages
- Authentication logs

### 4. Kiểm tra React Query DevTools

Mở Developer Tools > React Query Devtools để xem:
- Query status
- Error details
- Cache state

## Giải pháp đã implement

### 1. Sửa API permissions

- **GET /api/organizations**: Cho phép tất cả authenticated users
- **POST/PUT/DELETE /api/organizations**: Chỉ admin

### 2. Cải thiện error handling

- Thêm retry logic cho React Query
- Không retry khi lỗi 401/403
- Hiển thị thông báo lỗi rõ ràng

### 3. Thêm error UI

- Hiển thị error page khi có lỗi
- Nút "Đăng nhập lại" khi unauthorized
- Debug logs trong console

## Cách test

1. **Đăng nhập bình thường**
   - Vào `/login`
   - Đăng nhập với tài khoản hợp lệ
   - Kiểm tra `/tickets` page

2. **Test với session hết hạn**
   - Đăng nhập
   - Đợi session hết hạn
   - Refresh page
   - Kiểm tra error handling

3. **Test với user không có quyền**
   - Đăng nhập với user không phải admin
   - Kiểm tra access to organizations

## Logs cần kiểm tra

### Browser Console
```
TicketsPage - hasError: true
TicketsPage - errorMessage: "Unauthorized - Please login again"
```

### Network Tab
- Status: 401 Unauthorized
- Response: `{"error":"User not authenticated"}`

### React Query DevTools
- Query status: error
- Error message: "Unauthorized - Please login again"

## Troubleshooting

### Nếu vẫn lỗi 403:

1. **Kiểm tra user role**
   ```sql
   SELECT role FROM profiles WHERE id = 'user_id';
   ```

2. **Kiểm tra middleware**
   - Xem file `src/lib/api-middleware.ts`
   - Kiểm tra `withAuth` function

3. **Kiểm tra Supabase session**
   - Xem browser storage
   - Kiểm tra cookies

### Nếu lỗi 401:

1. **Kiểm tra login flow**
   - Xem file `src/app/login/page.tsx`
   - Kiểm tra redirect sau login

2. **Kiểm tra middleware**
   - Xem file `src/middleware.ts`
   - Kiểm tra auth check

3. **Kiểm tra Supabase config**
   - Environment variables
   - Supabase client setup 