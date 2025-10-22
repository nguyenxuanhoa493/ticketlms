# Authentication API

## Overview

Authentication trong TicketLMS sử dụng **Supabase Auth** với JWT-based sessions stored trong httpOnly cookies.

## Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. POST /login
       │    { email, password }
       ▼
┌─────────────────┐
│  Supabase Auth  │
└──────┬──────────┘
       │ 2. Validate credentials
       │    Generate JWT + Refresh token
       │
       │ 3. Set httpOnly cookies:
       │    - sb-{project}-auth-token
       │    - sb-{project}-auth-token.0
       │    - sb-{project}-auth-token.1
       ▼
┌─────────────┐
│  Middleware │
└──────┬──────┘
       │ 4. Verify JWT on each request
       │    Auto-refresh if expired
       ▼
┌─────────────┐
│  Protected  │
│   Routes    │
└─────────────┘
```

## Endpoints

### Current User

#### GET `/api/current-user`

**Lấy thông tin user hiện tại.**

**Authentication:** Required (JWT cookie)

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "full_name": "Nguyen Van A",
  "role": "admin|manager|user",
  "organization_id": "uuid",
  "avatar_url": "https://...",
  "bio": "...",
  "created_at": "2024-01-01T00:00:00Z"
}
```

**Errors:**
- `401` - Unauthorized (no valid session)

---

#### GET `/api/profile`

**Lấy profile của user hiện tại (tương tự current-user).**

**Authentication:** Required

**Response:** Same as `/api/current-user`

---

### User Management

#### GET `/api/users`

**List tất cả users (Admin only).**

**Authentication:** Required (Admin role)

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page
- `search` (string) - Search by name or email
- `role` (string) - Filter by role
- `organization_id` (string) - Filter by organization

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Nguyen Van A",
      "role": "user",
      "organization_id": "uuid",
      "organization": {
        "id": "uuid",
        "name": "VietED"
      },
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)

---

#### POST `/api/users`

**Tạo user mới (Admin only).**

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "********",
  "full_name": "Nguyen Van B",
  "role": "user|manager|admin",
  "organization_id": "uuid"
}
```

**Required Fields:**
- `email` - Valid email
- `password` - Min 6 characters
- `full_name`
- `role`

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "newuser@example.com",
    "full_name": "Nguyen Van B",
    "role": "user"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `409` - Email already exists

---

#### PUT `/api/users`

**Update user info (Admin only).**

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "id": "uuid",
  "full_name": "Updated Name",
  "role": "manager",
  "organization_id": "new-org-uuid",
  "avatar_url": "https://...",
  "bio": "Updated bio"
}
```

**Required Fields:**
- `id` - User ID to update

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": { /* updated user */ }
}
```

**Errors:**
- `400` - Missing ID or validation error
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found

---

#### DELETE `/api/users`

**Xóa user (Admin only).**

**Authentication:** Required (Admin role)

**Query Parameters:**
- `id` (required) - User ID to delete

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Errors:**
- `400` - Missing ID
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found

---

### Password Management

#### POST `/api/users/change-password`

**Đổi password của user hiện tại.**

**Authentication:** Required

**Request Body:**
```json
{
  "currentPassword": "********",
  "newPassword": "********"
}
```

**Validation:**
- `currentPassword` - Required, must match current password
- `newPassword` - Required, min 6 characters

**Response:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `400` - Validation error
- `401` - Current password incorrect
- `500` - Internal error

---

#### POST `/api/users/reset-password`

**Reset password của user khác (Admin only).**

**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "userId": "uuid",
  "newPassword": "********"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully for user {email}"
}
```

**Errors:**
- `400` - Missing fields
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - User not found

---

### Admin Tools

#### POST `/api/admin/revoke-all-sessions`

**Revoke tất cả sessions, force logout all users (Admin only).**

**Authentication:** Required (Admin key)

**Query Parameters:**
- `admin_key` (required) - Admin secret key from env

**Response:**
```json
{
  "success": true,
  "message": "Successfully revoked all sessions",
  "revokedCount": 25,
  "failedCount": 0,
  "totalUsers": 25,
  "method": "database_delete",
  "note": "All sessions cleared. Users must login again."
}
```

**Errors:**
- `401` - Unauthorized (invalid admin key)
- `500` - Database error

**Note:** Nếu API method fail, dùng SQL manual:
```sql
DELETE FROM auth.sessions;
DELETE FROM auth.refresh_tokens;
```

---

### Debug

#### GET `/api/debug/whoami`

**Debug endpoint để check authentication status.**

**Authentication:** Required

**Response:**
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  },
  "session": {
    "expires_at": 1234567890
  }
}
```

---

## Authentication Headers

### Request Headers

Không cần manual headers! Authentication được handle tự động qua cookies:

```
Cookie: sb-{project-ref}-auth-token=<jwt-token>
```

### Response Headers

```
Set-Cookie: sb-{project-ref}-auth-token=<token>; HttpOnly; Secure; SameSite=Lax; Path=/
```

---

## Error Codes

| Code | Meaning | Common Cause |
|------|---------|--------------|
| 400 | Bad Request | Validation error, missing fields |
| 401 | Unauthorized | No session, expired token, wrong password |
| 403 | Forbidden | Insufficient permissions (not admin) |
| 404 | Not Found | User/resource not found |
| 409 | Conflict | Email already exists |
| 500 | Internal Error | Database error, server error |

---

## Session Management

### Session Duration
- **Access Token**: 1 hour
- **Refresh Token**: 7 days (auto-renew)
- **Session**: As long as refresh token valid

### Auto-Refresh
- Middleware automatically refreshes expired tokens
- Transparent to client
- No manual handling needed

### Logout
```typescript
// Client-side
import { getBrowserClient } from '@/lib/supabase/browser-client';

const supabase = getBrowserClient();
await supabase.auth.signOut();

// Redirect to login
window.location.href = '/login';
```

### Force Logout (Admin)
See `/api/admin/revoke-all-sessions` above

---

## Security Best Practices

### ✅ DO
- Use httpOnly cookies (default)
- Validate input on server
- Check permissions in middleware
- Use service role key only on server
- Hash passwords (handled by Supabase)

### ❌ DON'T
- Store JWT in localStorage
- Expose service role key to client
- Skip permission checks
- Use weak passwords
- Share sessions between users

---

## Common Issues & Solutions

### Issue: "refresh_token_not_found"
**Solution:** Clear invalid cookies, login again
**See:** `docs-ai/fixes/FIX_LOGIN_ISSUE.md`

### Issue: "Unauthorized" on valid session
**Solution:** Check middleware, verify cookies set
**See:** `docs-ai/fixes/FIX_MIDDLEWARE_ERROR.md`

### Issue: Session shared between users
**Solution:** Never use singleton client pattern
**See:** `docs-ai/PROJECT_OVERVIEW.md` - Session Management

---

## Testing

### Using curl

```bash
# Login (get cookies)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your_password_here"}'

# Use authenticated endpoint
curl -b cookies.txt http://localhost:3000/api/current-user

# Logout
curl -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

### Using Browser DevTools

```javascript
// Check current session
const res = await fetch('/api/current-user');
const user = await res.json();
console.log(user);

// Logout
await fetch('/api/auth/logout', { method: 'POST' });
```

---

## Related Documentation

- [User Management API](./USERS_API.md)
- [Session Issues Fix](../fixes/FIX_LOGIN_ISSUE.md)
- [Project Overview](../PROJECT_OVERVIEW.md)
- [Tech Stack](../TECH_STACK.md)

---

**Last Updated**: 2025-01-19
