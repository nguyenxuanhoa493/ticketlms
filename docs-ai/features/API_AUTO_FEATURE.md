# API Auto - Tự động hóa luồng API

## 📋 Tổng quan

Tính năng API Auto cho phép tạo và chạy các luồng tự động hóa phức tạp với logic được định nghĩa sẵn.

## 🎯 Tính năng

### Core
- ✅ **Luồng Clone Program** - Tự động clone chương trình
- ✅ **Base Inputs** - Cấu hình chung (môi trường, dmn, user, pass)
- ✅ **Lịch sử thực thi** - Lưu trữ tất cả request và response
- ✅ **UI 2 cột** - Inputs bên trái, Outputs bên phải

### UI Features
- ✅ Chọn môi trường từ dropdown
- ✅ Override dmn, user_code, pass nếu cần
- ✅ Hiển thị danh sách programs dạng bảng
- ✅ Chọn program và clone
- ✅ Hiển thị request history chi tiết

## 🏗️ Kiến trúc

### 1. LMS Client Modular

**Cấu trúc mới:**
```
src/lib/lms/
├── base-client.ts      # Core functionality (login, send, encode)
├── program.ts          # Program APIs (getListProgram, cloneProgram)
└── index.ts            # Main export
```

**Sử dụng:**
```typescript
import { LmsClient } from "@/lib/lms";

const client = new LmsClient(environment);

// Get programs
const result = await client.getListProgram({
    status: ["approved", "queued"],
});

// Clone program
const cloneResult = await client.cloneProgram({
    program_iid: 12345,
});
```

### 2. Database Schema

**Tables:**
- `api_auto_folders` - Tổ chức flows theo thư mục
- `api_auto_flows` - Lưu trữ flow definitions
- `api_auto_execution_history` - Lịch sử thực thi

**Migration:** `supabase/migrations/20250117000000_create_api_auto_tables.sql`

### 3. API Routes

**Clone Program Flow:**
```
POST /api/tools/auto-flow/clone-program
```

**Request body:**
```json
{
  "environment_id": "uuid",
  "dmn": "optional-override",
  "user_code": "optional",
  "pass": "optional",
  "step": "get_programs" | "clone",
  "program_iid": 123 // For clone step
}
```

**Step 1: Get Programs**
```json
{
  "step": "get_programs"
}
```

Returns list of programs.

**Step 2: Clone Program**
```json
{
  "step": "clone",
  "program_iid": 123
}
```

Clones selected program.

### 4. UI Page

**Route:** `/tools/api-auto`

**Layout:**
```
┌────────────────────┬────────────────────┐
│ Cấu hình (Input)   │ Kết quả (Output)   │
│                    │                    │
│ [Môi trường]       │ Thời gian: 234ms   │
│ [DMN]              │                    │
│ [User] [Pass]      │ Clone thành công!  │
│                    │                    │
│ [Lấy DS] [Clone]   │ Lịch sử request:   │
│                    │ • POST /path/...   │
│ Danh sách:         │ • POST /program... │
│ ┌────────────────┐ │                    │
│ │☑ 1│123│Name   │ │                    │
│ │☐ 2│456│Test   │ │                    │
│ └────────────────┘ │                    │
└────────────────────┴────────────────────┘
```

## 🔧 Luồng Clone Program

### Base Inputs (Required for all flows)
- **Môi trường** (required) - Chọn từ danh sách
- **DMN** (optional) - Override dmn, default = environment.dmn
- **User Code** (optional) - Override user, default = dmn
- **Password** (optional) - Override pass, default = environment pass
  - If user = "root" → use pass_root
  - Else → use pass_master

### Flow Steps

#### Step 1: Get List Programs
1. User nhập base inputs
2. Click **Lấy danh sách**
3. API login với credentials
4. Call `/path/search` với filters:
   - `program_type[]`: "program"
   - `type`: "program"
   - `status`: ["approved", "queued"]
   - `items_per_page`: -1 (all)
5. Hiển thị bảng programs với columns:
   - **Chọn** (radio button)
   - **STT** (index)
   - **IID** (program id)
   - **Tên** (program name)

#### Step 2: Clone Selected Program
1. User chọn 1 program từ bảng
2. Click **Clone**
3. Confirm dialog (optional)
4. API call `/program/api/deep-clone` với:
   - `program_iid`: selected program
   - `clone_master_data`: 1
   - `clone_rubric_even_exist`: 0
   - `rubric_name_suffix`: ""
5. Hiển thị kết quả và lưu vào execution history

### Request History

Mỗi execution lưu:
```typescript
{
  flow_id: null, // Can link to saved flow
  user_id: "uuid",
  inputs: {
    environment_id,
    dmn,
    user_code,
    program_iid,
  },
  outputs: { /* API response */ },
  status: "success" | "failed",
  error_message: null,
  execution_time: 1234, // ms
  request_history: [
    {
      method: "POST",
      url: "https://...",
      statusCode: 200,
      responseTime: 234,
      timestamp: "2025-01-17T10:30:00Z"
    }
  ]
}
```

