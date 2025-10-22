# Tickets API

## Overview

Tickets API quản lý support tickets, comments, và tích hợp với Jira.

## Base URL

```
/api/tickets
```

---

## Tickets Management

### List Tickets

#### GET `/api/tickets`

**Lấy danh sách tickets với filtering và pagination.**

**Authentication:** Required

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | - | Search in title/description |
| `status` | string | - | Filter: `open`, `in_progress`, `resolved`, `closed` |
| `priority` | string | - | Filter: `low`, `medium`, `high`, `urgent` |
| `ticket_type` | string | - | Filter: `bug`, `feature`, `support`, `question` |
| `platform` | string | - | Filter: `web`, `mobile`, `api`, `other` |
| `assigned_to` | uuid | - | Filter by assignee |
| `created_by` | uuid | - | Filter by creator |
| `only_show_in_admin` | boolean | false | Filter admin-only tickets |
| `sort_by` | string | `created_at` | Sort field |
| `sort_order` | string | `desc` | Sort direction: `asc`, `desc` |

**Permissions:**
- **Admin**: Xem tất cả tickets (including admin-only)
- **Manager**: Xem tickets trong organization
- **User**: Chỉ xem tickets của mình

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Login button not working",
      "description": "Detailed description...",
      "status": "open",
      "priority": "high",
      "ticket_type": "bug",
      "platform": "web",
      "organization_id": "uuid",
      "assigned_to": "uuid",
      "created_by": "uuid",
      "expected_completion_date": "2024-02-01",
      "closed_at": null,
      "jira_link": "https://jira.../browse/TICKET-123",
      "only_show_in_admin": false,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z",
      "creator": {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "Nguyen Van A"
      },
      "assignee": {
        "id": "uuid",
        "email": "support@example.com",
        "full_name": "Support Team"
      },
      "organization": {
        "id": "uuid",
        "name": "VietED"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Example Requests:**

```bash
# All tickets
GET /api/tickets

# Filter by status
GET /api/tickets?status=open&priority=high

# Search
GET /api/tickets?search=login

# Pagination
GET /api/tickets?page=2&limit=50

# My tickets
GET /api/tickets?created_by=<my-user-id>

# Admin-only tickets
GET /api/tickets?only_show_in_admin=true
```

---

### Get Single Ticket

#### GET `/api/tickets/[id]`

**Lấy chi tiết một ticket.**

**Authentication:** Required

**Permissions:**
- **Admin**: Xem mọi ticket
- **Manager**: Xem tickets trong organization
- **User**: Chỉ xem tickets của mình

**Response:**
```json
{
  "id": "uuid",
  "title": "Login button not working",
  "description": "Detailed description with HTML...",
  "status": "in_progress",
  "priority": "high",
  "ticket_type": "bug",
  "platform": "web",
  "organization_id": "uuid",
  "assigned_to": "uuid",
  "created_by": "uuid",
  "expected_completion_date": "2024-02-01",
  "closed_at": null,
  "jira_link": "https://jira.../browse/TICKET-123",
  "only_show_in_admin": false,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T14:30:00Z",
  "creator": { /* full user object */ },
  "assignee": { /* full user object */ },
  "organization": { /* full org object */ }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (no access to this ticket)
- `404` - Ticket not found

---

### Create Ticket

#### POST `/api/tickets`

**Tạo ticket mới.**

**Authentication:** Required

**Request Body:**
```json
{
  "title": "Login button not working",
  "description": "<p>When I click login...</p>",
  "ticket_type": "bug",
  "priority": "high",
  "platform": "web",
  "organization_id": "uuid",  // Admin only, auto-set for users
  "expected_completion_date": "2024-02-01",
  "jira_link": "https://jira.../browse/TICKET-123",
  "only_show_in_admin": false  // Admin only
}
```

**Required Fields:**
- `title` (string, min 1 char)

**Optional Fields:**
- `description` (HTML string)
- `ticket_type` (enum)
- `priority` (enum)
- `platform` (enum)
- `organization_id` (uuid) - Admin only
- `expected_completion_date` (date string)
- `jira_link` (url string)
- `only_show_in_admin` (boolean) - Admin only

**Business Rules:**
- **Non-admin users:**
  - `organization_id` auto-set to their organization
  - `only_show_in_admin` always `false`
  - Cannot create tickets for other organizations
  
- **Admin users:**
  - Can set any `organization_id`
  - Can set `only_show_in_admin`
  - Can create tickets without organization

**Response:**
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": { /* created ticket */ }
}
```

**Errors:**
- `400` - Validation error (missing title, etc.)
- `401` - Unauthorized

---

### Update Ticket

#### PUT `/api/tickets/[id]`

**Update thông tin ticket.**

**Authentication:** Required

**Permissions:**
- **Admin**: Update mọi ticket
- **Manager**: Update tickets trong organization
- **User**: Update chỉ tickets của mình

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress",
  "priority": "urgent",
  "assigned_to": "uuid",
  "expected_completion_date": "2024-02-15",
  "closed_at": "2024-01-20T15:00:00Z",
  "jira_link": "https://jira.../browse/TICKET-456"
}
```

**Updatable Fields:**
- All fields from create
- `status`
- `assigned_to`
- `closed_at`

**Auto-behaviors:**
- When `status` → `closed`: Auto-set `closed_at` if null
- When `status` → others from `closed`: Clear `closed_at`
- `updated_at` auto-updated

**Response:**
```json
{
  "success": true,
  "message": "Ticket updated successfully",
  "data": { /* updated ticket */ }
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized
- `403` - Forbidden (no permission)
- `404` - Ticket not found

---

### Delete Ticket

#### DELETE `/api/tickets/[id]`

**Xóa ticket (Admin only).**

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true,
  "message": "Ticket deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not admin)
- `404` - Ticket not found

**Note:** Deleting ticket also deletes all comments (CASCADE)

---

## Comments

### List Comments

#### GET `/api/tickets/[id]/comments`

**Lấy tất cả comments của một ticket.**

**Authentication:** Required

**Permissions:** Same as viewing ticket

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "user_id": "uuid",
      "content": "<p>This is a comment with <strong>HTML</strong></p>",
      "created_at": "2024-01-15T11:00:00Z",
      "updated_at": "2024-01-15T11:00:00Z",
      "user": {
        "id": "uuid",
        "email": "user@example.com",
        "full_name": "Nguyen Van A",
        "avatar_url": "https://..."
      }
    }
  ]
}
```

**Note:** Comments sorted by `created_at ASC` (oldest first)

---

### Create Comment

#### POST `/api/tickets/[id]/comments`

**Thêm comment mới vào ticket.**

**Authentication:** Required

**Request Body:**
```json
{
  "content": "<p>My comment with <strong>formatting</strong></p>"
}
```

**Required Fields:**
- `content` (string, min 1 char, HTML)

**Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": { /* created comment with user info */ }
}
```

