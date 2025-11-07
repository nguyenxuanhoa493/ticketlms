# Replace Organization Todos with Tickets

## 🎯 Objective
Thay thế bảng `organization_todos` bằng việc sử dụng bảng `tickets` hiện có để quản lý công việc của organization.

## ❓ Why?
- ✅ **Tránh duplicate**: `tickets` đã có đầy đủ tính năng (status, priority, assigned_to, description...)
- ✅ **Tận dụng code có sẵn**: Tickets system đã có full CRUD, comments, notifications
- ✅ **Consistency**: Tất cả tasks đều ở một nơi, dễ quản lý
- ✅ **Features phong phú**: Tickets có comments, jira integration, attachments...

---

## 🗑️ What Was Removed

### 1. Database Table
**File**: `supabase/migrations/20250206000006_remove_organization_todos.sql`

Removed:
- ❌ `organization_todos` table
- ❌ Triggers: `log_todo_changes`, `set_organization_todos_completed_at`, `update_organization_todos_updated_at`
- ❌ Functions: `log_todo_activity()`, `set_todo_completed_at()`
- ❌ Policies: "Admins can manage all todos"
- ❌ Indexes: All `idx_org_todos_*`

### 2. API Routes
**Deleted**: `src/app/api/organizations/[id]/todos/route.ts`

Removed endpoints:
- ❌ `GET /api/organizations/[id]/todos`
- ❌ `POST /api/organizations/[id]/todos`
- ❌ `PUT /api/organizations/[id]/todos`
- ❌ `DELETE /api/organizations/[id]/todos`

### 3. Frontend Component
**Deleted**: `src/components/organizations/OrganizationTodos.tsx` (540 lines)

### 4. Types
**File**: `src/types/database.ts`

Removed:
- ❌ `organization_todos` table type definitions (Row, Insert, Update)

---

## ✨ What Was Added

### 1. New Component: OrganizationTickets
**File**: `src/components/organizations/OrganizationTickets.tsx`

**Features**:
- ✅ Display all tickets of organization
- ✅ Filter by status (open/in_progress/closed)
- ✅ Filter by priority (low/medium/high)
- ✅ Separate views: Open tickets vs Closed tickets
- ✅ Show assigned user, created date, closed date
- ✅ Status & priority badges
- ✅ Click to view ticket detail
- ✅ Quick link to create new ticket

**UI**:
```
┌─────────────────────────────────────────────┐
│ Tickets (5 đang mở)    [Tạo ticket]        │
├─────────────────────────────────────────────┤
│ Filters: [Status] [Priority]               │
│                                             │
│ Đang mở (5)                                │
│ ┌─────────────────────────────────────────┐│
│ │ Title | Status | Priority | Assigned    ││
│ │ ───────────────────────────────────────│ │
│ │ Fix bug | Mở | Cao | John Doe          ││
│ │ Feature | Đang xử lý | Trung bình      ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Đã đóng (3)                                │
│ ┌─────────────────────────────────────────┐│
│ │ Title | Priority | Assigned | Closed    ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

### 2. Updated Organization Detail Page
**File**: `src/app/organizations/[id]/page.tsx`

Changed:
- Tab "Công việc" → "Tickets"
- Import `OrganizationTodos` → `OrganizationTickets`
- Tab value `todos` → `tickets`

---

## 🔄 Migration Path

### Step 1: Run Database Migration
```bash
# Option 1: Supabase Dashboard
# Copy: supabase/migrations/20250206000006_remove_organization_todos.sql
# Paste to SQL Editor → Run

# Option 2: CLI
supabase db push
```

### Step 2: Existing Data
**Note**: Nếu có data trong `organization_todos`, cần migrate sang `tickets` trước khi xóa table:

```sql
-- Script to migrate todos to tickets (if needed)
INSERT INTO tickets (
    title,
    description,
    priority,
    status,
    organization_id,
    assigned_to,
    created_by,
    expected_completion_date,
    closed_at,
    created_at,
    updated_at
)
SELECT
    title,
    description,
    priority,
    CASE status
        WHEN 'pending' THEN 'open'
        WHEN 'in_progress' THEN 'in_progress'
        WHEN 'completed' THEN 'closed'
        WHEN 'cancelled' THEN 'closed'
    END as status,
    organization_id,
    assigned_to,
    created_by,
    due_date as expected_completion_date,
    completed_at as closed_at,
    created_at,
    updated_at
