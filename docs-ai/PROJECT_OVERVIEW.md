# TicketLMS - Project Overview

## 🎯 Mục đích

**TicketLMS** là hệ thống quản lý tickets (Learning Management System) được xây dựng cho VietED, giúp:
- Quản lý yêu cầu hỗ trợ từ khách hàng
- Tracking tiến độ xử lý tickets
- Tích hợp với Jira để đồng bộ issues
- Cung cấp công cụ automation cho developers

## 🏢 Thông tin dự án

- **Tên dự án**: TicketLMS
- **Client**: VietED
- **Tech Stack**: Next.js 15, TypeScript, Supabase, Tailwind CSS
- **Deployment**: Vercel
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth

## 👥 Roles & Permissions

### Admin
- Full access toàn bộ hệ thống
- Quản lý users, organizations
- Xem tất cả tickets (bao gồm tickets chỉ hiển thị trong admin)
- Truy cập công cụ developer tools
- Quản lý API templates và environments

### Manager
- Quản lý tickets trong organization
- Assign tickets cho team members
- Xem reports và statistics
- Không thể xem admin-only tickets

### User (End User)
- Tạo tickets mới
- Xem và comment trên tickets của mình
- Nhận notifications
- Không có quyền admin tools

## 🎨 Core Features

### 1. Ticket Management
- **Tạo tickets**: Form tạo ticket với đầy đủ thông tin
- **Phân loại**: By type, priority, platform, status
- **Assignment**: Assign cho specific users hoặc để unassigned
- **Comments**: Thread-based comments với mentions
- **Attachments**: Upload files, images
- **Jira Integration**: Sync với Jira issues

### 2. User Management
- **Authentication**: Email/password via Supabase
- **Profile Management**: Avatar, bio, contact info
- **Organization Assignment**: Users thuộc organizations
- **Role-based Access**: Admin, Manager, User roles

### 3. Notifications
- **Real-time**: Thông báo khi có activity
- **Types**: Ticket assigned, comment added, status changed
- **Mark as read**: Individual và bulk mark
- **Count badge**: Unread count hiển thị

### 4. Developer Tools

#### API Runner
- Gọi APIs với authentication tự động
- Lưu request templates
- Organize templates trong folders
- Support multiple environments (Dev, Staging, Production)
- Request history tracking

#### API Auto
- Automation flows (ví dụ: clone program, bulk create users)
- Template-based workflows
- Input forms tự động generate
- Execution history

### 5. Dashboard
- **Statistics**: Ticket counts by status, priority
- **Recent Activity**: Latest tickets và comments
- **Quick Actions**: Create ticket, view notifications
- **Charts**: Visual representation của data

## 🗂️ Main Modules

```
├── Dashboard           # Overview và statistics
├── Tickets            # Ticket management
├── Users              # User management (Admin)
├── Organizations      # Organization management (Admin)
├── Notifications      # Notification center
└── Tools              # Developer tools
    ├── API Runner     # API testing tool
    ├── API Auto       # Automation workflows
    └── Environments   # API environment configs
```

## 🔐 Security & Auth

### Authentication Flow
1. User login với email/password
2. Supabase Auth tạo session (JWT)
3. Session stored trong httpOnly cookies
4. Middleware verify mỗi request
5. Auto refresh tokens khi expire

### Session Management
- **Duration**: Sessions auto-refresh
- **Isolation**: Mỗi user có session riêng (no sharing)
- **Cleanup**: Invalid tokens tự động cleared
- **Force Logout**: Admin có thể revoke all sessions

### RLS (Row Level Security)
- Database-level security
- Users chỉ xem data của organization mình
- Admin bypass RLS để xem tất cả
- Templates và folders: Public cho all admins

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles
- `organizations` - Organizations/Companies
- `tickets` - Support tickets
- `ticket_comments` - Comments on tickets
- `notifications` - User notifications

### Tool Tables
- `api_environments` - API environment configs
- `api_template_folders` - Template organization
- `api_request_templates` - Saved API requests
- `api_auto_folders` - Automation folder structure
- `api_auto_flows` - Automation workflows
- `api_auto_execution_history` - Execution logs

## 🚀 Deployment

- **Platform**: Vercel
- **Database**: Supabase (hosted PostgreSQL)
- **Storage**: Supabase Storage
- **CDN**: Vercel Edge Network
- **Domain**: [TBD]

## 🔧 Development Workflow

1. **Local Development**: `npm run dev`
2. **Database**: Supabase local or cloud
3. **Migrations**: Supabase CLI
4. **Testing**: Manual testing + Playwright (future)
5. **Build**: `npm run build`
6. **Deploy**: Git push to main → Auto deploy

## 📝 Key Decisions

### Why Next.js 15?
- Server Components for better performance
- App Router for improved routing
- Built-in optimizations
- Good TypeScript support
- Vercel deployment integration

### Why Supabase?
- PostgreSQL with real-time capabilities
- Built-in authentication
- Row Level Security
- Storage solution included
- Good DX with TypeScript

### Why Not Session Singleton?
- **Critical**: Prevents session sharing between users
- Each request gets fresh client instance
- Cookies managed per-request basis
- See: `docs-ai/fixes/FIX_LOGIN_ISSUE.md`

## 🐛 Known Issues & Fixes

Tất cả issues và fixes được document trong `docs-ai/fixes/`:
- Login issues → `FIX_LOGIN_ISSUE.md`
- Middleware errors → `FIX_MIDDLEWARE_ERROR.md`
- Session revocation → `FIX_REVOKE_SESSIONS_FAILED.md`

## 📚 Related Docs

- [Architecture](./ARCHITECTURE.md) - System architecture
- [Tech Stack](./TECH_STACK.md) - Detailed tech stack
- [Development Setup](./guides/DEVELOPMENT_SETUP.md) - How to setup dev env
- [API Documentation](./api/) - API endpoints reference

## 🤝 Contributing

1. Đọc docs này để hiểu project
2. Check existing issues/fixes
3. Follow coding conventions trong codebase
4. Update docs khi thay đổi features
5. Test thoroughly trước khi commit

## 📞 Support

- **Technical Lead**: Nguyễn Xuân Hòa - 0962369231
- **Email**: hoanx@vieted.com

---

**Last Updated**: 2025-01-19
**Version**: 1.0
