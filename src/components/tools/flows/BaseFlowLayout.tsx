"use client";

import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { RequestHistoryList } from "@/components/tools/api-runner/RequestHistoryList";
import { LmsRequestHistoryItem } from "@/hooks/useLmsRequest";

interface BaseFlowLayoutProps {
    // Flow info
    flowTitle?: string;
    flowDescription?: string;
    flowIcon?: ReactNode;
    
    // Loading state
    loading?: boolean;
    loadingMessage?: string;
    
    // Steps (left column)
    steps: ReactNode;
    
    // Response & History (right column)
    requestHistory: LmsRequestHistoryItem[];
    historyExpanded: boolean;
    onHistoryToggle: (expanded: boolean) => void;
    emptyStateMessage?: string;
    emptyStateIcon?: ReactNode;
    responseContent?: ReactNode;
}

export function BaseFlowLayout({
    flowTitle,
    flowDescription,
    flowIcon,
    loading = false,
    loadingMessage,
    steps,
    requestHistory,
    historyExpanded,
    onHistoryToggle,
    emptyStateMessage = "Response và lịch sử request sẽ hiển thị ở đây",
    emptyStateIcon,
    responseContent,
}: BaseFlowLayoutProps) {
    return (
        <div className="space-y-4">
            {/* Flow Description */}
            {(flowTitle || flowDescription) && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r">
                    <div className="flex items-start gap-2">
                        {flowIcon || (
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        <div className="flex-1">
                            {flowTitle && (
                                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                                    {flowTitle}
                                </h3>
                            )}
                            {flowDescription && (
                                <p className="text-sm text-blue-900">
                                    {flowDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Status */}
            {loadingMessage && (
                <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>{loadingMessage}</span>
                </div>
            )}

            {/* Split Screen Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Left Column: Steps */}
                <div className="space-y-4">
                    {steps}
                </div>

                {/* Right Column: Response & History */}
                <div className="space-y-4">
                    {/* Empty State */}
                    {!responseContent && requestHistory.length === 0 && (
                        <Card className="border-dashed">
                            <CardContent className="p-12 text-center">
                                <div className="text-gray-400">
                                    {emptyStateIcon || (
                                        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    )}
                                    <p className="text-sm">
                                        {emptyStateMessage}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Response Content */}
                    {responseContent}

                    {/* Request History */}
                    <RequestHistoryList
                        history={requestHistory}
                        expanded={historyExpanded}
                        onToggle={onHistoryToggle}
                    />
                </div>
            </div>
        </div>
    );
}
