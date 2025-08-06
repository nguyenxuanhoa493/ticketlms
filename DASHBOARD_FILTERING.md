# Dashboard Filtering Logic

## Vấn đề

Trước đây, dashboard hiển thị tất cả tickets cho mọi user, không phân biệt role và organization. Điều này vi phạm quyền truy cập và có thể gây nhầm lẫn.

## Giải pháp

### 1. **Logic Filtering theo Role**

#### Admin Users
- ✅ Thấy tất cả tickets trong hệ thống
- ✅ Thấy tất cả organizations
- ✅ Thấy tất cả users
- ✅ Thấy tickets marked as `only_show_in_admin = true`

#### Non-Admin Users (User, Manager)
- ✅ Chỉ thấy tickets của organization của mình
- ✅ Không thấy tickets marked as `only_show_in_admin = true`
- ✅ Chỉ thấy users trong organization của mình
- ✅ Chỉ thấy 1 organization (của mình)

### 2. **Implementation**

#### getRecentTickets function
```typescript
// Nếu không phải admin, filter theo organization và only_show_in_admin
if (userRole !== "admin") {
    if (organizationId) {
        ticketsQuery = ticketsQuery.eq("organization_id", organizationId);
    }
    // Non-admin users không thể thấy tickets marked as only_show_in_admin
    ticketsQuery = ticketsQuery.eq("only_show_in_admin", false);
}
```

#### getDashboardStats function
```typescript
// Non-admin users
const [
    { count: totalUsers },
    { count: totalTickets },
    { count: openTickets },
    { count: inProgressTickets },
    { count: closedTickets },
] = await Promise.all([
    supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgFilter),
    supabase
        .from("tickets")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgFilter)
        .eq("only_show_in_admin", false), // ← Thêm filter này
    // ... các query khác cũng thêm filter tương tự
]);
```

### 3. **Database Schema**

#### Tickets table
```sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    organization_id UUID REFERENCES organizations(id),
    only_show_in_admin BOOLEAN DEFAULT FALSE, -- ← Field quan trọng
    -- ... other fields
);
```

### 4. **User Experience**

#### Admin Dashboard
- Hiển thị tổng quan toàn hệ thống
- Có thể thấy tất cả tickets từ mọi organization
- Có thể thấy tickets marked as admin-only

#### Non-Admin Dashboard
- Hiển thị tổng quan của organization
- Chỉ thấy tickets của organization của mình
- Không thấy tickets marked as admin-only
- UI phù hợp với scope hạn chế

### 5. **Security Benefits**

1. **Data Isolation**: Mỗi user chỉ thấy data của organization mình
2. **Admin-Only Content**: Tickets nhạy cảm chỉ admin mới thấy
3. **Consistent Permissions**: Logic nhất quán với tickets page
4. **Audit Trail**: Dễ dàng track ai thấy gì

### 6. **Testing Scenarios**

#### Test Case 1: Admin User
```bash
# Login với admin account
# Vào dashboard
# Expected: Thấy tất cả tickets, organizations, users
```

#### Test Case 2: Non-Admin User
```bash
# Login với user/manager account
# Vào dashboard
# Expected: Chỉ thấy tickets của organization của mình
# Expected: Không thấy tickets marked as admin-only
```

#### Test Case 3: Cross-Organization Access
```bash
# Login với user từ organization A
# Expected: Không thấy tickets từ organization B
# Expected: Stats chỉ reflect organization A
```

### 7. **Performance Considerations**

1. **Indexed Queries**: Đảm bảo có index trên `organization_id` và `only_show_in_admin`
2. **Cached Results**: Dashboard data được cache để tăng performance
3. **Efficient Filtering**: Filter ở database level, không phải application level

### 8. **Future Enhancements**

1. **Role-Based Dashboard**: Custom dashboard cho từng role
2. **Organization Switching**: Admin có thể switch giữa các organizations
3. **Advanced Filtering**: Thêm filters theo date range, status, etc.
4. **Export Functionality**: Export dashboard data theo permissions

## Kết luận

Việc implement filtering logic này đảm bảo:
- ✅ **Security**: Mỗi user chỉ thấy data phù hợp
- ✅ **Consistency**: Logic nhất quán với phần còn lại của app
- ✅ **User Experience**: UI phù hợp với role và permissions
- ✅ **Maintainability**: Code dễ maintain và extend 