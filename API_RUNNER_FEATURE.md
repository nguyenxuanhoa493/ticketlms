# API Runner Feature

## 📋 Overview

Feature Call API cho phép admin test và chạy API requests với tự động login và quản lý credentials.

## 🎯 Features

### Core Functionality
- ✅ **Environment Selection** - Chọn môi trường từ danh sách đã cấu hình
- ✅ **Auto Login** - Tự động login nếu chưa có token
- ✅ **HTTP Methods** - Support GET, POST, PUT, DELETE
- ✅ **JSON Payload** - Editor với validation và format
- ✅ **DMN Override** - Override `_sand_domain` parameter
- ✅ **Response Viewer** - Formatted JSON response với metadata
- ✅ **Copy Response** - Copy response to clipboard
- ✅ **Error Handling** - Clear error messages và debugging info

### Template Management (NEW! 🎉)
- ✅ **Save Template** - Lưu toàn bộ cấu hình request để tái sử dụng
- ✅ **Load Template** - Load lại cấu hình đã lưu
- ✅ **Folder Tree Structure** - Tổ chức templates theo cấu trúc thư mục
- ✅ **Expand/Collapse Folders** - Điều hướng dễ dàng qua folder tree
- ✅ **Delete Template** - Xóa template không cần thiết
- ✅ **Auto-fill** - Template tự động điền tất cả fields

### Security
- ✅ Admin-only access (via withAdmin middleware)
- ✅ Encrypted credentials in database
- ✅ Automatic decryption on execution
- ✅ Token never exposed to frontend
- ✅ Secure credential handling
- ✅ RLS for templates (user chỉ thấy templates của mình)

## 📁 Architecture

### Backend Components

#### 1. LMS Client (`src/lib/lms-client.ts`)
TypeScript implementation tương tự Python Lms class:

```typescript
class LmsClient {
  // Auto login and get token
  async login(): Promise<LmsLoginResult>
  
  // Send API request với auto-login
  async send(options: LmsSendOptions): Promise<LmsSendResult>
  
  // Helper methods
  private encodeFormData(data): string
  private flattenPayload(obj): Record<string, string>
}
```

**Features:**
- Auto-login if no token
- Form-urlencoded payload encoding
- Nested object flattening (e.g., `user[name]`)
- Array handling với indexed keys
- Base params auto-attachment (`_sand_domain`, `_sand_token`, etc.)
- Response encryption handling

#### 2. API Route (`src/app/api/tools/api-runner/route.ts`)

**Endpoint:** `POST /api/tools/api-runner`

**Request Body:**
```json
{
  "environmentId": "uuid",
  "path": "/user/api/search",
  "method": "POST",
  "payload": { "ntype": "user", "iid": 123 },
  "dmn": "optional-override-domain"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": { /* API response data */ },
    "metadata": {
      "statusCode": 200,
      "responseTime": 345,
      "requestUrl": "https://..."
    },
    "environment": {
      "name": "STAGING",
      "host": "https://...",
      "dmn": "staging"
    }
  },
  "message": "API call executed successfully"
}
```

**Flow:**
1. Validate request (environmentId, path required)
2. Fetch environment from database
3. Decrypt credentials
4. Create LmsClient instance
5. Execute API call (auto-login if needed)
6. Return response với metadata

### Frontend Component

#### 3. UI Page (`src/app/tools/api-runner/page.tsx`)

**Layout:** 2-column grid (Request Configuration | Response)

**Left Panel - Request Configuration:**
- Environment selector (dropdown)
- Path input (`/user/api/search`)
- DMN input (optional override)
- Method selector (GET/POST/PUT/DELETE)
- Payload editor (JSON textarea với format button)
- Execute button (với loading state)

**Right Panel - Response:**
- Metadata badge (status code, response time)
- Error display (red alert box)
- Response viewer (formatted JSON, dark theme)
- Copy button (clipboard)
- Empty state / Loading state

**Features:**
- Real-time validation
- JSON format button
- Auto-fetch environments
- Loading indicators
- Error handling UI
- Copy to clipboard

## 🚀 Usage

### 1. Setup Environment

Vào `/tools/environments` và tạo môi trường:

```json
{
  "name": "STAGING",
  "host": "https://staging-api.lotuslms.com",
  "dmn": "staging",
  "user_code": "admin@example.com",
  "pass_master": "encrypted-password",
  "headers": { "Content-Type": "application/x-www-form-urlencoded" },
  "base_params": { "version": "1.0" }
}
```

### 2. Call API

1. Vào `/tools/api-runner`
2. Chọn môi trường từ dropdown
3. Nhập path: `/user/api/search`
4. Chọn method: `POST`
5. Nhập payload:
```json
{
  "ntype": "user",
  "textOp": "$like",
  "codes": "admin"
}
```
6. (Optional) Override DMN nếu cần
7. Click **Thực thi**

### 3. View Response

Response hiển thị với:
- ✅ Status code badge (200 = green, error = red)
- ✅ Request URL
- ✅ Response time (ms)
- ✅ Formatted JSON response
- ✅ Copy button

## 🔧 Technical Details

### Form-Urlencoded Encoding

API LMS expects `application/x-www-form-urlencoded` format:

