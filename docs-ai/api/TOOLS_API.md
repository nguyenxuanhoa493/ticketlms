# Developer Tools API

## Overview

Developer Tools APIs provide utilities for testing và automation workflows.

---

## API Runner

### Environments

#### GET `/api/tools/environments`

**List tất cả API environments.**

**Authentication:** Required (Admin only)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "STAGING",
      "host": "https://staging.example.com",
      "pass_user": "encrypted",
      "pass_root": "encrypted",
      "created_by": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST `/api/tools/environments`

**Tạo environment mới.**

**Request Body:**
```json
{
  "name": "PRODUCTION",
  "host": "https://api.production.com",
  "pass_user": "user_password",
  "pass_root": "root_password"
}
```

**Required:** `name`, `host`

**Response:**
```json
{
  "success": true,
  "message": "Environment created successfully",
  "data": { /* created environment */ }
}
```

---

#### PUT `/api/tools/environments`

**Update environment.**

**Request Body:**
```json
{
  "id": "uuid",
  "name": "STAGING-V2",
  "host": "https://staging-v2.example.com",
  "pass_user": "new_password"
}
```

**Required:** `id`

---

#### DELETE `/api/tools/environments?id=uuid`

**Xóa environment.**

**Note:** Cascade deletes all templates using this environment

---

### Templates

#### GET `/api/tools/templates`

**List tất cả API request templates.**

**Authentication:** Required (Admin only)

**Permissions:** All admins can view all templates (RLS policy)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Search Users",
      "description": "Search users by email",
      "folder_id": "uuid",
      "environment_id": "uuid",
      "path": "/user/api/search",
      "method": "POST",
      "payload": {
        "email": "user@example.com",
        "limit": 10
      },
      "dmn": "staging",
      "user_code": "admin",
      "password": null,
      "created_by": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "folder": {
        "id": "uuid",
        "name": "User APIs",
        "description": "User management APIs"
      }
    }
  ]
}
```

---

#### POST `/api/tools/templates`

**Tạo template mới.**

**Request Body:**
```json
{
  "name": "Create User",
  "description": "Create a new user in system",
  "folder_id": "uuid",
  "environment_id": "uuid",
  "path": "/user/api/create",
  "method": "POST",
  "payload": {
    "email": "{{email}}",
    "fullName": "{{name}}",
    "role": "user"
  },
  "dmn": "staging",
  "user_code": "admin",
  "password": "optional_override"
}
```

**Required Fields:**
- `name`
- `path`
- `method`

**Optional Fields:**
- `description`
- `folder_id` - Folder organization
- `environment_id` - Default environment
- `payload` - JSON object
- `dmn` - Domain/tenant identifier
- `user_code` - Username for auth
- `password` - Override environment password

**Response:**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": { /* created template */ }
}
```

---

#### PUT `/api/tools/templates`

**Update template.**

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated name",
  "payload": { /* updated payload */ }
}
```

**Note:** Any admin can update any template

---

#### DELETE `/api/tools/templates?id=uuid`

**Xóa template.**

**Note:** Any admin can delete any template

---

### Folders

#### GET `/api/tools/folders`

**Get folder tree structure.**

**Response:**
```json
{
  "success": true,
  "data": {
    "folders": [ /* flat list */ ],
    "tree": [
      {
        "id": "uuid",
        "name": "User APIs",
        "description": "User management",
        "parent_id": null,
        "created_by": "uuid",
        "children": [
          {
            "id": "uuid",
            "name": "Admin Operations",
            "parent_id": "parent-uuid",
            "children": []
          }
        ]
      }
    ]
  }
}
```

---

#### POST `/api/tools/folders`

**Tạo folder mới.**

**Request Body:**
```json
{
  "name": "Payment APIs",
  "description": "Payment processing APIs",
  "parent_id": "uuid"  // null for root level
}
```

**Response:**
```json
{
  "success": true,
  "message": "Folder created successfully",
  "data": { /* created folder */ }
}
```

---

#### PUT `/api/tools/folders`

**Update folder.**

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Folder Name",
  "parent_id": "new-parent-uuid"
}
```

---

#### DELETE `/api/tools/folders?id=uuid`

**Xóa folder.**

**Note:** 
- Cannot delete folder with children
- Templates in folder will have `folder_id` set to null

---

### API Execution

#### POST `/api/tools/api-runner`

**Execute API request với auto-login.**

