"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface LmsRequestHistoryItem {
    id: number | string;
    method: string;
    url: string;
    payload: Record<string, any>;
    statusCode: number | null;
    responseTime: number | null;
    response: any;
    timestamp: string;
    isLoading?: boolean;
    isComplete?: boolean;
    hasError?: boolean;
    step?: string;
}

interface UseLmsRequestOptions {
    onSuccess?: (data: any) => void;
    onError?: (error: string) => void;
    showToast?: boolean;
}

interface ExecuteRequestParams {
    apiEndpoint: string;
    requestBody: any;
    successMessage?: string;
    errorMessage?: string;
}

export function useLmsRequest(options: UseLmsRequestOptions = {}) {
    const [loading, setLoading] = useState(false);
    const [requestHistory, setRequestHistory] = useState<LmsRequestHistoryItem[]>([]);
    const [historyExpanded, setHistoryExpanded] = useState(true);
    const { toast } = useToast();

    const { onSuccess, onError, showToast = true } = options;

    /**
     * Add a loading entry to request history
     */
    const addLoadingEntry = useCallback((step: string, url: string) => {
        const entry: LmsRequestHistoryItem = {
            id: Date.now(),
            method: "POST",
            url,
            payload: {},
            statusCode: null,
            responseTime: null,
            response: null,
            timestamp: new Date().toISOString(),
            isLoading: true,
            step,
        };

        setRequestHistory((prev) => [...prev, entry]);
        return entry.id;
    }, []);

    /**
     * Update history with completed requests
     */
    const updateHistory = useCallback((newHistory: any[]) => {
        const mappedHistory = newHistory.map((item, index) => ({
            ...item,
            id: item.id || Date.now() + index,
            isLoading: false,
            isComplete: true,
            hasError: item.statusCode !== 200,
        }));

        setRequestHistory(mappedHistory);
    }, []);

    /**
     * Execute an LMS request with login flow
     */
    const executeRequest = useCallback(
        async ({
            apiEndpoint,
            requestBody,
            successMessage,
            errorMessage,
        }: ExecuteRequestParams) => {
            setLoading(true);
            setRequestHistory([]);

            try {
                // Add login loading entry
                addLoadingEntry("Đang đăng nhập...", `${requestBody.host || ""}/user/login`);

                const response = await fetch(apiEndpoint, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                });

                const data = await response.json();

                if (data.success) {
                    // Update history with actual requests
                    if (data.data?.requestHistory) {
                        updateHistory(data.data.requestHistory);
                    } else if (data.requestHistory) {
                        updateHistory(data.requestHistory);
                    }

                    // Show success toast
                    if (showToast && successMessage) {
                        toast({
                            title: "Thành công",
                            description: successMessage,
                        });
                    }

                    // Call success callback
                    if (onSuccess) {
                        onSuccess(data.data);
                    }

                    return { success: true, data: data.data };
                } else {
                    // Update history with error
                    if (data.data?.requestHistory) {
                        updateHistory(data.data.requestHistory);
                    } else if (data.requestHistory) {
                        updateHistory(data.requestHistory);
                    }

                    const error = data.error || errorMessage || "Request failed";

                    // Show error toast
                    if (showToast) {
                        toast({
                            title: "Lỗi",
                            description: error,
                            variant: "destructive",
                        });
                    }

                    // Call error callback
                    if (onError) {
                        onError(error);
                    }

                    return { success: false, error };
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : "Unknown error";

                if (showToast) {
                    toast({
                        title: "Lỗi",
                        description: errorMsg,
                        variant: "destructive",
                    });
                }

                if (onError) {
                    onError(errorMsg);
                }

                return { success: false, error: errorMsg };
            } finally {
                setLoading(false);
            }
        },
        [addLoadingEntry, updateHistory, toast, showToast, onSuccess, onError]
    );

    /**
     * Reset the request state
     */
    const reset = useCallback(() => {
        setRequestHistory([]);
        setLoading(false);
    }, []);

    return {
        loading,
        requestHistory,
        historyExpanded,
        setHistoryExpanded,
        executeRequest,
        reset,
    };
}
