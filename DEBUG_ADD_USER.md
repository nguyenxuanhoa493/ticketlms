# Debug: Cannot Add New User

## Issue
Không thể thêm user mới từ menu Users.

## Checklist to Debug

### 1. Frontend Check
- [ ] Dialog có mở khi click "Thêm Người dùng"?
- [ ] Form fields có render đúng không?
- [ ] Submit button có disabled không?
- [ ] Check browser console có error gì?
- [ ] Check Network tab xem có POST request đến `/api/users`?

### 2. API Check
```bash
# Test API directly
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "full_name": "Test User",
    "role": "user",
    "organization_id": "your-org-id"
  }'
```

### 3. Current User Role
- [ ] Đảm bảo current user có role = "admin"
- [ ] Check API middleware `withAdmin` hoạt động đúng

### 4. Database/RLS
- [ ] Check Supabase policies cho bảng `profiles`
- [ ] Check Supabase auth.admin.createUser có permissions

### 5. Common Issues

**Issue 1: organization_id validation**
```typescript
// In POST handler
organization_id: organization_id || user.organization_id
```
Nếu không có organization_id và user.organization_id cũng null → có thể fail constraint

**Issue 2: Auth create user**
```typescript
const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
});
```
Cần check authError message

**Issue 3: Profile insert**
Có thể fail do:
- Missing required fields
- RLS policy block
- Constraint violation

### 6. How to Test

1. **Open browser console**
   - Go to /users page
   - Click "Thêm Người dùng"
   - Fill form
   - Click "Tạo mới"
   - Check console for errors

2. **Check Network tab**
   - Look for POST /api/users request
   - Check request payload
   - Check response status and body

3. **Check Supabase logs**
   - Go to Supabase Dashboard
   - Logs → API logs
   - Look for failed requests

### 7. Quick Fix Ideas

**If validation error:**
```typescript
// Make organization_id optional for admin
organization_id: organization_id || null
```

**If auth error:**
```typescript
// Add better error logging
if (authError) {
    console.error("Auth creation error:", authError);
    return NextResponse.json({ 
        error: authError.message,
        details: authError 
    }, { status: 400 });
}
```

**If RLS policy:**
```sql
-- Check profiles INSERT policy
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- May need to allow service role
CREATE POLICY "Service role can insert profiles"
ON profiles FOR INSERT
TO service_role
WITH CHECK (true);
```

### 8. Expected Flow

1. User clicks "Thêm Người dùng" button
2. Dialog opens with empty form
3. User fills: email, full_name, role, organization, password
4. User clicks "Tạo mới"
5. `handleSubmit` validates fields
6. POST to `/api/users` with data
7. API creates auth user
8. API creates profile record
9. Success toast appears
10. Dialog closes
11. User list refreshes

### 9. Test Commands

```bash
# Check if dev server is running
curl http://localhost:3000/api/users

# Check current user
curl http://localhost:3000/api/current-user

# Check organizations (need for org_id)
curl http://localhost:3000/api/organizations
```
