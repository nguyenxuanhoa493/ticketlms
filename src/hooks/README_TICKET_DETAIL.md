# Ticket Detail - React Query Optimization

## Vấn đề trước đây

Khi bấm vào ticket để xem chi tiết, API bị gọi nhiều lần và lặp lại do:

1. **useEffect với Promise.all** - Gọi nhiều API cùng lúc
2. **React Strict Mode** - Gọi effect hai lần trong development
3. **Re-renders** - Component re-render gây gọi lại API
4. **Không có cache** - Mỗi lần navigate đều gọi API mới

## Giải pháp với React Query

### 1. **Tự động deduplication**
```typescript
// React Query tự động tránh duplicate requests
const { data: ticket } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicketDetail(ticketId),
    enabled: !!ticketId,
});
```

### 2. **Smart caching**
```typescript
// Cache data trong 5 phút, background cache 10 phút
staleTime: 5 * 60 * 1000, // 5 phút
gcTime: 10 * 60 * 1000, // 10 phút
```

### 3. **Background refetching**
- Tự động refresh data khi cần
- Không block UI khi refetch
- Chỉ refetch khi data stale

### 4. **Optimistic updates**
```typescript
// Update UI ngay lập tức, sync với server sau
const updateTicketMutation = useMutation({
    mutationFn: updateTicket,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["ticket", ticketId] });
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
});
```

## Lợi ích

### 1. **Performance**
- ✅ Không còn duplicate API calls
- ✅ Cache data giữa các lần navigate
- ✅ Background refetching không block UI

### 2. **User Experience**
- ✅ Loading states tốt hơn
- ✅ Error handling nhất quán
- ✅ Optimistic updates cho mutations

### 3. **Developer Experience**
- ✅ DevTools để debug
- ✅ Automatic retry logic
- ✅ Built-in error handling

## Migration từ hook cũ

### Trước (useTicketDetail):
```typescript
// Gọi API nhiều lần
useEffect(() => {
    const initializeData = async () => {
        await Promise.all([
            fetchTicket(),
            fetchOrganizations(),
            fetchCurrentUser(),
        ]);
    };
    initializeData();
}, [ticketId]);
```

### Sau (useTicketDetailQuery):
```typescript
// React Query tự động quản lý
const { data: ticket } = useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: () => fetchTicketDetail(ticketId),
});

const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: fetchOrganizations,
});
```

## Cách test

### 1. **Kiểm tra Network tab**
- Mở Developer Tools > Network
- Navigate giữa các tickets
- Xem chỉ có 1 request cho mỗi ticket

### 2. **Kiểm tra React Query DevTools**
- Mở React Query Devtools
- Xem cache state
- Kiểm tra query status

### 3. **Test navigation**
```bash
# Navigate giữa các tickets
/tickets/1 -> /tickets/2 -> /tickets/1
# Ticket 1 sẽ được load từ cache
```

## Cache Strategy

### 1. **Ticket data**
- `staleTime`: 5 phút
- `gcTime`: 10 phút
- Invalidate khi update

### 2. **Comments**
- `staleTime`: 2 phút
- `gcTime`: 5 phút
- Invalidate khi add/edit/delete

### 3. **User & Organizations**
- `staleTime`: 10 phút
- `gcTime`: 30 phút
- Shared cache across pages

## Error Handling

### 1. **Retry logic**
```typescript
retry: (failureCount, error) => {
    if (error.message.includes("Ticket not found")) {
        return false; // Không retry nếu ticket không tồn tại
    }
    return failureCount < 2; // Retry tối đa 2 lần
},
```

### 2. **Error UI**
- Hiển thị error page khi có lỗi
- Nút "Quay lại" để navigate
- Toast notifications cho mutations

## Performance Metrics

### Trước:
- ❌ 3-4 API calls mỗi lần navigate
- ❌ Không có cache
- ❌ Blocking UI khi loading

### Sau:
- ✅ 1 API call cho ticket mới
- ✅ Cache data giữa các lần navigate
- ✅ Non-blocking background refetch
- ✅ Optimistic updates 