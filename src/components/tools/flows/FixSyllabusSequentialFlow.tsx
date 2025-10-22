"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Search,
    Wrench,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useLmsRequest } from "@/hooks/useLmsRequest";
import { BaseFlowLayout } from "./BaseFlowLayout";
import { FlowStep } from "./FlowStep";

interface FixSyllabusSequentialFlowProps {
    environmentId: string;
    dmn: string;
    userCode?: string;
    pass?: string;
}

interface Syllabus {
    id: number; // Database ID for API calls
    iid: number; // LMS internal ID
    name: string;
    code: string;
    status: string;
}

export function FixSyllabusSequentialFlow({
    environmentId,
    dmn,
    userCode,
    pass,
}: FixSyllabusSequentialFlowProps) {
    const { toast } = useToast();
    const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [fixing, setFixing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [processed, setProcessed] = useState(0);
    const [failed, setFailed] = useState<number[]>([]);
    const [historyExpanded, setHistoryExpanded] = useState(true);

    // Use single hook for all requests in this flow
    const lmsRequest = useLmsRequest();
    const { requestHistory } = lmsRequest;

    // Step 1: Search syllabuses
    const handleSearch = async () => {
        setLoading(true);
        setLoadingMessage("Đang tìm kiếm syllabuses...");
        setSyllabuses([]);
        setFailed([]);
        setProcessed(0);
        setProgress(0);

        // Clear previous history
        lmsRequest.reset();

        const result = await lmsRequest.executeRequest({
            apiEndpoint: "/api/tools/auto-flow/fix-syllabus-sequential",
            requestBody: {
                action: "search_syllabuses",
                environment_id: environmentId,
                dmn,
                user_code: userCode || undefined,
                pass: pass || undefined,
            },
            successMessage: "Tìm kiếm syllabuses thành công",
            errorMessage: "Failed to search syllabuses",
        });

        setLoading(false);
        setLoadingMessage("");

        if (result.success && result.data) {
            const fetchedSyllabuses = result.data.syllabuses || [];
            setSyllabuses(fetchedSyllabuses);

            toast({
                title: "Thành công",
                description: `Tìm thấy ${fetchedSyllabuses.length} syllabuses`,
            });
        }
    };

    // Step 2: Fix all syllabuses with progress
    const handleFixAll = async () => {
        if (syllabuses.length === 0) {
            toast({
                title: "Lỗi",
                description: "Chưa có danh sách syllabuses để fix",
                variant: "destructive",
            });
            return;
        }

        setFixing(true);
        setProcessed(0);
        setFailed([]);
        setProgress(0);

        const total = syllabuses.length;
        let successCount = 0;
        const failedIds: number[] = [];

        for (let i = 0; i < syllabuses.length; i++) {
            const syllabus = syllabuses[i];
            setLoadingMessage(
                `Đang fix syllabus ${i + 1}/${total}: ${syllabus.name}...`
            );

            const result = await lmsRequest.executeRequest({
                apiEndpoint: "/api/tools/auto-flow/fix-syllabus-sequential",
                requestBody: {
                    action: "fix_single",
                    environment_id: environmentId,
                    dmn,
                    user_code: userCode || undefined,
                    pass: pass || undefined,
                    syllabusId: syllabus.id,   // Database ID for changeStatus
                    syllabusIid: syllabus.iid, // LMS internal ID for populate
                },
                successMessage: undefined, // Don't show toast for each success
                errorMessage: undefined, // Don't show toast for each error
            });

            if (result.success) {
                successCount++;
            } else {
                failedIds.push(syllabus.id); // Track failed by database ID
            }

            setProcessed(i + 1);
            setProgress(((i + 1) / total) * 100);
        }

        setFixing(false);
        setLoadingMessage("");
        setFailed(failedIds);

        // Show final result
        if (failedIds.length === 0) {
            toast({
                title: "Hoàn thành",
                description: `Đã fix thành công ${successCount}/${total} syllabuses`,
            });
        } else {
            toast({
                title: "Hoàn thành với lỗi",
                description: `Thành công: ${successCount}, Thất bại: ${failedIds.length}`,
                variant: "destructive",
            });
        }
    };

    return (
        <BaseFlowLayout
            flowDescription="Tìm kiếm và fix lỗi tuần tự (sequential learning) cho tất cả syllabuses trong domain."
            loadingMessage={loadingMessage}
            requestHistory={requestHistory}
            historyExpanded={historyExpanded}
            onHistoryToggle={setHistoryExpanded}
            emptyStateMessage="Request history sẽ hiển thị ở đây"
            emptyStateIcon={
                <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
            }
            steps={
                <>
                    {/* Step 1: Search */}
                    <FlowStep
                        title="Bước 1: Tìm kiếm Syllabuses"
                        description="Tìm kiếm tất cả syllabuses với status: approved, done_editing, queued"
                    >
                        <Button
                            onClick={handleSearch}
                            disabled={!environmentId || !dmn || loading || fixing}
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
                                    Tìm kiếm Syllabuses
                                </>
                            )}
                        </Button>
                        
                        {(!environmentId || !dmn) && (
                            <p className="text-sm text-gray-500 mt-2">
                                Vui lòng chọn môi trường và nhập DMN để tiếp tục
                            </p>
                        )}

                        {syllabuses.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="font-medium">
                                        Tìm thấy {syllabuses.length} syllabuses
                                    </span>
                                </div>
                            </div>
                        )}
                    </FlowStep>

                    {/* Step 2: Fix All */}
                    {syllabuses.length > 0 && (
                        <FlowStep
                            title="Bước 2: Fix Lỗi Tuần Tự"
                            description={`Áp dụng sequential settings cho ${syllabuses.length} syllabuses`}
                        >
                            <Button
                                onClick={handleFixAll}
                                disabled={loading || fixing}
                                className="w-full"
                                variant="default"
                            >
                                {fixing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <Wrench className="w-4 h-4 mr-2" />
                                        Fix Tất Cả Syllabuses
                                    </>
                                )}
                            </Button>

                            {/* Progress Bar */}
                            {fixing && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Tiến độ</span>
                                        <span>
                                            {processed}/{syllabuses.length}
                                        </span>
                                    </div>
                                    <Progress
                                        value={progress}
                                        className="h-2"
                                    />
                                </div>
                            )}

                            {/* Results */}
                            {processed > 0 && !fixing && (
                                <div className="space-y-2">
                                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="font-medium">
                                                Đã xử lý:{" "}
                                                {processed - failed.length}/
                                                {processed}
                                            </span>
                                        </div>
                                    </div>

                                    {failed.length > 0 && (
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                            <div className="flex items-center gap-2 text-red-700">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="font-medium">
                                                    Thất bại: {failed.length}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-red-600">
                                                IDs: {failed.join(", ")}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </FlowStep>
                    )}
                </>
            }
        />
    );
}
