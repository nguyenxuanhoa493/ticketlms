"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ExecuteParams {
    selectedEnvId: string;
    path: string;
    method: string;
    payload: string;
    dmn: string;
    userCode: string;
    password: string;
    selectedEnv: any;
}

export function useApiRunner() {
    const [loading, setLoading] = useState(false);
    const [isExecuting, setIsExecuting] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [requestHistory, setRequestHistory] = useState<any[]>([]);
    const { toast } = useToast();

    const validateAndExecute = async ({
        selectedEnvId,
        path,
        method,
        payload,
        dmn,
        userCode,
        password,
        selectedEnv,
    }: ExecuteParams) => {
        setLoading(true);
        setIsExecuting(true);
        setError("");
        setResponse(null);
        setRequestHistory([]);

        // Validation
        if (!selectedEnvId) {
            setError("Vui lòng chọn môi trường");
            setLoading(false);
            setIsExecuting(false);
            return;
        }

        if (!path) {
            setError("Vui lòng nhập path");
            setLoading(false);
            setIsExecuting(false);
            return;
        }

        if (!dmn) {
            setError("Vui lòng nhập DMN");
            setLoading(false);
            setIsExecuting(false);
            return;
        }

        // Validate JSON payload
        let parsedPayload = {};
        try {
            parsedPayload = JSON.parse(payload);
        } catch (e) {
            setError("Payload không phải JSON hợp lệ");
            setLoading(false);
            setIsExecuting(false);
            return;
        }

        try {
            // Add initial loading entry to history
            const loginHistoryId = Date.now();
            setRequestHistory([{
                id: loginHistoryId,
                method: "POST",
                url: `${selectedEnv?.host}/user/login`,
                payload: { lname: userCode || dmn },
                statusCode: null,
                responseTime: null,
                response: null,
                timestamp: new Date().toISOString(),
                isLoading: true,
                step: "Đang đăng nhập...",
            }]);

            const res = await fetch("/api/tools/api-runner", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    environmentId: selectedEnvId,
                    path,
                    method,
                    payload: parsedPayload,
                    dmn,
                    userCode: userCode || dmn,
                    password: password || undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setResponse(data.data.response);
                // Map history with unique IDs and completed state
                const mappedHistory = (data.data.requestHistory || []).map((item: any, index: number) => ({
                    ...item,
                    id: Date.now() + index,
                    isLoading: false,
                    isComplete: true,
                }));
                setRequestHistory(mappedHistory);
            } else {
                setError(data.error || "API call failed");
                // Map history with unique IDs and error state
                const mappedHistory = (data.requestHistory || []).map((item: any, index: number) => ({
                    ...item,
                    id: Date.now() + index,
                    isLoading: false,
                    isComplete: true,
                    hasError: item.statusCode !== 200,
                }));
                setRequestHistory(mappedHistory);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Request failed");
        } finally {
            setLoading(false);
            setIsExecuting(false);
        }
    };

    return {
        loading,
        isExecuting,
        response,
        error,
        requestHistory,
        validateAndExecute,
        toast,
    };
}
