# Hướng dẫn Revert Version 1.5.0

## Thông tin Version
- **Version**: v1.5.0
- **Commit**: 99bd42f64019828551615fb08c8806a1b807c4e5
- **Tag**: v1.5.0
- **Ngày**: Thu Oct 16 17:12:40 2025 +0700

## Cách Revert về Version trước đó

### 1. Xem các version có sẵn
```bash
git tag -l
git log --oneline
```

### 2. Revert về commit trước v1.5
```bash
# Xem commit trước v1.5
git log --oneline -5

# Revert về commit b7ae3fb (fix login)
git reset --hard b7ae3fb

# Hoặc revert về tag cụ thể (nếu có)
git reset --hard v1.4.0
```

### 3. Revert về v1.5 sau khi đã revert
```bash
# Nếu muốn quay lại v1.5
git reset --hard v1.5.0

# Hoặc dùng commit hash
git reset --hard 99bd42f
```

## Các Changes trong v1.5.0

### User Management
- ✅ Fix user list: display email and organization name
- ✅ PUT/DELETE endpoints for user CRUD
- ✅ Fix duplicate key error (UPSERT)
- ✅ Fix password reset endpoint
- ✅ Fix autofill issues
- ✅ Cache improvements

### Ticket System
- ✅ Fix organization field in edit form
- ✅ Optimize React Query cache
- ✅ Shared hooks for cache

### UI/UX
- ✅ Remove changelog menu
- ✅ Better select components
- ✅ Improved error handling

### Files Changed
- 58 files changed
- 1,571 insertions(+)
- 945 deletions(-)

## Lưu ý quan trọng

⚠️ **TRƯỚC KHI REVERT:**
1. Backup database nếu có schema changes
2. Check xem có uncommitted changes không
3. Notify team nếu đang làm việc nhóm

⚠️ **SAU KHI REVERT:**
1. Chạy `npm install` nếu có thay đổi dependencies
2. Restart dev server
3. Clear browser cache
4. Test lại các tính năng

## Commands hữu ích

```bash
# Xem thông tin tag
git show v1.5.0

# Xem diff giữa 2 versions
git diff v1.4.0..v1.5.0

# Tạo branch từ v1.5
git checkout -b backup-v1.5 v1.5.0

# Xem file cụ thể ở version cũ
git show b7ae3fb:src/app/users/page.tsx
```
