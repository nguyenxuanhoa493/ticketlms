# Notification System Debug & Fix Summary

## Vấn đề đã phát hiện

Hệ thống thông báo không hoạt động vì:

1. **Missing `parent_id` in comment creation** - Khi tạo reply comment, `parent_id` không được lưu vào database
2. **Missing notifications table** - Bảng notifications chưa được tạo trong database
3. **Missing database triggers** - Không có triggers tự động tạo thông báo khi:
   - Có người bình luận vào ticket của bạn
   - Có người trả lời bình luận của bạn
   - Ticket của bạn thay đổi trạng thái

## Các thay đổi đã thực hiện

### 1. Fix API Route - Comment Creation (`src/app/api/tickets/[id]/comments/route.ts`)

**Thay đổi:**
- Thêm `parent_id` vào destructuring từ request body
- Lưu `parent_id` khi tạo comment mới
- Thêm `created_by` vào query để phục vụ notification logic

**Code:**
```typescript
// Before
const { content } = body;
const commentData = {
    content: content.trim(),
    ticket_id: ticketId,
    user_id: user.id,
};

// After
const { content, parent_id } = body;
const commentData = {
    content: content.trim(),
    ticket_id: ticketId,
    user_id: user.id,
    parent_id: parent_id || null, // ✅ Now saves parent_id for replies
};
```

### 2. Database Migration - Notifications Table and Triggers

**File:** `supabase/migrations/20250208000000_create_notifications_and_triggers.sql`

#### 2.1. Created `notifications` table:
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,           -- Người nhận thông báo
    type notification_type NOT NULL,  -- Loại thông báo
    title TEXT NOT NULL,              -- Tiêu đề
    message TEXT NOT NULL,            -- Nội dung
    is_read BOOLEAN DEFAULT FALSE,    -- Đã đọc chưa
    ticket_id UUID,                   -- Liên kết với ticket
    comment_id UUID,                  -- Liên kết với comment
    created_by UUID,                  -- Người tạo thông báo
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### 2.2. Created automatic notification triggers:

##### A. Comment Notification Trigger (`create_comment_notification()`)
**Kích hoạt:** Sau khi INSERT vào bảng `comments`

**Logic:**
1. **Nếu là reply comment** (`parent_id` IS NOT NULL):
   - Tạo thông báo cho người tạo comment gốc (nếu khác người reply)
   - Tạo thông báo cho người tạo ticket (nếu khác 2 người trên)
   
2. **Nếu là comment trực tiếp** (`parent_id` IS NULL):
   - Tạo thông báo cho người tạo ticket (nếu khác người comment)

**Ví dụ:**
```
Ticket của User A
├─ Comment của User B -> User A nhận thông báo: "User B đã bình luận trong ticket của bạn"
   └─ Reply của User C -> User B nhận: "User C đã trả lời bình luận của bạn"
                       -> User A nhận: "User C đã bình luận trong ticket của bạn"
```

##### B. Ticket Status Change Trigger (`create_ticket_status_notification()`)
**Kích hoạt:** Sau khi UPDATE bảng `tickets` và `status` thay đổi

**Logic:**
1. Tạo thông báo cho người tạo ticket (nếu khác người update)
2. Tạo thông báo cho người được assign (nếu khác người tạo và người update)

**Ví dụ:**
```
User A tạo ticket
User B (admin) thay đổi status từ "open" -> "in_progress"
-> User A nhận: "User B đã thay đổi trạng thái ticket 'XXX' thành 'Đang xử lý'"
```

#### 2.3. Row Level Security (RLS) Policies:
```sql
-- Users can view their own notifications
-- Users can update their own notifications (mark as read)
-- Users can delete their own notifications
```

## Cách kiểm tra

### 1. Apply migration:
```bash
# Chạy migration trên Supabase
# Hoặc apply trực tiếp từ Supabase Dashboard
```

### 2. Test notification creation:

#### Test 1: Comment notification
1. User A tạo một ticket
2. User B comment vào ticket đó
3. ✅ User A sẽ nhận thông báo: "User B đã bình luận trong ticket của bạn"

#### Test 2: Reply notification
1. User A tạo ticket và comment
2. User B reply vào comment của User A
3. ✅ User A sẽ nhận 2 thông báo:
   - "User B đã trả lời bình luận của bạn"
   - "User B đã bình luận trong ticket của bạn"

#### Test 3: Status change notification
1. User A tạo ticket với status "open"
2. Admin thay đổi status thành "in_progress"
3. ✅ User A sẽ nhận thông báo: "Admin đã thay đổi trạng thái ticket thành 'Đang xử lý'"

### 3. Check notifications in UI:
```typescript
// API đã có sẵn tại:
GET /api/notifications - Lấy danh sách thông báo
PUT /api/notifications/[id] - Đánh dấu đã đọc
POST /api/notifications/mark-all-read - Đánh dấu tất cả đã đọc
```

## Lưu ý quan trọng

1. **Migration phải chạy trước**: Phải apply migration SQL trước khi test để tạo bảng và triggers
2. **Database triggers tự động**: Không cần thay đổi code API nào khác, triggers sẽ tự động tạo notifications
3. **Performance**: Đã thêm indexes cho các trường hay query (user_id, ticket_id, is_read, created_at)
4. **Security**: RLS policies đảm bảo users chỉ xem được notifications của mình

## Files thay đổi

1. ✅ `src/app/api/tickets/[id]/comments/route.ts` - Fix parent_id
2. ✅ `supabase/migrations/20250208000000_create_notifications_and_triggers.sql` - Tạo table và triggers
3. ✅ `NOTIFICATION_FIX_SUMMARY.md` - Documentation này

## Next Steps

1. Apply migration lên Supabase
2. Test các scenarios trên
3. Kiểm tra UI notifications dropdown hoạt động đúng
4. (Optional) Thêm real-time subscriptions cho notifications mới

---

**Date:** 2025-02-08  
**Status:** ✅ Fixed and Ready to Test