**Side Effects:**
- Updates ticket's `updated_at`
- Sends notification to ticket creator (if not self)
- Sends notification to assignee (if set and not self)

**Errors:**
- `400` - Missing content
- `401` - Unauthorized
- `403` - No access to ticket
- `404` - Ticket not found

---

### Update Comment

#### PUT `/api/tickets/[id]/comments/[commentId]`

**Update comment content.**

**Authentication:** Required

**Permissions:**
- **Admin**: Update mọi comment
- **Owner**: Update chỉ comments của mình

**Request Body:**
```json
{
  "content": "<p>Updated comment content</p>"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "data": { /* updated comment */ }
}
```

**Errors:**
- `400` - Missing content
- `401` - Unauthorized
- `403` - Forbidden (not owner or admin)
- `404` - Comment not found

---

### Delete Comment

#### DELETE `/api/tickets/[id]/comments/[commentId]`

**Xóa comment.**

**Authentication:** Required

**Permissions:**
- **Admin**: Delete mọi comment
- **Owner**: Delete chỉ comments của mình

**Response:**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not owner or admin)
- `404` - Comment not found

---

## Enums & Constants

### Status Values
```typescript
type Status = 'open' | 'in_progress' | 'resolved' | 'closed';
```

**State Machine:**
```
open → in_progress → resolved → closed
  ↓         ↓           ↓
  └─────────┴───────────┘ (can revert)
```

