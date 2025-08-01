# Ticket Components - Cấu trúc đã tách nhỏ

Các component đã được tách nhỏ để dễ đọc, dễ bảo trì và tái sử dụng.

## 📁 Cấu trúc thư mục

```
src/
├── components/
│   └── tickets/
│       ├── TicketDetailView.tsx      # Hiển thị thông tin ticket (view mode)
│       ├── TicketEditForm.tsx        # Form chỉnh sửa ticket (edit mode)
│       ├── TicketComments.tsx        # Quản lý comments
│       ├── TicketTable.tsx           # Bảng hiển thị danh sách tickets
│       ├── TicketFilters.tsx         # Bộ lọc và tìm kiếm
│       ├── TicketDialog.tsx          # Dialog tạo/sửa ticket
│       └── README.md                 # File này
├── hooks/
│   ├── useTicketDetail.ts            # Custom hook cho logic ticket detail
│   └── useTicketList.ts              # Custom hook cho logic ticket list
├── types/
│   ├── index.ts                      # Export all types
│   ├── ticket.ts                     # Ticket type definitions
│   └── database.ts                   # Database type definitions
└── app/
    └── tickets/
        ├── page.tsx                  # Trang danh sách (đã được tách nhỏ)
        └── [id]/
            └── page.tsx              # Trang chi tiết (đã được tách nhỏ)
```

## 🧩 Components

### **Ticket Detail Components**

#### 1. **TicketDetailView.tsx**

**Mục đích**: Hiển thị thông tin ticket trong chế độ xem

**Props**:

```typescript
interface TicketDetailViewProps {
    ticket: Ticket;
    currentUser: CurrentUser | null;
}
```

**Tính năng**:

- ✅ Hiển thị thông tin ticket với layout đẹp
- ✅ Sử dụng các badge có icon
- ✅ Hiển thị metadata (người tạo, ngày tạo)
- ✅ Hiển thị JIRA info cho admin

#### 2. **TicketEditForm.tsx**

**Mục đích**: Form chỉnh sửa ticket

**Props**:

```typescript
interface TicketEditFormProps {
    formData: TicketFormData;
    setFormData: React.Dispatch<React.SetStateAction<TicketFormData>>;
    organizations: Organization[];
}
```

**Tính năng**:

- ✅ Form validation
- ✅ Dropdown với badge preview
- ✅ Auto-fill closed_at khi status = closed
- ✅ Date picker với calendar icon

#### 3. **TicketComments.tsx**

**Mục đích**: Quản lý comments và replies

**Props**:

```typescript
interface TicketCommentsProps {
    comments: Comment[];
    ticketId: string;
    currentUserId: string;
    onAddComment: (content: string, parentId?: string) => Promise<void>;
    onEditComment: (commentId: string, content: string) => Promise<void>;
    onDeleteComment: (commentId: string) => Promise<void>;
}
```

**Tính năng**:

- ✅ Hiển thị comments dạng tree (nested replies)
- ✅ Thêm, sửa, xóa comments
- ✅ Reply to comments
- ✅ Time ago formatting
- ✅ User avatars

### **Ticket List Components**

#### 4. **TicketTable.tsx**

**Mục đích**: Bảng hiển thị danh sách tickets

**Props**:

```typescript
interface TicketTableProps {
    tickets: Ticket[];
    currentUser: CurrentUser | null;
    onDelete: (id: string, title: string) => Promise<void>;
    getDeadlineCountdown: (expectedDate: string | null, status: string) => any;
}
```

**Tính năng**:

- ✅ Hiển thị tickets với responsive design
- ✅ Sử dụng các badge có icon
- ✅ Deadline countdown với màu sắc
- ✅ JIRA link integration
- ✅ Action buttons (view, delete)

#### 5. **TicketFilters.tsx**

**Mục đích**: Bộ lọc và tìm kiếm tickets

**Props**:

```typescript
interface TicketFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    selectedPriority: string;
    setSelectedPriority: (priority: string) => void;
    selectedOrganization: string;
    setSelectedOrganization: (org: string) => void;
    organizations: Organization[];
    onSearch: () => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
}
```

**Tính năng**:

- ✅ Search bar với Enter key support
- ✅ Filter theo status, priority, organization
- ✅ Clear filters button
- ✅ Active filters display
- ✅ Responsive layout

#### 6. **TicketDialog.tsx**

**Mục đích**: Dialog tạo/sửa ticket

**Props**:

```typescript
interface TicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    formData: TicketFormData;
    setFormData: React.Dispatch<React.SetStateAction<TicketFormData>>;
    organizations: Organization[];
    onSubmit: (e: React.FormEvent) => Promise<void>;
    submitting: boolean;
    editingTicket?: any;
}
```

**Tính năng**:

- ✅ Form tạo ticket mới
- ✅ Form chỉnh sửa ticket
- ✅ Rich text editor cho description
- ✅ Form validation
- ✅ Loading states

