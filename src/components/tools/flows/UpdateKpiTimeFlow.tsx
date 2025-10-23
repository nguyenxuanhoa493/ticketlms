

"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
    Search,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BaseFlowLayout } from "./BaseFlowLayout";
import { FlowStep } from "./FlowStep";

interface UpdateKpiTimeFlowProps {
    environmentId: string;
    dmn: string;
    userCode: string;
    pass: string;
}

interface QuestionBank {
    iid: string;
    id: string;
    name: string;
}

export function UpdateKpiTimeFlow({
    environmentId,
    dmn,
    userCode,
    pass,
}: UpdateKpiTimeFlowProps) {
    const [searchName, setSearchName] = useState("120");
    const [multiplier, setMultiplier] = useState("3");
    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [requestHistory, setRequestHistory] = useState<any[]>([]);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [processedBanks, setProcessedBanks] = useState(0);
    const [totalBanks, setTotalBanks] = useState(0);
    const [currentBank, setCurrentBank] = useState("");
    const [results, setResults] = useState<{
        total: number;
        updated: number;
        failed: number;
        errors: string[];
    } | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const { toast } = useToast();

    const handleSearch = async () => {
        setLoading(true);
        setLoadingMessage("Đang tìm kiếm question banks...");
        setQuestionBanks([]);
        setResults(null);

        try {
            const response = await fetch("/api/tools/auto-flow/update-kpi-time", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "search_question_banks",
                    environment_id: environmentId,
                    dmn,
                    user_code: userCode,
                    pass,
                    search_name: searchName,
                }),
            });

            const data = await response.json();

            if (data.requestHistory) {
                setRequestHistory(data.requestHistory);
            }

            if (!response.ok || !data.success) {
                toast({
                    title: "Lỗi",
                    description: data.error || "Không thể tìm kiếm question banks",
                    variant: "destructive",
                });
                return;
            }

            const banks = data.data?.questionBanks || [];
            setQuestionBanks(banks);

            toast({
                title: "Thành công",
                description: `Tìm thấy ${banks.length} question banks`,
            });
        } catch (error) {
            console.error("Search error:", error);
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Có lỗi xảy ra",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setLoadingMessage("");
        }
    };

    const handleUpdateAll = async () => {
        if (questionBanks.length === 0) return;

        setUpdating(true);
        setProcessedBanks(0);
        setTotalBanks(questionBanks.length);
        setResults(null);

        let totalUpdated = 0;
        let totalFailed = 0;
        let totalQuestions = 0;
        let allErrors: string[] = [];

        try {
            for (let i = 0; i < questionBanks.length; i++) {
                const bank = questionBanks[i];
                setCurrentBank(bank.name);
                setLoadingMessage(`Đang xử lý ngân hàng ${i + 1}/${questionBanks.length}: ${bank.name}`);

                try {
                    const response = await fetch("/api/tools/auto-flow/update-kpi-time", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            action: "update_single_question_bank",
                            environment_id: environmentId,
                            dmn,
                            user_code: userCode,
                            pass,
                            question_bank_iid: bank.iid,
                            multiplier,
                        }),
                    });

                    const data = await response.json();

                    console.log(`[UpdateKpiTimeFlow] Bank ${i + 1}/${questionBanks.length} response:`, {
                        success: data.success,
                        historyCount: data.requestHistory?.length || 0,
                        questionsProcessed: data.data?.totalQuestions || 0,
                    });

                    if (data.requestHistory) {
                        setRequestHistory(prev => {
                            const newHistory = [...prev, ...data.requestHistory];
                            console.log(`[UpdateKpiTimeFlow] History updated: ${newHistory.length} items`);
                            return newHistory;
                        });
                    }

                    if (data.success) {
                        const bankQuestions = data.data?.totalQuestions || 0;
                        const bankUpdated = data.data?.updatedCount || 0;
                        const bankErrors = data.data?.errors || [];
                        
                        totalQuestions += bankQuestions;
                        totalUpdated += bankUpdated;
                        totalFailed += bankErrors.length;
                        
                        // Collect errors with bank context
                        if (bankErrors.length > 0) {
                            allErrors.push(`[${bank.name}]`);
                            allErrors.push(...bankErrors);
                        }
                    } else {
                        // API call failed
                        const errorMsg = `[${bank.name}] API Error: ${data.error || 'Unknown error'}`;
                        allErrors.push(errorMsg);
                        totalFailed++;
                    }
                } catch (error) {
                    console.error(`Error updating bank ${bank.name}:`, error);
                    const errorMsg = `[${bank.name}] Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
                    allErrors.push(errorMsg);
                    totalFailed++;
                }

                setProcessedBanks(i + 1);
            }

            setResults({
                total: totalQuestions,
                updated: totalUpdated,
                failed: totalFailed,
                errors: allErrors,
            });

            toast({
                title: "Hoàn thành",
                description: `Đã cập nhật ${totalUpdated}/${totalQuestions} questions`,
            });
        } catch (error) {
            console.error("Update error:", error);
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Có lỗi xảy ra",
                variant: "destructive",
            });
        } finally {
            setUpdating(false);
            setLoadingMessage("");
            setCurrentBank("");
        }
    };

    return (
        <BaseFlowLayout
            flowDescription="Tìm kiếm question banks và cập nhật KPI time cho tất cả questions với công thức: kpi_time_mới = (kpi_time_cũ / 1000) × hệ số nhân"
            loadingMessage={loadingMessage}
            requestHistory={requestHistory}
            historyExpanded={historyExpanded}
            onHistoryToggle={setHistoryExpanded}
            emptyStateMessage="Request history sẽ hiển thị ở đây"
            emptyStateIcon={
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            }
            steps={
                <>
                    {/* Step 1: Search Question Banks */}
                    <FlowStep
                        title="Bước 1: Tìm kiếm Question Banks"
                        description=""
                    >
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="searchName">Tên Question Bank</Label>
                                <Input
                                    id="searchName"
                                    value={searchName}
                                    onChange={(e) => setSearchName(e.target.value)}
                                    placeholder="Ví dụ: 120"
                                    disabled={loading || updating}
                                />
                            </div>

                            <Button
                                onClick={handleSearch}
                                disabled={!environmentId || !dmn || !searchName || loading || updating}
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tìm kiếm...
                                    </>
                                ) : (
                                    <>
                                        <Search className="w-4 h-4 mr-2" />
                                        Tìm kiếm Question Banks
                                    </>
                                )}
                            </Button>

                            {(!environmentId || !dmn) && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Vui lòng chọn môi trường và nhập DMN để tiếp tục
                                </p>
                            )}

                            {questionBanks.length > 0 && (
                                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="font-medium">
                                            Tìm thấy {questionBanks.length} question banks
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </FlowStep>

                    {/* Step 2: Update KPI Time */}
                    {questionBanks.length > 0 && (
                        <FlowStep
                            title="Bước 2: Cập nhật KPI Time"
                            description=""
                        >
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="multiplier">Hệ số nhân</Label>
                                    <Input
                                        id="multiplier"
                                        type="number"
                                        step="0.1"
                                        value={multiplier}
                                        onChange={(e) => setMultiplier(e.target.value)}
                                        placeholder="Ví dụ: 3"
                                        disabled={loading || updating}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        KPI time mới = (KPI time cũ / 1000) × {multiplier || "?"}
                                    </p>
                                </div>

                                <Button
                                    onClick={handleUpdateAll}
                                    disabled={loading || updating || !multiplier}
                                    className="w-full"
                                    variant="default"
                                >
                                    {updating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Đang cập nhật...
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-4 h-4 mr-2" />
                                            Cập nhật Tất Cả
                                        </>
                                    )}
                                </Button>

                                {/* Progress */}
                                {updating && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-blue-900">
                                                    Đang xử lý: {processedBanks}/{totalBanks} question banks
                                                </p>
                                                {currentBank && (
                                                    <p className="text-xs text-blue-700 mt-1">
                                                        {currentBank}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Results */}
                                {results && !updating && (
                                    <div className="space-y-2">
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 text-green-700">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span className="font-medium">
                                                    Đã cập nhật: {results.updated}/{results.total} questions
                                                </span>
                                            </div>
                                        </div>

                                        {results.failed > 0 && (
                                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                                <div 
                                                    className="flex items-center justify-between cursor-pointer"
                                                    onClick={() => setShowErrors(!showErrors)}
                                                >
                                                    <div className="flex items-center gap-2 text-red-700">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span className="font-medium">
                                                            Thất bại: {results.failed}
                                                        </span>
                                                    </div>
                                                    <button className="text-xs text-red-600 hover:text-red-800">
                                                        {showErrors ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                                                    </button>
                                                </div>
                                                
                                                {showErrors && results.errors.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-red-200">
                                                        <div className="max-h-60 overflow-y-auto space-y-1">
                                                            {results.errors.map((error, idx) => (
                                                                <div 
                                                                    key={idx}
                                                                    className={`text-xs ${
                                                                        error.startsWith('[') && error.endsWith(']')
                                                                            ? 'font-semibold text-red-800 mt-2'
                                                                            : 'text-red-600 pl-2'
                                                                    }`}
                                                                >
                                                                    {error}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
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
