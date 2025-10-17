"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Play, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Program {
    iid: number;
    name: string;
    code: string;
    status: string;
}

interface RequestHistory {
    method: string;
    url: string;
    payload: Record<string, any>;
    statusCode: number;
    responseTime: number;
    response: any;
    timestamp: string;
}

interface CloneProgramFlowProps {
    environmentId: string;
    dmn: string;
    userCode: string;
    pass: string;
}

export function CloneProgramFlow({
    environmentId,
    dmn,
    userCode,
    pass,
}: CloneProgramFlowProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState<string>("");
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [requestHistory, setRequestHistory] = useState<RequestHistory[]>([]);
    const [executionTime, setExecutionTime] = useState<number>(0);
    const [cloneResult, setCloneResult] = useState<any>(null);
    const [historyExpanded, setHistoryExpanded] = useState(false);

    // Status filters
    const [statusApproved, setStatusApproved] = useState(true);
    const [statusQueued, setStatusQueued] = useState(false);

    // Step 1: Get list of programs
    const handleGetPrograms = async () => {
        if (!environmentId) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn môi trường",
                variant: "destructive",
            });
            return;
        }

        // Build status array
        const statuses: string[] = [];
        if (statusApproved) statuses.push("approved");
        if (statusQueued) statuses.push("queued");

        if (statuses.length === 0) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn ít nhất một trạng thái",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setLoadingMessage("Đang lấy danh sách chương trình từ contenttlx...");
        setPrograms([]);
        setSelectedProgram(null);
        setCloneResult(null);

        try {
            // Only get from content-tlx
            const response = await fetch("/api/tools/auto-flow/clone-program", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    environment_id: environmentId,
                    dmn: "contenttlx",
                    user_code: userCode || undefined,
                    pass: pass || undefined,
                    step: "get_programs",
                    statuses,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to get programs from contenttlx");
            }

            const programs = data.data.programs || [];
            
            setPrograms(programs);
            setRequestHistory(data.requestHistory || []);
            setExecutionTime(data.executionTime || 0);

            toast({
                title: "Thành công",
                description: `Tìm thấy ${programs.length} chương trình từ contenttlx`,
            });
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setLoadingMessage("");
        }
    };

    // Step 2: Clone selected program (using domain input)
    const handleCloneProgram = async () => {
        if (!selectedProgram) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn chương trình cần clone",
                variant: "destructive",
            });
            return;
        }

        if (!dmn) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập DMN để clone",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setLoadingMessage(`Đang clone chương trình #${selectedProgram} vào ${dmn}...`);
        setCloneResult(null);

        try {
            const response = await fetch("/api/tools/auto-flow/clone-program", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    environment_id: environmentId,
                    dmn: dmn, // Use domain input for cloning
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
            setLoadingMessage("");
        }
    };

    return (
        <div className="space-y-3">
            {/* Loading Status */}
            {loading && loadingMessage && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-blue-900">{loadingMessage}</span>
                </div>
            )}
            {/* Status Filters */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                <Label className="text-sm font-medium">Trạng thái:</Label>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="status-approved"
                        checked={statusApproved}
                        onCheckedChange={(checked) =>
                            setStatusApproved(checked as boolean)
                        }
                    />
                    <label
                        htmlFor="status-approved"
                        className="text-sm cursor-pointer"
                    >
                        Đã duyệt (approved)
                    </label>
                </div>
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="status-queued"
                        checked={statusQueued}
                        onCheckedChange={(checked) =>
                            setStatusQueued(checked as boolean)
                        }
                    />
                    <label
                        htmlFor="status-queued"
                        className="text-sm cursor-pointer"
                    >
                        Chưa duyệt (queued)
                    </label>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <Button
                    onClick={handleGetPrograms}
                    disabled={loading || !environmentId}
                    size="sm"
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

                {selectedProgram && (
                    <Button
                        onClick={handleCloneProgram}
                        disabled={loading || !dmn}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang clone...
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4 mr-2" />
                                Clone chương trình
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Program Selection Table */}
            {programs.length > 0 && (
                <div className="space-y-2">
                    <Label>Chọn chương trình ({programs.length})</Label>
                    <div className="border rounded-lg max-h-[300px] overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="p-2 text-left w-12">Chọn</th>
                                    <th className="p-2 text-left w-16">STT</th>
                                    <th className="p-2 text-left w-20">IID</th>
                                    <th className="p-2 text-left">Tên</th>
                                    <th className="p-2 text-left w-32">
                                        Trạng thái
                                    </th>
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
                                        onClick={() =>
                                            setSelectedProgram(program.iid)
                                        }
                                    >
                                        <td className="p-2 text-center">
                                            <input
                                                type="radio"
                                                checked={
                                                    selectedProgram ===
                                                    program.iid
                                                }
                                                onChange={() =>
                                                    setSelectedProgram(
                                                        program.iid
                                                    )
                                                }
                                            />
                                        </td>
                                        <td className="p-2">{index + 1}</td>
                                        <td className="p-2 font-mono text-xs">
                                            {program.iid}
                                        </td>
                                        <td className="p-2">{program.name}</td>
                                        <td className="p-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${
                                                    program.status ===
                                                    "approved"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}
                                            >
                                                {program.status === "approved"
                                                    ? "Đã duyệt"
                                                    : "Chưa duyệt"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="space-y-3">
                {/* Execution Time */}
                {executionTime > 0 && (
                    <div className="text-sm text-gray-600">
                        Thời gian thực thi:{" "}
                        <span className="font-semibold">{executionTime}ms</span>
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

                {/* Request History - Collapsible */}
                {requestHistory.length > 0 && (
                    <div className="border rounded-lg">
                        <button
                            onClick={() => setHistoryExpanded(!historyExpanded)}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center gap-2">
                                {historyExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                                <span className="text-sm font-semibold">
                                    Lịch sử request ({requestHistory.length})
                                </span>
                            </div>
                        </button>

                        {historyExpanded && (
                            <div className="px-3 pb-3 space-y-2">
                                {requestHistory.map((req, index) => (
                                    <RequestHistoryItem
                                        key={index}
                                        request={req}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// Request History Item Component
function RequestHistoryItem({ request }: { request: RequestHistory }) {
    const [payloadOpen, setPayloadOpen] = useState(false);
    const [responseOpen, setResponseOpen] = useState(false);

    const statusColor =
        request.statusCode >= 200 && request.statusCode < 300
            ? "text-green-600"
            : "text-red-600";

    return (
        <div className="border rounded-lg bg-gray-50">
            {/* Header */}
            <div className="p-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{request.method}</span>
                    <span className={`font-semibold ${statusColor}`}>
                        {request.statusCode}
                    </span>
                    <span className="text-gray-600">
                        {request.responseTime}ms
                    </span>
                </div>
            </div>

            {/* URL */}
            <div className="px-2 pb-2 text-xs text-gray-600 truncate">
                {request.url}
            </div>

            {/* Payload */}
            <Collapsible open={payloadOpen} onOpenChange={setPayloadOpen}>
                <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-1 text-xs text-left hover:bg-gray-100 border-t">
                    {payloadOpen ? (
                        <ChevronDown className="w-3 h-3" />
                    ) : (
                        <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="font-medium">
                        Payload ({Object.keys(request.payload).length} params)
                    </span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <pre className="text-xs bg-white p-2 m-2 rounded overflow-auto max-h-[150px]">
                        {JSON.stringify(request.payload, null, 2)}
                    </pre>
                </CollapsibleContent>
            </Collapsible>

            {/* Response */}
            <Collapsible open={responseOpen} onOpenChange={setResponseOpen}>
                <CollapsibleTrigger className="w-full flex items-center gap-2 px-2 py-1 text-xs text-left hover:bg-gray-100 border-t">
                    {responseOpen ? (
                        <ChevronDown className="w-3 h-3" />
                    ) : (
                        <ChevronRight className="w-3 h-3" />
                    )}
                    <span className="font-medium">Response Preview</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <pre className="text-xs bg-white p-2 m-2 rounded overflow-auto max-h-[200px]">
                        {JSON.stringify(request.response, null, 2)}
                    </pre>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