### Priority Values
```typescript
type Priority = 'low' | 'medium' | 'high' | 'urgent';
```

### Ticket Type Values
```typescript
type TicketType = 'bug' | 'feature' | 'support' | 'question' | 'other';
```

### Platform Values
```typescript
type Platform = 'web' | 'mobile' | 'api' | 'desktop' | 'other';
```

---

## Jira Integration

### Jira Fields

Tickets có thể link với Jira issues:

**Field:** `jira_link`
**Format:** `https://{instance}.atlassian.net/browse/{key}`
**Example:** `https://vieted.atlassian.net/browse/CLD-123`

### Related Endpoints

#### POST `/api/jira/create-issue`
Create Jira issue from ticket

#### GET `/api/jira/issue/[key]`
Fetch Jira issue details

#### POST `/api/jira/batch-status`
Sync multiple Jira issue statuses

**See:** `docs-ai/api/JIRA_API.md` (TODO)

---

## Filters & Search

### Search Behavior
- Searches in `title` and `description` fields
- Case-insensitive
- Partial match (ILIKE)
- Example: `?search=login` matches "Login error", "Can't login"

### Multiple Filters
Can combine multiple filters:
```
GET /api/tickets?status=open&priority=high&platform=web&search=login
```

### Date Filters (Future)
```
GET /api/tickets?created_after=2024-01-01&created_before=2024-12-31
```

---

## Pagination

Default pagination: 20 items per page

**Response includes:**
```json
{
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Max limit:** 100 items per page

---

## Notifications

Creating/updating tickets/comments triggers notifications:

### Ticket Created
- Notify: Assignee (if set)

### Ticket Updated
- Notify: Creator (if changed by others)
- Notify: Previous assignee (if reassigned)
- Notify: New assignee (if assigned)

### Comment Added
- Notify: Ticket creator (if not commenter)
- Notify: Ticket assignee (if set and not commenter)
- Notify: Previous commenters (future)

**See:** `docs-ai/api/NOTIFICATIONS_API.md` (TODO)

---

## Examples

### Create and Track Bug

```typescript
// 1. Create ticket
const ticket = await fetch('/api/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Login button broken',
    description: '<p>Button not responding on click</p>',
    ticket_type: 'bug',
    priority: 'high',
    platform: 'web'
  })
});

const { data } = await ticket.json();
const ticketId = data.id;

// 2. Add comment
await fetch(`/api/tickets/${ticketId}/comments`, {
  method: 'POST',
  body: JSON.stringify({
    content: '<p>Investigating...</p>'
  })
});

// 3. Update status
await fetch(`/api/tickets/${ticketId}`, {
  method: 'PUT',
  body: JSON.stringify({
    status: 'in_progress',
    assigned_to: 'dev-user-id'
  })
});

// 4. Resolve
await fetch(`/api/tickets/${ticketId}`, {
  method: 'PUT',
  body: JSON.stringify({
    status: 'resolved'
  })
});
```

---

## Related Documentation

- [Notifications API](./NOTIFICATIONS_API.md) - TODO
- [Jira Integration](./JIRA_API.md) - TODO
- [Authentication](./AUTHENTICATION.md)
- [Project Overview](../PROJECT_OVERVIEW.md)

---

**Last Updated**: 2025-01-19
