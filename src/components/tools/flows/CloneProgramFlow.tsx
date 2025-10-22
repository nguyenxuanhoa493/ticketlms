"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Play, Copy, CheckCircle2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { JsonViewer } from "@/components/tools/JsonViewer";
import { useLmsRequest } from "@/hooks/useLmsRequest";
import { RequestHistoryList } from "@/components/tools/api-runner/RequestHistoryList";

interface Program {
    iid: number;
    name: string;
    code: string;
    status: string;
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
    const [loadingMessage, setLoadingMessage] = useState<string>("");
    const [programs, setPrograms] = useState<Program[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<number | null>(null);
    const [executionTime, setExecutionTime] = useState<number>(0);
    const [cloneResult, setCloneResult] = useState<any>(null);

    // Status filters
    const [statusApproved, setStatusApproved] = useState(true);
    const [statusQueued, setStatusQueued] = useState(false);

    // Use common LMS request hook for both actions
    const getProgramsRequest = useLmsRequest({ showToast: false });
    const cloneProgramRequest = useLmsRequest({ showToast: false });

    // Combined state for display
    const loading = getProgramsRequest.loading || cloneProgramRequest.loading;
    const requestHistory = [
        ...getProgramsRequest.requestHistory,
        ...cloneProgramRequest.requestHistory,
    ];
    const historyExpanded = getProgramsRequest.historyExpanded || cloneProgramRequest.historyExpanded;
    const setHistoryExpanded = (value: boolean) => {
        getProgramsRequest.setHistoryExpanded(value);
        cloneProgramRequest.setHistoryExpanded(value);
    };

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

        if (!dmn) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập domain",
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

        setLoadingMessage("Đang lấy danh sách chương trình từ contenttlx...");
        setPrograms([]);
        setSelectedProgram(null);
        setCloneResult(null);

        const result = await getProgramsRequest.executeRequest({
            apiEndpoint: "/api/tools/auto-flow/clone-program",
            requestBody: {
                environment_id: environmentId,
                dmn: "contenttlx",
                user_code: userCode || undefined,
                pass: pass || undefined,
                step: "get_programs",
                statuses,
            },
            errorMessage: "Failed to get programs from contenttlx",
        });

        setLoadingMessage("");

        if (result.success && result.data) {
            const programs = result.data.programs || [];
            setPrograms(programs);
            setExecutionTime(result.data.executionTime || 0);

            toast({
                title: "Thành công",
                description: `Tìm thấy ${programs.length} chương trình từ contenttlx`,
            });
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
                description: "Vui lòng nhập domain để clone",
                variant: "destructive",
            });
            return;
        }

        setLoadingMessage(`Đang clone chương trình #${selectedProgram} vào ${dmn}...`);
        setCloneResult(null);

        const result = await cloneProgramRequest.executeRequest({
            apiEndpoint: "/api/tools/auto-flow/clone-program",
            requestBody: {
                environment_id: environmentId,
                dmn: dmn, // Use domain input for cloning
                user_code: userCode || undefined,
                pass: pass || undefined,
                step: "clone",
                program_iid: selectedProgram,
            },
            successMessage: "Clone chương trình thành công",
            errorMessage: "Failed to clone program",
        });

        setLoadingMessage("");

        if (result.success && result.data) {
            setCloneResult(result.data);
            setExecutionTime(result.data.executionTime || 0);
        }
    };

    return (
        <div className="space-y-3">
            {/* Flow Description */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-blue-900">
                        Sao chép chương trình giữa các môi trường. Chọn chương trình từ contenttlx và clone vào domain đích.
                    </p>
                </div>
            </div>

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
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
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
                        <JsonViewer data={cloneResult} maxHeight="200px" />
                    </div>
                )}

                {/* Request History */}
                <RequestHistoryList
                    history={requestHistory}
                    expanded={historyExpanded}
                    onToggle={setHistoryExpanded}
                />
            </div>
        </div>
    );
}
