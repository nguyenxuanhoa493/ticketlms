# TicketLMS - Hệ thống Quản lý Ticket

Hệ thống quản lý ticket hiệu quả với phân quyền theo đơn vị, được xây dựng bằng Next.js và Supabase.

## ✨ Tính năng

-   🔐 **Authentication & Authorization**: Sử dụng Supabase Auth
-   👥 **Phân quyền 3 cấp**: Admin, Quản lý đơn vị, User thường
-   🏢 **Quản lý đơn vị**: Tổ chức theo đơn vị/phòng ban
-   🎫 **Quản lý ticket**: Tạo, theo dõi, giải quyết ticket
-   📱 **Responsive**: Tối ưu cho cả desktop và mobile
-   🎨 **Modern UI**: Sử dụng Shadcn/ui và Tailwind CSS
-   🚫 **Controlled Access**: Không cho phép tự đăng ký, chỉ admin tạo tài khoản

## 🚀 Cài đặt nhanh

### 1. Clone repository

```bash
git clone <repository-url>
cd ticketlms
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Cấu hình environment variables

Tạo file `.env.local`:

```bash
touch .env.local
```

Thêm nội dung vào `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Thiết lập Supabase Database

#### 4.1. Tạo Supabase Project

1. Đi đến [supabase.com](https://supabase.com)
2. Tạo project mới
3. Copy URL và API keys vào `.env.local`

#### 4.2. Chạy SQL Schema

Mở SQL Editor trong Supabase Dashboard và chạy nội dung file `supabase/schema.sql`

#### 4.3. Cấu hình Authentication

1. Trong Supabase Dashboard → Authentication → Settings
2. **Site URL**: `http://localhost:3000`
3. **Redirect URLs**: Thêm `http://localhost:3000/auth/callback`
4. **Tắt Sign-ups**: Disable "Enable email confirmations" để ngăn đăng ký tự do

### 6. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## 🏗️ Kiến trúc

### Tech Stack

-   **Frontend**: Next.js 15 (App Router), React 19
-   **Styling**: Tailwind CSS, Shadcn/ui
-   **Backend**: Supabase (PostgreSQL, Auth, Realtime)
-   **Form**: React Hook Form + Zod validation
-   **TypeScript**: Full type safety

### Database Schema

```
┌─ auth.users (Supabase)
│
├─ profiles (extends users)
│  ├─ role: admin | manager | user
│  └─ organization_id
│
├─ organizations
│  ├─ name, description
│  └─ created_by
│
└─ tickets
   ├─ title, description
   ├─ status: open | in_progress | closed
   ├─ priority: low | medium | high
   ├─ organization_id
   ├─ assigned_to
   └─ created_by
```

### Phân quyền

| Vai trò     | Quyền hạn                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------- |
| **Admin**   | - Toàn quyền trên hệ thống<br>- Tạo tài khoản cho users<br>- Quản lý tất cả đơn vị và tickets |
| **Manager** | - Quản lý đơn vị của mình<br>- Quản lý users trong đơn vị<br>- Quản lý tickets của đơn vị     |
| **User**    | - Xem tickets của đơn vị<br>- Tạo tickets mới<br>- Cập nhật tickets của mình                  |

## 📁 Cấu trúc thư mục

```
src/
├── app/                    # App Router pages
│   ├── dashboard/         # Dashboard routes
│   ├── login/            # Auth pages
│   ├── register/         # Disabled - shows warning
│   └── auth/             # Auth callback handling
├── components/           # React components
│   └── ui/              # Shadcn/ui components
├── lib/                 # Utilities
│   ├── auth.ts         # Auth helpers
│   ├── permissions.ts  # Permission logic
│   └── supabase.ts     # Supabase client
├── types/              # TypeScript types
│   └── database.ts     # Database types
└── scripts/            # Utility scripts
    └── create-admin.js # Admin creation script
```

## 🔧 Development

### Tạo Admin Account bổ sung

```bash
npm run create-admin
```

### Thêm Shadcn/ui components

```bash
npx shadcn@latest add [component-name]
```

### Database migrations

Khi thay đổi schema, cập nhật file `supabase/schema.sql` và chạy lại trong SQL Editor.

## 👥 Quản lý Users

### Luồng tạo tài khoản

1. **Admin đăng nhập** vào hệ thống
2. **Admin tạo tài khoản** cho users trong dashboard
3. **Users được cấp thông tin** đăng nhập
4. **Users đăng nhập** và sử dụng hệ thống

### Không cho phép tự đăng ký

-   Trang `/register` hiển thị thông báo không cho phép đăng ký
-   Chỉ admin có thể tạo tài khoản mới
-   Đảm bảo kiểm soát access vào hệ thống

## 🚢 Deployment

### Vercel (Khuyến nghị)

1. Push code lên GitHub
2. Import project vào Vercel
3. Cấu hình environment variables
4. Deploy!

### Environment Variables cho Production

```env
NEXT_PUBLIC_SUPABASE_URL=your-production-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
```

### Tạo Admin Account trên Production

```bash
# Trên production environment
npm run create-admin
```

## 📋 Todo List Phát triển

### Đã hoàn thành ✅

-   [x] Setup dự án Next.js với TypeScript
-   [x] Cấu hình Supabase và database schema
-   [x] Tạo auth middleware và permission system
-   [x] Trang đăng nhập với admin account
-   [x] Dashboard layout và navigation
-   [x] Dashboard chính với stats overview
-   [x] Tắt đăng ký public, chỉ admin tạo account
-   [x] Script tạo admin account mặc định

### Đang phát triển 🚧

-   [ ] CRUD cho quản lý users (admin tạo tài khoản)
-   [ ] CRUD cho quản lý đơn vị/organizations
-   [ ] CRUD cho quản lý tickets
-   [ ] API routes với validation
-   [ ] Hệ thống phân quyền chi tiết

### Kế hoạch tương lai 🎯

-   [ ] Password reset functionality
-   [ ] User profile management
-   [ ] Real-time notifications
-   [ ] File attachments cho tickets
-   [ ] Comments system
-   [ ] Dashboard analytics
-   [ ] Email notifications
-   [ ] Audit logs
-   [ ] Advanced search & filters

## 🔑 Thông tin đăng nhập mặc định

**Admin Account:**

-   Email: `admin@ticketlms.com`
-   Password: `Admin@123456`

⚠️ **Bắt buộc đổi password sau lần đăng nhập đầu tiên!**

## 🆘 Hỗ trợ

Nếu gặp vấn đề:

1. Kiểm tra [Issues](../../issues)
2. Đảm bảo `.env.local` được cấu hình đúng
3. Chạy lại `npm run create-admin` nếu không đăng nhập được
4. Kiểm tra Supabase Dashboard để xem auth users

---

**Built with ❤️ using Next.js and Supabase**
