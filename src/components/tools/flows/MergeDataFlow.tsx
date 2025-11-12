"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BaseFlowLayout } from "./BaseFlowLayout";
import { FlowStep } from "./FlowStep";

interface MergeDataFlowProps {
    environmentId: string;
    dmn: string;
    userCode: string;
    pass: string;
}

interface UserInfo {
    iid: number;
    code: string;
    name: string;
    mail: string;
    phone?: string;
    name_org?: string;
    ep_count: number;
}

export function MergeDataFlow({
    environmentId,
    dmn,
    userCode,
    pass,
}: MergeDataFlowProps) {
    const [fromUserCode, setFromUserCode] = useState("");
    const [toUserCode, setToUserCode] = useState("");
    const [fromUser, setFromUser] = useState<UserInfo | null>(null);
    const [toUser, setToUser] = useState<UserInfo | null>(null);
    const [searching, setSearching] = useState(false);
    const [merging, setMerging] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [requestHistory, setRequestHistory] = useState<any[]>([]);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [mergeResult, setMergeResult] = useState<{
        success: boolean;
        message?: string;
    } | null>(null);

    const { toast } = useToast();

    const handleSearch = async () => {
        if (!fromUserCode && !toUserCode) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập ít nhất một mã user",
                variant: "destructive",
            });
            return;
        }

        setSearching(true);
        setLoadingMessage("Đang tìm kiếm thông tin user...");
        setFromUser(null);
        setToUser(null);
        setMergeResult(null);

        try {
            const response = await fetch("/api/tools/auto-flow/merge-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "search_users",
                    environment_id: environmentId,
                    dmn,
                    user_code: userCode,
                    pass,
                    from_user_code: fromUserCode || null,
                    to_user_code: toUserCode || null,
                }),
            });

            const data = await response.json();

            if (data.requestHistory) {
                setRequestHistory(data.requestHistory);
            }

            if (!response.ok || !data.success) {
                toast({
                    title: "Lỗi",
                    description: data.error || "Không thể tìm kiếm user",
                    variant: "destructive",
                });
                return;
            }

            if (data.data?.fromUser) {
                setFromUser(data.data.fromUser);
            }
            if (data.data?.toUser) {
                setToUser(data.data.toUser);
            }

            toast({
                title: "Thành công",
                description: "Tìm thấy thông tin user",
            });
        } catch (error) {
            console.error("Search error:", error);
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Có lỗi xảy ra",
                variant: "destructive",
            });
        } finally {
            setSearching(false);
            setLoadingMessage("");
        }
    };

    const handleMerge = async () => {
        if (!fromUser || !toUser) return;

        setMerging(true);
        setLoadingMessage("Đang copy dữ liệu học tập...");
        setMergeResult(null);

        try {
            const response = await fetch("/api/tools/auto-flow/merge-data", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "merge_data",
                    environment_id: environmentId,
                    dmn,
                    user_code: userCode,
                    pass,
                    from_user_iid: fromUser.iid,
                    to_user_iid: toUser.iid,
                }),
            });

            const data = await response.json();

            if (data.requestHistory) {
                setRequestHistory((prev) => [...prev, ...data.requestHistory]);
            }

            if (!response.ok || !data.success) {
                toast({
                    title: "Lỗi",
                    description: data.error || "Không thể copy dữ liệu",
                    variant: "destructive",
                });
                setMergeResult({
                    success: false,
                    message: data.error || "Có lỗi xảy ra",
                });
                return;
            }

            setMergeResult({
                success: true,
                message: data.message || "Copy dữ liệu thành công",
            });

            toast({
                title: "Thành công",
                description: data.message || "Copy dữ liệu thành công",
            });
        } catch (error) {
            console.error("Merge error:", error);
            const errorMessage = error instanceof Error ? error.message : "Có lỗi xảy ra";
            toast({
                title: "Lỗi",
                description: errorMessage,
                variant: "destructive",
            });
            setMergeResult({
                success: false,
                message: errorMessage,
            });
        } finally {
            setMerging(false);
            setLoadingMessage("");
        }
    };

    const renderUserInfo = (user: UserInfo | null, title: string) => {
        if (!user) return null;

        return (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-3">{title}</h4>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">IID:</span>
                        <span className="font-medium">{user.iid}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Tên:</span>
                        <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Code:</span>
                        <span className="font-medium">{user.code}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{user.mail}</span>
                    </div>
                    {user.phone && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Phone:</span>
                            <span className="font-medium">{user.phone}</span>
                        </div>
                    )}
                    {user.name_org && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tổ chức:</span>
                            <span className="font-medium">{user.name_org}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-gray-600">Số EP:</span>
                        <span className="font-medium">{user.ep_count}</span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <BaseFlowLayout
            flowDescription="Copy dữ liệu học tập, kết quả thi sang cho tài khoản khác"
            loadingMessage={loadingMessage}
            requestHistory={requestHistory}
            historyExpanded={historyExpanded}
            onHistoryToggle={setHistoryExpanded}
            emptyStateMessage="Request history sẽ hiển thị ở đây"
            emptyStateIcon={
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            }
            steps={
                <>
                    {/* Step 1: Search Users */}
                    <FlowStep
                        title="Bước 1: Tìm kiếm User"
                        description=""
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* From User */}
                                <div>
                                    <Label htmlFor="fromUserCode">
                                        Nhập mã user cần copy
                                    </Label>
                                    <Input
                                        id="fromUserCode"
                                        value={fromUserCode}
                                        onChange={(e) => setFromUserCode(e.target.value)}
                                        placeholder="Nhập mã user"
                                        disabled={searching || merging}
                                    />
                                </div>

                                {/* To User */}
                                <div>
                                    <Label htmlFor="toUserCode">
                                        Nhập mã user nhận dữ liệu
                                    </Label>
                                    <Input
                                        id="toUserCode"
                                        value={toUserCode}
                                        onChange={(e) => setToUserCode(e.target.value)}
                                        placeholder="Nhập mã user"
                                        disabled={searching || merging}
                                    />
                                </div>
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={
                                    !environmentId ||
                                    !dmn ||
                                    (!fromUserCode && !toUserCode) ||
                                    searching ||
                                    merging
                                }
                                className="w-full"
                            >
                                {searching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tìm kiếm...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 mr-2" />
                                        Tìm kiếm
                                    </>
                                )}
                            </Button>

                            {(!environmentId || !dmn) && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Vui lòng chọn môi trường và nhập DMN để tiếp tục
                                </p>
                            )}

                            {/* Display User Info */}
                            {(fromUser || toUser) && (
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {renderUserInfo(fromUser, "User cần copy")}
                                    {renderUserInfo(toUser, "User nhận dữ liệu")}
                                </div>
                            )}
                        </div>
                    </FlowStep>

                    {/* Step 2: Merge Data */}
                    {fromUser && toUser && (
                        <FlowStep
                            title="Bước 2: Copy dữ liệu"
                            description=""
                        >
                            <div className="space-y-3">
                                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-start gap-2 text-yellow-800">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm">
                                            <p className="font-medium mb-1">Lưu ý:</p>
                                            <p>
                                                Dữ liệu học tập từ user{" "}
                                                <strong>{fromUser.name}</strong> ({fromUser.code})
                                                sẽ được copy sang user{" "}
                                                <strong>{toUser.name}</strong> ({toUser.code})
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleMerge}
                                    disabled={merging}
                                    className="w-full"
                                    variant="default"
                                >
                                    {merging ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang copy...
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy Dữ Liệu
                                        </>
                                    )}
                                </Button>

                                {/* Result */}
                                {mergeResult && (
                                    <div
                                        className={`p-3 rounded-lg border ${
                                            mergeResult.success
                                                ? "bg-green-50 border-green-200"
                                                : "bg-red-50 border-red-200"
                                        }`}
                                    >
                                        <div
                                            className={`flex items-center gap-2 ${
                                                mergeResult.success
                                                    ? "text-green-700"
                                                    : "text-red-700"
                                            }`}
                                        >
                                            {mergeResult.success ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4" />
                                            )}
                                            <span className="font-medium">
                                                {mergeResult.message}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </FlowStep>
                    )}
                </>
            }
        />
    );
}
