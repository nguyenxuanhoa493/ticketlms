"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, Loader2 } from "lucide-react";
import { JsonEditor } from "@/components/tools/JsonEditor";

interface RequestHistoryItem {
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

interface RequestHistoryListProps {
    history: RequestHistoryItem[];
    expanded: boolean;
    onToggle: (expanded: boolean) => void;
}

export function RequestHistoryList({ history, expanded, onToggle }: RequestHistoryListProps) {
    if (history.length === 0) return null;

    return (
        <div className="mb-4">
            <details 
                className="border rounded-lg bg-gray-50"
                open={expanded}
                onToggle={(e) => onToggle(e.currentTarget.open)}
            >
                <summary className="cursor-pointer p-3 font-semibold text-sm text-gray-700 hover:bg-gray-100 rounded-lg flex items-center justify-between">
                    <span>Request History ({history.length})</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </summary>
                <div className="px-3 pb-3 space-y-3">
                    {history.map((req) => (
                        <RequestHistoryItem key={req.id} item={req} />
                    ))}
                </div>
            </details>
        </div>
    );
}

function RequestHistoryItem({ item }: { item: RequestHistoryItem }) {
    return (
        <div
            className={`border rounded-lg p-3 space-y-2 ${
                item.isLoading 
                    ? 'bg-blue-50 border-blue-200' 
                    : item.hasError 
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50'
            }`}
        >
            <div className="flex items-center gap-2 text-sm">
                {item.isLoading ? (
                    <Badge variant="outline" className="bg-blue-100">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {item.step || "Loading"}
                    </Badge>
                ) : (
                    <Badge
                        variant={
                            item.statusCode === 200
                                ? "default"
                                : "destructive"
                        }
                    >
                        {item.statusCode}
                    </Badge>
                )}
                <Badge variant="outline">{item.method}</Badge>
                <span className="text-gray-600 font-mono text-xs truncate flex-1">
                    {item.url}
                </span>
                {!item.isLoading && item.responseTime !== null && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{item.responseTime}ms</span>
                    </div>
                )}
            </div>

            {/* Payload */}
            {!item.isLoading && item.payload && Object.keys(item.payload).length > 0 && (
                <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                        Payload ({Object.keys(item.payload).length} params)
                    </summary>
                    <div className="mt-2">
                        <JsonEditor
                            value={JSON.stringify(item.payload, null, 2)}
                            onChange={() => {}}
                            height="150px"
                            readOnly
                        />
                    </div>
                </details>
            )}

            {/* Response Preview */}
            {!item.isLoading && item.response && (
                <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                        Response Preview
                    </summary>
                    <div className="mt-2">
                        <JsonEditor
                            value={JSON.stringify(item.response, null, 2)}
                            onChange={() => {}}
                            height="200px"
                            readOnly
                        />
                    </div>
                </details>
            )}
        </div>
    );
}