**Request Body:**
```json
{
  "environmentId": "uuid",
  "path": "/user/api/search",
  "method": "POST",
  "payload": {
    "email": "user@example.com"
  },
  "dmn": "staging",
  "userCode": "admin",
  "password": "optional_override"
}
```

**Required Fields:**
- `environmentId` - Which environment to use
- `path` - API path
- `method` - HTTP method
- `dmn` - Domain/tenant

**Optional Fields:**
- `payload` - Request body
- `userCode` - Defaults to `dmn` if not provided
- `password` - Override env password

**Flow:**
1. Fetch environment config
2. Auto-login with credentials
3. Execute API request with auth token
4. Return response + request history

**Response:**
```json
{
  "success": true,
  "data": {
    "response": {
      "success": true,
      "data": [ /* API response */ ]
    },
    "requestHistory": [
      {
        "url": "https://staging.../api/v1/Auth/Login",
        "method": "POST",
        "payload": { /* login payload */ },
        "response": { /* login response */ },
        "statusCode": 200,
        "responseTime": 245
      },
      {
        "url": "https://staging.../user/api/search",
        "method": "POST",
        "payload": { "email": "..." },
        "response": { /* actual response */ },
        "statusCode": 200,
        "responseTime": 123
      }
    ]
  }
}
```

**Request History:** Array of all HTTP requests made (login + actual request)

**Errors:**
- `400` - Missing required fields
- `404` - Environment not found
- `500` - Login failed, API call failed

---

## API Automation

### Flows

#### GET `/api/tools/auto-flow/[type]`

**Get available automation flows.**

Currently supported:
- `clone-program` - Clone program with all resources

**See:** `docs-ai/features/API_AUTO_FEATURE.md`

---

#### POST `/api/tools/auto-flow/clone-program`

**Execute program cloning automation.**

**Request Body:**
```json
{
  "environmentId": "uuid",
  "sourceProgramCode": "PROG001",
  "targetProgramCode": "PROG002",
  "targetProgramName": "New Program Name",
  "dmn": "staging",
  "userCode": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Program cloned successfully",
  "data": {
    "programId": "new-program-id",
    "subjectsCloned": 5,
    "topicsCloned": 20,
    "lessonsCloned": 100,
    "executionTime": 15234
  },
  "requestHistory": [ /* all API calls */ ]
}
```

**See full documentation:** `docs-ai/features/API_AUTO_FEATURE.md`

---

## Common Patterns

### Template Variables

Templates có thể chứa placeholders:

```json
{
  "email": "{{email}}",
  "name": "{{name}}",
  "role": "{{role}}"
}
```

**Note:** Variable substitution hiện tại là manual (user nhập vào UI)

**Future:** Support auto-substitution từ form inputs

---

### Authentication Flow

1. **Environment config** → Lấy host, credentials
2. **Login request** → `/api/v1/Auth/Login` với `dmn`, `userCode`, `password`
3. **Get token** → Extract `result.accessToken`
4. **Execute request** → Use token in Authorization header
5. **Return results** → Original response + request history

---

### Error Handling

API Runner handles errors:
- Login fails → Return error with login response
- API call fails → Return error with full request history
- Network errors → Return with error message

**All errors include request history** for debugging

---

## Security Notes

### Passwords
- Stored encrypted in database
- Visible only to creator (RLS)
- Can be overridden per-request
- Never logged in request history

### Access Control
- **Templates**: All admins can view/edit (public)
- **Folders**: All admins can view/edit (public)
- **Environments**: All admins (contains credentials)
- **Execution**: Admin only

### Best Practices
- Don't hardcode passwords in templates
- Use environment passwords
- Rotate credentials regularly
- Use different credentials per environment

---

## UI Integration

### API Runner Page

**Location:** `/tools/api-runner`

**Features:**
- Environment selector
- Path, method, DMN inputs
- JSON payload editor with syntax highlight
- Execute button
- Response viewer
- Request history accordion
- Save as template dialog
- Load template browser with search

---

### Folder Management

**Integrated in save template dialog**

**Features:**
- Tree view của folders
- Create new folder
- Select folder for template
- Delete empty folders

---

## Related Documentation

- [API Auto Feature](../features/API_AUTO_FEATURE.md) - Automation workflows
- [Authentication](./AUTHENTICATION.md) - Auth system
- [Project Overview](../PROJECT_OVERVIEW.md) - Project structure

---

**Last Updated**: 2025-01-19
