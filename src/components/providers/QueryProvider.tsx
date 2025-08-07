"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Thời gian cache mặc định
                        staleTime: 5 * 60 * 1000, // 5 phút
                        // Thời gian cache trong background
                        gcTime: 10 * 60 * 1000, // 10 phút
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
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
