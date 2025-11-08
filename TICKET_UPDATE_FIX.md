# Ticket Update Issues - Fixed

## Issues Found

### 1. API được gọi 2 lần (Duplicate API Calls)
**Nguyên nhân:**
- Button onClick handler không có `preventDefault()` và `stopPropagation()` 
- Event bubbling có thể trigger handler nhiều lần
- React Query mutation retry được set thành 1, nếu lỗi sẽ tự động retry

**Giải pháp:**
- Thêm `e.preventDefault()` và `e.stopPropagation()` vào `handleSave()` function
- Giữ nguyên guard `isPending` để tránh duplicate calls

**Files changed:**
- `src/hooks/useTicketDetailQuery.ts` - Updated `handleSave` function

### 2. Update Ticket trả về lỗi 500 (Update Failed)
**Nguyên nhân:**
- Field `organization_id` có thể bị `undefined` hoặc empty string, nhưng database schema yêu cầu `null` hoặc valid string
- Field `response` không nên được gửi trong update payload (user không có quyền update field này)
- Thiếu validation cho JSON parse error

**Giải pháp:**
- Thêm validation để convert `undefined` hoặc empty string của `organization_id` thành `null`
- Thêm `response` vào danh sách `fieldsToRemove`
- Thêm try-catch cho JSON parsing để return error 400 thay vì 500 khi JSON invalid

**Files changed:**
- `src/app/api/tickets/[id]/route.ts` - Updated PUT handler

## Changes Made

### 1. src/hooks/useTicketDetailQuery.ts
```typescript
// Before:
const handleSave = async () => {
    if (updateTicketMutation.isPending) {
        console.log("[handleSave] Mutation already in progress, skipping...");
        return;
    }
    console.log("[handleSave] Calling mutation with data:", formData);
    updateTicketMutation.mutate({ ticketId, data: formData });
};

// After:
const handleSave = async (e?: React.MouseEvent) => {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    if (updateTicketMutation.isPending) {
        console.log("[handleSave] Mutation already in progress, skipping...");
        return;
    }
    console.log("[handleSave] Calling mutation with data:", formData);
    updateTicketMutation.mutate({ ticketId, data: formData });
};
```

### 2. src/app/api/tickets/[id]/route.ts
```typescript
// Added JSON parse error handling:
let body;
try {
    body = await request.json();
} catch (jsonError) {
    console.error("[PUT /api/tickets/[id]] JSON parse error:", jsonError);
    return NextResponse.json(
        { error: "Invalid JSON in request body", details: jsonError instanceof Error ? jsonError.message : String(jsonError) },
        { status: 400 }
    );
}

// Added organization_id validation:
// Ensure organization_id is never undefined - use null instead
if (finalBody.organization_id === undefined || finalBody.organization_id === "") {
    finalBody.organization_id = null;
}

// Added 'response' to fieldsToRemove:
const fieldsToRemove = ['id', 'created_by', 'organizations', 'created_user', 'assigned_user', 'response'];
```

## Testing Checklist
- [ ] Update ticket với tất cả fields
- [ ] Update ticket khi là admin
- [ ] Update ticket khi là user thông thường  
- [ ] Verify không còn duplicate API calls (chỉ 1 request duy nhất)
- [ ] Verify update thành công với status code 200
- [ ] Check logs không còn 500 errors
- [ ] Test với organization_id = null
- [ ] Test với organization_id = valid UUID

## Additional Notes
- React Query mutation retry is set to 1, which means failed mutations will retry once
- The duplicate calls might also be caused by React's development mode double-rendering, but the fixes should prevent this
- Consider monitoring the logs to confirm only one API call is made per button click
