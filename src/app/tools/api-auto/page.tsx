"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, FolderTree, ChevronRight, ChevronDown } from "lucide-react";

interface Environment {
    id: string;
    name: string;
    host: string;
    dmn: string;
}

interface Program {
    iid: number;
    name: string;
    code: string;
    status: string;
}

interface RequestHistory {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
    timestamp: string;
}

export default function ApiAutoPage() {
    const { toast } = useToast();
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
    const [dmn, setDmn] = useState<string>("");
    const [userCode, setUserCode] = useState<string>("");
    const [pass, setPass] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
    const [executionTime, setExecutionTime] = useState<number>(0);
    const [cloneResult, setCloneResult] = useState<any>(null);

    // Fetch environments
    useEffect(() => {
        fetchEnvironments();
    }, []);

    const fetchEnvironments = async () => {
        try {
            const response = await fetch("/api/tools/environments");
            if (response.ok) {
                const data = await response.json();
                setEnvironments(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch environments:", error);
        }
    };

    // Auto-fill DMN when environment changes
    useEffect(() => {
        const env = environments.find((e) => e.id === selectedEnvironment);
        if (env) {
            setDmn(env.dmn);
        }
    }, [selectedEnvironment, environments]);

    // Step 1: Get list of programs
    const handleGetPrograms = async () => {
        if (!selectedEnvironment) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn môi trường",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setPrograms([]);
        setSelectedProgram(null);
        setCloneResult(null);

        try {
            const response = await fetch("/api/tools/auto-flow/clone-program", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    environment_id: selectedEnvironment,
                    dmn: dmn || undefined,
                    user_code: userCode || undefined,
                    pass: pass || undefined,
                    step: "get_programs",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get programs");
            }

            setPrograms(data.data.programs || []);
            setRequestHistory(data.requestHistory || []);
            setExecutionTime(data.executionTime || 0);

            toast({
                title: "Thành công",
                description: data.message || `Tìm thấy ${data.data.programs.length} chương trình`,
            });
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Clone selected program
    const handleCloneProgram = async () => {
        if (!selectedProgram) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn chương trình cần clone",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setCloneResult(null);

        try {
            const response = await fetch("/api/tools/auto-flow/clone-program", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    environment_id: selectedEnvironment,
                    dmn: dmn || undefined,
                    user_code: userCode || undefined,
                    pass: pass || undefined,
                    step: "clone",
                    program_iid: selectedProgram,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to clone program");
            }

            setCloneResult(data.data);
            setRequestHistory(data.requestHistory || []);
            setExecutionTime(data.executionTime || 0);

            toast({
                title: "Thành công",
                description: data.message || "Clone chương trình thành công",
            });
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">API Auto - Clone Chương trình</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Left Panel: Inputs */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-base">Cấu hình</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3 space-y-3">
                        {/* Base Inputs */}
                        <div className="space-y-2">
                            <Label htmlFor="environment">Môi trường *</Label>
                            <Select
                                value={selectedEnvironment}
                                onValueChange={setSelectedEnvironment}
                            >
                                <SelectTrigger id="environment">
                                    <SelectValue placeholder="Chọn môi trường" />
                                </SelectTrigger>
                                <SelectContent>
                                    {environments.map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name} ({env.dmn})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="dmn">DMN</Label>
                                <Input
                                    id="dmn"
                                    value={dmn}
                                    onChange={(e) => setDmn(e.target.value)}
                                    placeholder="Để trống = môi trường"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="user_code">User Code</Label>
                                <Input
                                    id="user_code"
                                    value={userCode}
                                    onChange={(e) => setUserCode(e.target.value)}
                                    placeholder="Để trống = dmn"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pass">Password</Label>
                            <Input
                                id="pass"
                                type="password"
                                value={pass}
                                onChange={(e) => setPass(e.target.value)}
                                placeholder="Để trống = pass môi trường"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                            <Button
                                onClick={handleGetPrograms}
                                disabled={loading || !selectedEnvironment}
                                className="flex-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tải...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Lấy danh sách
                                    </>
                                )}
                            </Button>

                            <Button
                                onClick={handleCloneProgram}
                                disabled={loading || !selectedProgram}
                                variant="default"
                                className="flex-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang clone...
                                    </>
                                ) : (
                                    "Clone"
                                )}
                            </Button>
                        </div>

                        {/* Program Selection Table */}
                        {programs.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                                <Label>Chọn chương trình ({programs.length})</Label>
                                <div className="border rounded-lg max-h-[300px] overflow-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="p-2 text-left w-12">Chọn</th>
                                                <th className="p-2 text-left w-16">STT</th>
                                                <th className="p-2 text-left w-20">IID</th>
                                                <th className="p-2 text-left">Tên</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {programs.map((program, index) => (
                                                <tr
                                                    key={program.iid}
                                                    className={`border-t hover:bg-gray-50 cursor-pointer ${
                                                        selectedProgram === program.iid
                                                            ? "bg-blue-50"
                                                            : ""
                                                    }`}
                                                    onClick={() => setSelectedProgram(program.iid)}
                                                >
                                                    <td className="p-2 text-center">
                                                        <input
                                                            type="radio"
                                                            checked={selectedProgram === program.iid}
                                                            onChange={() =>
                                                                setSelectedProgram(program.iid)
                                                            }
                                                        />
                                                    </td>
                                                    <td className="p-2">{index + 1}</td>
                                                    <td className="p-2 font-mono text-xs">
                                                        {program.iid}
                                                    </td>
                                                    <td className="p-2">{program.name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Panel: Outputs */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle className="text-base">Kết quả</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3 space-y-3">
                        {/* Execution Time */}
                        {executionTime > 0 && (
                            <div className="text-sm text-gray-600">
                                Thời gian thực thi: <span className="font-semibold">{executionTime}ms</span>
                            </div>
                        )}

                        {/* Clone Result */}
                        {cloneResult && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm font-semibold text-green-900 mb-2">
                                    Clone thành công!
                                </p>
                                <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-[200px]">
                                    {JSON.stringify(cloneResult, null, 2)}
                                </pre>
                            </div>
                        )}

                        {/* Request History */}
                        {requestHistory.length > 0 && (
                            <div className="space-y-2">
                                <Label>Lịch sử request ({requestHistory.length})</Label>
                                <div className="space-y-2 max-h-[400px] overflow-auto">
                                    {requestHistory.map((req, index) => (
                                        <div
                                            key={index}
                                            className="border rounded-lg p-2 bg-gray-50 text-xs"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-semibold">
                                                    {req.method} {req.statusCode}
                                                </span>
                                                <span className="text-gray-600">
                                                    {req.responseTime}ms
                                                </span>
                                            </div>
                                            <div className="text-gray-600 truncate">{req.url}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {programs.length === 0 && !cloneResult && (
                            <div className="text-center text-gray-500 py-8">
                                <FolderTree className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>Chưa có dữ liệu</p>
                                <p className="text-sm">Nhấn "Lấy danh sách" để bắt đầu</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
