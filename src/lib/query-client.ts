import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Thời gian cache mặc định
            staleTime: 5 * 60 * 1000, // 5 phút
            // Thời gian cache trong background
            gcTime: 10 * 60 * 1000, // 10 phút (trước đây là cacheTime)
            // Tự động retry khi lỗi
            retry: 1,
            // Refetch khi window focus
            refetchOnWindowFocus: false,
            // Refetch khi reconnect
            refetchOnReconnect: true,
        },
        mutations: {
            // Retry khi mutation lỗi
            retry: 1,
        },
    },
});