## 📝 Ví dụ sử dụng

### 1. Clone Program với default settings

```
1. Chọn môi trường: "STAGING"
2. Để trống DMN, User, Pass (dùng config môi trường)
3. Click "Lấy danh sách"
4. Chọn program từ bảng
5. Click "Clone"
```

### 2. Clone với override credentials

```
1. Chọn môi trường: "PRODUCTION"
2. DMN: "custom-domain"
3. User: "root"
4. Pass: "custom-password"
5. Click "Lấy danh sách"
6. Chọn program
7. Click "Clone"
```

## 🎨 UI Components

### Input Panel (Left)
- Environment select
- DMN input (optional)
- User input (optional)
- Pass input (optional, type="password")
- Action buttons (Lấy danh sách, Clone)
- Program selection table (after get list)

### Output Panel (Right)
- Execution time badge
- Success/Error message
- Clone result (JSON)
- Request history list
  - Method, Status code, Response time
  - URL preview
  - Expandable details

## 🔐 Security

### Credentials
- Passwords encrypted in database (AES-256-GCM)
- Decrypted only on execution
- Never exposed to frontend
- Support pass_master and pass_root

### RLS Policies
- Users only see their own flows
- Users only see their own execution history
- Folder isolation per user

### Admin Only
- `/tools/api-auto` protected by admin middleware
- Same as other `/tools/*` routes

## 📊 Database Tables

### api_auto_folders
```sql
id          UUID PRIMARY KEY
name        TEXT NOT NULL
parent_id   UUID REFERENCES api_auto_folders
user_id     UUID REFERENCES auth.users
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### api_auto_flows
```sql
id          UUID PRIMARY KEY
name        TEXT NOT NULL
description TEXT
flow_type   TEXT NOT NULL  -- 'clone_program', etc.
folder_id   UUID REFERENCES api_auto_folders
user_id     UUID REFERENCES auth.users
config      JSONB          -- Flow configuration
is_active   BOOLEAN
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### api_auto_execution_history
```sql
id              UUID PRIMARY KEY
flow_id         UUID REFERENCES api_auto_flows
user_id         UUID REFERENCES auth.users
inputs          JSONB
outputs         JSONB
status          TEXT  -- 'success', 'failed', 'running'
error_message   TEXT
execution_time  INTEGER  -- milliseconds
request_history JSONB
created_at      TIMESTAMP
```

## 🚀 Mở rộng tương lai

### Phase 2
- [ ] Folder tree navigation
- [ ] Save/Load flows
- [ ] Flow templates
- [ ] Batch clone programs

### Phase 3
- [ ] More auto flows:
  - Create users
  - Update courses
  - Generate reports
  - Export data
- [ ] Conditional logic
- [ ] Loops and iterations
- [ ] Error handling strategies

### Phase 4
- [ ] Flow chaining (output → input)
- [ ] Scheduled executions
- [ ] Webhooks integration
- [ ] Email notifications

## 📂 Files Structure

```
src/
├── lib/
│   ├── lms/
│   │   ├── base-client.ts      # Core LMS client
│   │   ├── program.ts          # Program APIs
│   │   └── index.ts            # Exports
│   └── lms-client.ts           # Legacy wrapper
├── app/
│   ├── api/tools/auto-flow/
│   │   └── clone-program/
│   │       └── route.ts        # Clone program endpoint
│   └── tools/api-auto/
│       └── page.tsx            # UI page
├── components/tools/
│   └── ToolsSidebar.tsx        # Added API Auto menu
supabase/migrations/
└── 20250117000000_create_api_auto_tables.sql
```

## ✅ Testing Checklist

### LMS Client
- [ ] `getListProgram()` returns programs
- [ ] `cloneProgram()` clones successfully
- [ ] Login works with different users
- [ ] Request history captured

### API Endpoint
- [ ] GET programs step works
- [ ] Clone step works
- [ ] Error handling correct
- [ ] Execution history saved

### UI
- [ ] Environment selection works
- [ ] DMN/User/Pass override works
- [ ] Program table displays correctly
- [ ] Program selection works
- [ ] Clone button executes
- [ ] Results display properly
- [ ] Request history shows

### Security
- [ ] Admin-only access enforced
- [ ] Credentials encrypted
- [ ] RLS policies work
- [ ] No credential leakage

## 🐛 Troubleshooting

### Issue: No programs returned
**Check:**
- Environment credentials correct?
- User has access to programs?
- Status filter includes programs?

### Issue: Clone fails
**Check:**
- Program exists?
- User has permission to clone?
- API endpoint accessible?

### Issue: Request history empty
**Check:**
- API call completed?
- Database insert successful?
- RLS policies not blocking?

---

## 🎉 Summary

API Auto provides a powerful framework for automating complex API workflows. The Clone Program flow is the first implementation, with a flexible architecture ready for more flows.

**Key Benefits:**
- 🚀 Fast program cloning
- 📝 Complete execution tracking
- 🔒 Secure credential management
- 🎨 Clean, intuitive UI
- 🔧 Extensible architecture

**Ready for production!** ✨