FROM organization_todos;
```

### Step 3: Deploy Frontend
```bash
git add .
git commit -m "refactor: Replace organization_todos with tickets"
git push
```

---

## 📊 Comparison

| Feature | organization_todos | tickets |
|---------|-------------------|---------|
| Title | ✅ | ✅ |
| Description | ✅ | ✅ |
| Priority (low/medium/high) | ✅ | ✅ |
| Status | 4 states | 3 states (open/in_progress/closed) |
| Assigned to | ✅ | ✅ |
| Due date | ✅ | ✅ (expected_completion_date) |
| **Comments** | ❌ | ✅ |
| **Attachments** | ❌ | ✅ |
| **Notifications** | ❌ | ✅ |
| **Jira integration** | ❌ | ✅ |
| **Activity log** | ❌ | ✅ |
| **Email notifications** | ❌ | ✅ |

**Winner**: `tickets` có nhiều features hơn!

---

## 🎨 User Experience Changes

### Before (Todos)
1. Vào organization detail
2. Click tab "Công việc"
3. Thấy todos list riêng biệt
4. Tạo todo mới trong modal
5. Không có comments, attachments

### After (Tickets)
1. Vào organization detail
2. Click tab "Tickets"
3. Thấy tất cả tickets của organization
4. Click "Tạo ticket" → chuyển tới tickets page với pre-filled organization
5. Click vào ticket → xem full detail với comments, history, attachments
6. Sử dụng full power của ticket system

---

## 🔗 Related Files Modified

### Database
- ✅ `supabase/migrations/20250206000006_remove_organization_todos.sql` (NEW)
- ✅ `supabase/migrations/20250206000004_create_organization_todos.sql` (DEPRECATED)
- ✅ `supabase/migrations/20250206000005_create_activity_triggers.sql` (Partial - todo triggers removed)

### Types
- ✅ `src/types/database.ts` - Removed `organization_todos`

### Components
- ❌ `src/components/organizations/OrganizationTodos.tsx` (DELETED)
- ✅ `src/components/organizations/OrganizationTickets.tsx` (NEW - 300 lines simpler!)

### Pages
- ✅ `src/app/organizations/[id]/page.tsx` - Updated imports and tab name

### API Routes
- ❌ `src/app/api/organizations/[id]/todos/route.ts` (DELETED)
- ✅ Use existing `/api/tickets` with `organization_id` filter

---

## 📋 Testing Checklist

### Before Migration
- [ ] Export existing todos data (if any)
- [ ] Backup database

### After Migration
- [ ] Tab "Tickets" hiển thị trong organization detail
- [ ] Tickets của organization hiển thị đúng
- [ ] Filters (status, priority) hoạt động
- [ ] Click ticket → navigate to ticket detail
- [ ] Button "Tạo ticket" hoạt động
- [ ] Không còn reference tới `organization_todos` trong code
- [ ] Build thành công không có errors

### Verify API
- [ ] `GET /api/tickets?organization_id={id}` returns correct tickets
- [ ] Old endpoints `/api/organizations/[id]/todos` return 404

---

## 🎯 Benefits Summary

1. **Code Simplification**
   - Removed 540 lines of component code
   - Removed full API route file
   - Removed database table + triggers + functions

2. **Feature Enhancement**
   - Users now get: comments, attachments, jira, notifications
   - Better UX with full ticket detail view
   - Consistent experience across app

3. **Maintenance**
   - Only one place to maintain task logic
   - Bugs fixed in tickets benefit all features
   - Easier to add new features

4. **Data Integrity**
   - All tasks in one table
   - Better reporting and analytics
   - Easier to implement cross-organization views

---

## ✅ Status: Complete

All changes implemented and ready for deployment! 🚀

**Note**: Nhớ migrate data (nếu có) trước khi chạy migration xóa table.
