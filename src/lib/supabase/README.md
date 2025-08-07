# Supabase Singleton Pattern

## Tổng quan

Để tối ưu hóa việc sử dụng Supabase client và tiết kiệm tài nguyên, chúng ta đã implement singleton pattern cho Supabase client.

## Cách sử dụng

### 1. Server-side Components (Server Components)

```typescript
import { getServerClient } from "@/lib/supabase/client";

export default async function MyServerComponent() {
    const supabase = await getServerClient();

    const { data, error } = await supabase.from("tickets").select("*");

    // ...
}
```

### 2. API Routes

```typescript
import { createApiClient } from "@/lib/supabase/client";
import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = await cookies();
    const supabase = createApiClient(cookieStore);

    const { data, error } = await supabase.from("tickets").select("*");

    // ...
}
```

### 3. Admin Operations

```typescript
import { getAdminClient } from "@/lib/supabase/client";

export async function adminOperation() {
    const supabase = getAdminClient();

    const { data, error } = await supabase.from("tickets").select("*");

    // ...
}
```

### 4. Client-side Components

```typescript
import { getBrowserClient } from "@/lib/supabase/client";

export default function MyClientComponent() {
    const supabase = getBrowserClient();

    const handleClick = async () => {
        const { data, error } = await supabase.from("tickets").select("*");
    };

    // ...
}
```

## Lợi ích

1. **Tiết kiệm tài nguyên**: Chỉ khởi tạo client một lần
2. **Tăng hiệu suất**: Giảm thời gian khởi tạo
3. **Quản lý tốt hơn**: Tập trung quản lý connection
4. **Backward compatibility**: Vẫn hỗ trợ code cũ

## Migration Guide

### Từ code cũ:

```typescript
// ❌ Cũ
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const cookieStore = await cookies();
const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value;
            },
        },
    }
);
```

### Sang code mới:

```typescript
// ✅ Mới
import { getServerClient } from "@/lib/supabase/client";

const supabase = await getServerClient();
```

## Các function có sẵn

-   `getBrowserClient()`: Browser client singleton
-   `getServerClient()`: Server client singleton (async)
-   `getAdminClient()`: Admin client singleton
-   `createApiClient(cookieStore)`: API client factory
-   `createAdminApiClient(cookieStore)`: Admin API client factory
-   `resetClients()`: Reset tất cả clients (cho testing)

## Lưu ý

-   `getServerClient()` là async function vì cần await cookies()
-   Sử dụng `getAdminClient()` cho admin operations
-   Sử dụng `createApiClient()` cho API routes
-   Sử dụng `getBrowserClient()` cho client-side components