## 🪝 Custom Hooks

### **useTicketDetail.ts**

**Mục đích**: Quản lý toàn bộ logic của trang ticket detail

**Return values**:

```typescript
{
    // State
    (ticket,
        currentUser,
        organizations,
        comments,
        isEditing,
        saving,
        creatingJira,
        loading,
        formData,
        // Actions
        setFormData,
        handleSave,
        handleEditToggle,
        handleCancel,
        handleCreateJiraIssue,
        handleAddComment,
        handleEditComment,
        handleDeleteComment);
}
```

### **useTicketList.ts**

**Mục đích**: Quản lý toàn bộ logic của trang danh sách tickets

**Return values**:

```typescript
{
    // State
    (tickets,
        organizations,
        currentUser,
        loading,
        submitting,
        dialogOpen,
        editingTicket,
        formData,
        searchTerm,
        selectedStatus,
        selectedPriority,
        selectedOrganization,
        hasActiveFilters,
        // Actions
        setFormData,
        setSearchTerm,
        setSelectedStatus,
        setSelectedPriority,
        setSelectedOrganization,
        setDialogOpen,
        handleSearch,
        handleClearFilters,
        handleOpenDialog,
        handleCloseDialog,
        handleSubmit,
        handleDelete,
        getDeadlineCountdown);
}
```

## 📝 Types

### **types/index.ts**
Export tất cả types từ các file khác:

```typescript
// Export all types from ticket.ts
export * from './ticket';

// Export database types if needed
export * from './database';
```

### **types/ticket.ts**
Định nghĩa tất cả các interface cần thiết:

```typescript
export interface Ticket { ... }
export interface Organization { ... }
export interface CurrentUser { ... }
export interface Comment { ... }
export interface TicketFormData { ... }
```

## 🎯 Lợi ích của cấu trúc mới

### **Trước khi tách**:

- ❌ File dài 1600+ dòng (detail) và 1600+ dòng (list)
- ❌ Khó đọc và maintain
- ❌ Logic trộn lẫn với UI
- ❌ Khó tái sử dụng

### **Sau khi tách**:

- ✅ Mỗi component có trách nhiệm rõ ràng
- ✅ Logic được tách ra custom hooks
- ✅ Dễ đọc và maintain
- ✅ Có thể tái sử dụng từng phần
- ✅ Type safety với TypeScript
- ✅ Dễ test từng component

## 🔄 Cách sử dụng

### **Trang Detail** (`/tickets/[id]/page.tsx`):

```typescript
import { useTicketDetail } from "@/hooks/useTicketDetail";
import { TicketDetailView } from "@/components/tickets/TicketDetailView";
import { TicketEditForm } from "@/components/tickets/TicketEditForm";
import { TicketComments } from "@/components/tickets/TicketComments";

export default function TicketDetailPage() {
    const {
        ticket, currentUser, isEditing, formData,
        handleSave, handleEditToggle, // ... other actions
    } = useTicketDetail(ticketId);

    return (
        <div>
            {!isEditing ? (
                <TicketDetailView ticket={ticket} currentUser={currentUser} />
            ) : (
                <TicketEditForm formData={formData} setFormData={setFormData} />
            )}
            <TicketComments comments={comments} onAddComment={handleAddComment} />
        </div>
    );
}
```

### **Trang List** (`/tickets/page.tsx`):

```typescript
import { useTicketList } from "@/hooks/useTicketList";
import { TicketTable } from "@/components/tickets/TicketTable";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketDialog } from "@/components/tickets/TicketDialog";

export default function TicketsPage() {
    const {
        tickets, currentUser, formData, searchTerm,
        handleSearch, handleDelete, handleSubmit, // ... other actions
    } = useTicketList();

    return (
        <div>
            <TicketFilters searchTerm={searchTerm} onSearch={handleSearch} />
            <TicketTable tickets={tickets} onDelete={handleDelete} />
            <TicketDialog formData={formData} onSubmit={handleSubmit} />
        </div>
    );
}
```

## 🚀 Kế hoạch tiếp theo

1. **Tối ưu performance**
    - Memoization cho components
    - Lazy loading cho comments
    - Pagination cho comments và tickets

2. **Thêm tính năng**
    - Bulk actions (delete multiple tickets)
    - Export tickets to CSV/Excel
    - Advanced filters (date range, assignee)

3. **Testing**
    - Unit tests cho từng component
    - Integration tests cho hooks
    - E2E tests cho workflows

## 📊 Metrics

- **Trước**: 2 files, mỗi file 1600+ dòng
- **Sau**: 8 files, mỗi file < 300 dòng
- **Giảm**: ~85% độ phức tạp mỗi file
- **Tăng**: Khả năng maintain và tái sử dụng
- **Components**: 6 components tái sử dụng
- **Hooks**: 2 custom hooks tách biệt logic
