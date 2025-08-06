# Sửa lỗi "Too many re-renders" - Infinite Loop

## Vấn đề

Lỗi "Too many re-renders. React limits the number of renders to prevent an infinite loop" xảy ra khi:

1. **State update trong render cycle** - Gọi `setState` trong component body
2. **useEffect không có dependency array** - Effect chạy mỗi lần render
3. **Circular dependencies** - State A update State B, State B update State A

## Nguyên nhân trong code

### ❌ **Code gây lỗi:**

```typescript
export function useTicketDetailQuery(ticketId: string) {
    const [formData, setFormData] = useState(initialFormData);

    // ❌ Gây infinite re-render - chạy mỗi lần render
    if (ticket && !isEditing) {
        setFormData({
            title: ticket.title || "",
            description: ticket.description || "",
            // ... other fields
        });
    }

    return { formData, setFormData };
}
```

### ✅ **Code đã sửa:**

```typescript
export function useTicketDetailQuery(ticketId: string) {
    const [formData, setFormData] = useState(initialFormData);

    // ✅ Sử dụng useEffect với dependency array
    useEffect(() => {
        if (ticket && !isEditing) {
            setFormData({
                title: ticket.title || "",
                description: ticket.description || "",
                // ... other fields
            });
        }
    }, [ticket, isEditing]); // Chỉ chạy khi ticket hoặc isEditing thay đổi

    return { formData, setFormData };
}
```

## Các nguyên nhân khác

### 1. **useEffect không có dependency array**

```typescript
// ❌ Chạy mỗi lần render
useEffect(() => {
    setCount((prev) => prev + 1);
});

// ✅ Chỉ chạy một lần khi mount
useEffect(() => {
    setCount((prev) => prev + 1);
}, []);
```

### 2. **State update trong event handler**

```typescript
// ❌ Có thể gây re-render không mong muốn
const handleClick = () => {
    setState(newValue);
    setOtherState(derivedValue); // Có thể gây re-render
};

// ✅ Sử dụng functional update
const handleClick = () => {
    setState(newValue);
    setOtherState((prev) => derivedValue); // An toàn hơn
};
```

### 3. **Object/Array trong dependency array**

```typescript
// ❌ Object mới mỗi lần render
useEffect(() => {
    // effect logic
}, [{ id: 1, name: "test" }]);

// ✅ Sử dụng primitive values
useEffect(() => {
    // effect logic
}, [1, "test"]);
```

## Cách debug

### 1. **Kiểm tra console**

-   Xem error message
-   Kiểm tra component nào gây lỗi

### 2. **Sử dụng React DevTools**

-   Profiler để xem re-render pattern
-   Component tree để xem state changes

### 3. **Thêm console.log**

```typescript
useEffect(() => {
    console.log("Effect running:", { ticket, isEditing });
}, [ticket, isEditing]);
```

### 4. **Test page**

Truy cập `/test-render` để kiểm tra render count.

## Best Practices

### 1. **Luôn sử dụng dependency array**

```typescript
useEffect(() => {
    // effect logic
}, [dependency1, dependency2]);
```

### 2. **Tránh state update trong render**

```typescript
// ❌ Không làm thế này
if (condition) {
    setState(newValue);
}

// ✅ Sử dụng useEffect
useEffect(() => {
    if (condition) {
        setState(newValue);
    }
}, [condition]);
```

### 3. **Sử dụng useCallback cho functions**

```typescript
const handleClick = useCallback(() => {
    setState(newValue);
}, [dependency]);
```

### 4. **Sử dụng useMemo cho expensive calculations**

```typescript
const expensiveValue = useMemo(() => {
    return heavyCalculation(data);
}, [data]);
```

## Cách test sau khi sửa

### 1. **Test render count**

```bash
http://localhost:3000/test-render
```

### 2. **Test ticket detail page**

```bash
http://localhost:3000/tickets/[id]
```

### 3. **Test navigation**

-   Navigate giữa các tickets
-   Kiểm tra không có infinite re-render

### 4. **Kiểm tra console**

-   Không có error messages
-   Render count ổn định

## Lưu ý

-   ✅ **useEffect** với dependency array
-   ✅ **useCallback** cho event handlers
-   ✅ **useMemo** cho expensive calculations
-   ❌ **State update** trong render cycle
-   ❌ **useEffect** không có dependency array
-   ❌ **Object/Array** trong dependency array
