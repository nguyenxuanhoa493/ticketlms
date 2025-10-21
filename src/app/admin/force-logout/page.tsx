"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, LogOut, RefreshCw } from "lucide-react";

export default function ForceLogoutPage() {
    const [adminKey, setAdminKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        revokedCount?: number;
        failedCount?: number;
        totalUsers?: number;
        note?: string;
        method?: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRevokeAll = async () => {
        if (!adminKey.trim()) {
            setError("Vui lòng nhập admin key");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(
                `/api/admin/revoke-all-sessions?admin_key=${encodeURIComponent(adminKey)}`,
                {
                    method: "POST",
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Có lỗi xảy ra");
                return;
            }

            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi kết nối");
        } finally {
            setLoading(false);
        }
    };

    const handleClearBrowserData = () => {
        // Clear all browser storage
        localStorage.clear();
        sessionStorage.clear();

        // Clear cookies
        const cookies = document.cookie.split(";");
        cookies.forEach((cookie) => {
            const [name] = cookie.split("=");
            document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        alert("Đã xóa dữ liệu browser! Trang sẽ tải lại sau 1 giây.");
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    return (
        <div className="container max-w-2xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Force Logout All Users</h1>
                <p className="text-gray-600 mt-2">
                    Công cụ admin để revoke tất cả sessions và force logout tất cả users
                </p>
            </div>

            {/* Revoke All Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LogOut className="w-5 h-5" />
                        Revoke All Sessions (Server-side)
                    </CardTitle>
                    <CardDescription>
                        Xóa tất cả sessions từ Supabase server, bắt buộc tất cả users phải đăng nhập lại
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-key">Admin Key *</Label>
                        <Input
                            id="admin-key"
                            type="password"
                            placeholder="Nhập admin key từ .env"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-gray-500">
                            Admin key được lưu trong biến môi trường ADMIN_SECRET_KEY
                        </p>
                    </div>

                    <Button
                        onClick={handleRevokeAll}
                        disabled={loading || !adminKey.trim()}
                        className="w-full"
                        variant="destructive"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            <>
                                <LogOut className="w-4 h-4 mr-2" />
                                Revoke All Sessions
                            </>
                        )}
                    </Button>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-900">Lỗi</p>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {result && (
                        <div className={`border rounded-lg p-4 flex items-start gap-2 ${
                            result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
                        }`}>
                            {result.success ? (
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                <p className={`font-medium ${result.success ? 'text-green-900' : 'text-yellow-900'}`}>
                                    {result.message}
                                </p>
                                {result.totalUsers !== undefined && (
                                    <div className="text-sm text-green-700 mt-2 space-y-1">
                                        <p>• Tổng users: {result.totalUsers}</p>
                                        <p>• Revoked thành công: {result.revokedCount}</p>
                                        {result.failedCount! > 0 && (
                                            <p className="text-red-600">
                                                • Failed: {result.failedCount}
                                            </p>
                                        )}
                                        {result.note && (
                                            <p className="text-xs text-gray-600 mt-2">
                                                ℹ️ {result.note}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Clear Browser Data */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="w-5 h-5" />
                        Clear Browser Data (Client-side)
                    </CardTitle>
                    <CardDescription>
                        Xóa localStorage, sessionStorage, cookies của browser hiện tại
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={handleClearBrowserData}
                        variant="outline"
                        className="w-full"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Clear Browser Data
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                        ⚠️ Chỉ xóa dữ liệu trên browser này. Các thiết bị khác không bị ảnh hưởng.
                    </p>
                </CardContent>
            </Card>

            {/* Manual SQL Method */}
            <Card className="bg-purple-50 border-purple-200">
                <CardHeader>
                    <CardTitle className="text-purple-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Phương án SQL (Nếu API không hoạt động)
                    </CardTitle>
                    <CardDescription className="text-purple-800">
                        Chạy trực tiếp SQL trong Supabase Dashboard để revoke tất cả sessions
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                        <pre>{`-- Delete all active sessions
DELETE FROM auth.sessions;

-- Delete all refresh tokens  
DELETE FROM auth.refresh_tokens;

-- Verify deletion
SELECT COUNT(*) as remaining_sessions FROM auth.sessions;
SELECT COUNT(*) as remaining_tokens FROM auth.refresh_tokens;`}</pre>
                    </div>
                    
                    <div className="space-y-2 text-sm text-purple-900">
                        <p><strong>Cách chạy:</strong></p>
                        <ol className="list-decimal list-inside ml-4 space-y-1">
                            <li>Mở Supabase Dashboard → SQL Editor</li>
                            <li>Copy đoạn SQL trên</li>
                            <li>Paste vào SQL Editor</li>
                            <li>Click "Run" để thực thi</li>
                            <li>Tất cả users sẽ bị logout ngay lập tức</li>
                        </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-900">
                        <p><strong>⚠️ Lưu ý:</strong></p>
                        <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                            <li>Không thể undo sau khi chạy</li>
                            <li>TẤT CẢ users (bao gồm bạn) sẽ bị logout</li>
                            <li>Phải thông báo users trước khi chạy</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                    <CardTitle className="text-blue-900">Hướng dẫn</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-blue-800 space-y-2">
                    <p><strong>1. Revoke All Sessions (Server-side):</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Xóa tất cả sessions từ Supabase</li>
                        <li>Force logout TẤT CẢ users trên mọi thiết bị</li>
                        <li>Cần admin key để thực hiện</li>
                    </ul>

                    <p className="mt-4"><strong>2. Clear Browser Data (Client-side):</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Chỉ xóa dữ liệu local trên browser hiện tại</li>
                        <li>Không ảnh hưởng đến sessions trên server</li>
                        <li>Dùng để fix lỗi cache hoặc session conflict</li>
                    </ul>

                    <p className="mt-4"><strong>Khi nào nên dùng:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Sau khi update authentication logic</li>
                        <li>Khi phát hiện session conflict/sharing</li>
                        <li>Khi cần force tất cả users login lại</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