**Input:**
```json
{
  "user": {
    "name": "John",
    "age": 30
  },
  "roles": ["admin", "user"]
}
```

**Encoded:**
```
user[name]=John&user[age]=30&roles[0]=admin&roles[1]=user
```

### Base Parameters Auto-Attachment

Mọi request tự động attach:
- `_sand_domain` - From environment config
- `_sand_token` - From login response
- `_sand_uiid` - User iid
- `_sand_uid` - User id
- Custom base_params from environment

### Login Flow

```
1. User clicks "Thực thi"
2. LmsClient checks token
3. If no token → auto login
4. POST /user/login với credentials
5. Store token + params
6. Execute actual API request
7. Return response
```

### Error Handling

**Frontend validation:**
- Environment not selected
- Path empty
- Invalid JSON payload

**Backend errors:**
- Environment not found
- Decryption failed
- Login failed
- API call failed
- Network errors

All errors display với clear messages.

## 📊 Example Use Cases

### 1. Search Users
```json
{
  "path": "/user/api/search",
  "method": "POST",
  "payload": {
    "ntype": "user",
    "textOp": "$like",
    "codes": "admin"
  }
}
```

### 2. Get Course Detail
```json
{
  "path": "/course/detail",
  "method": "POST",
  "payload": {
    "iid": 123,
    "ntype": "course"
  }
}
```

### 3. Update User
```json
{
  "path": "/user/update",
  "method": "POST",
  "payload": {
    "iid": 456,
    "name": "New Name"
  }
}
```

### 4. Override Domain
```json
{
  "path": "/user/api/search",
  "dmn": "other-domain",
  "payload": { "ntype": "user" }
}
```

## 🎨 UI/UX Features

### Visual Feedback
- Loading spinner khi executing
- Disabled button khi loading
- Status badge colors (green/red)
- Empty state messages
- Error alerts với icons

### Convenience Features
- JSON Format button (auto-indent)
- Copy response button (với confirmation)
- Auto-select environment on page load
- Form validation before submit
- Clear error messages

### Responsive Design
- 2-column grid trên desktop
- Single column trên mobile
- Scrollable response viewer
- Fixed height với overflow

## 🔐 Security Considerations

1. **Admin Only** - withAdmin middleware protection
2. **Encrypted Storage** - Passwords encrypted in DB
3. **Secure Decryption** - Only decrypted on execution
4. **No Token Exposure** - Token stays in backend
5. **Validation** - All inputs validated
6. **Error Messages** - No sensitive data in errors

## 📈 Future Enhancements

### Phase 2 (COMPLETED ✅)
- [x] Request templates
- [x] Folder tree structure
- [x] Save/Load templates
- [x] Delete templates

### Phase 2.5 (Next)
- [ ] Request history (save to DB)
- [ ] Rename/Move templates
- [ ] Duplicate templates
- [ ] Export/Import templates (JSON)
- [ ] Search templates
- [ ] Favorite templates

### Phase 3
- [ ] Response assertions/testing
- [ ] Batch requests
- [ ] Request chaining
- [ ] Environment variables
- [ ] Pre-request scripts
- [ ] Response time graphs

### Phase 4
- [ ] Team collaboration
- [ ] Request sharing
- [ ] API documentation generator
- [ ] Mock server
- [ ] Webhook testing

## 📝 Files Structure

```
src/
├── lib/
│   └── lms-client.ts              # LMS client class
├── app/
│   ├── api/tools/
│   │   ├── api-runner/
│   │   │   └── route.ts           # API runner endpoint
│   │   └── templates/
│   │       └── route.ts           # Template CRUD endpoints (NEW!)
│   └── tools/api-runner/
│       └── page.tsx               # UI page with templates (UPDATED!)
├── components/tools/
│   └── ToolsSidebar.tsx           # Sidebar navigation
└── types/
    └── index.ts                   # Added template types (NEW!)

supabase/migrations/
├── create_api_environments.sql
└── create_api_request_templates.sql  # Template table (NEW!)

scripts/
└── run-migration.js               # Migration helper (NEW!)
```

## 🐛 Troubleshooting

### Issue: Login failed
**Solution:** Check credentials in environment config

### Issue: Invalid JSON payload
**Solution:** Click Format button or fix JSON syntax

### Issue: Environment not found
**Solution:** Make sure environment is active

### Issue: Decryption failed
**Solution:** Check ENCRYPTION_KEY in .env.local

### Issue: CORS error
**Solution:** Check host URL in environment config

## ✅ Testing Checklist

- [ ] Select environment
- [ ] Enter valid path
- [ ] Enter valid JSON payload
- [ ] Click Execute
- [ ] Verify auto-login
- [ ] Check response displayed
- [ ] Test copy button
- [ ] Test format button
- [ ] Test error handling
- [ ] Test DMN override
- [ ] Test all HTTP methods

---

## 🎉 Summary

**API Runner** là công cụ mạnh mẽ cho admin để:
- Test API endpoints nhanh chóng
- Tự động handle authentication
- Debug API responses
- Explore API functionality
- Save time với auto-login

**Tương tự Python Lms class nhưng web-based và user-friendly!**
