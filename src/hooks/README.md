# React Query Hooks

## Tổng quan

Chúng ta đã chuyển từ custom hooks cũ sang sử dụng React Query (TanStack Query) để giải quyết vấn đề duplicate API calls và cải thiện performance.

## Lợi ích của React Query

1. **Tự động deduplication** - Tránh duplicate API calls
2. **Caching thông minh** - Cache data và tự động refresh
3. **Background refetching** - Tự động cập nhật data khi cần
4. **Loading states** - Quản lý loading state tốt hơn
5. **Error handling** - Xử lý lỗi nhất quán
6. **DevTools** - Debug dễ dàng với React Query DevTools

## Hooks có sẵn

### `useTickets(params)`

-   Lấy danh sách tickets với filtering và pagination
-   Tự động cache và deduplicate requests
-   Params: `{ page, limit, search, status, organization_id, sort }`

### `useCurrentUser()`

-   Lấy thông tin user hiện tại
-   Cache trong 10 phút

### `useOrganizations()`

-   Lấy danh sách organizations
-   Cache trong 10 phút

### `useCreateTicket()`

-   Tạo ticket mới
-   Tự động invalidate tickets cache

### `useUpdateTicket()`

-   Cập nhật ticket
-   Tự động invalidate tickets cache

### `useDeleteTicket()`

-   Xóa ticket
-   Tự động invalidate tickets cache

## Sử dụng

```typescript
import { useTicketListOptimized } from "@/hooks/useTicketListOptimized";

export default function TicketsPage() {
    const {
        tickets,
        loading,
        handleSearch,
        handleClearFilters,
        // ... other props
    } = useTicketListOptimized();

    // Component logic
}
```

## Migration từ hook cũ

Hook cũ `useTicketList` đã được thay thế bằng `useTicketListOptimized` với cùng interface, nên không cần thay đổi component logic.

## DevTools

React Query DevTools được tích hợp sẵn và có thể mở bằng cách:

1. Mở Developer Tools
2. Tìm tab "React Query Devtools"
3. Xem các queries, mutations và cache

## Cấu hình

Cấu hình React Query được đặt trong `QueryProvider`:

-   `staleTime`: 5 phút (thời gian data được coi là fresh)
-   `gcTime`: 10 phút (thời gian cache trong background)
-   `refetchOnWindowFocus`: false (không refetch khi focus window)
-   `refetchOnReconnect`: true (refetch khi reconnect)
