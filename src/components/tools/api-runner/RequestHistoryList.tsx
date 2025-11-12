"use client";

import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Clock, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";

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
    loopIndex?: number;
    loopItem?: any;
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
                <summary className="cursor-pointer p-3 font-semibold text-sm text-gray-700 hover:bg-gray-100 rounded-t-lg flex items-center justify-between">
                    <span>Request History ({history.length})</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </summary>
                <div className="divide-y">
                    {history.map((req) => (
                        <RequestHistoryItem key={req.id} item={req} />
                    ))}
                </div>
            </details>
        </div>
    );
}

function RequestHistoryItem({ item }: { item: RequestHistoryItem }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copiedPayload, setCopiedPayload] = useState(false);
    const [copiedResponse, setCopiedResponse] = useState(false);

    const copyToClipboard = async (text: string, setCopied: (val: boolean) => void) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div
            className={`${
                item.isLoading 
                    ? 'bg-blue-50' 
                    : item.hasError 
                        ? 'bg-red-50'
                        : 'bg-white hover:bg-gray-50'
            }`}
        >
            {/* One-line summary */}
            <div
                className="p-3 cursor-pointer flex items-center gap-2"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                
                {item.isLoading ? (
                    <Badge variant="outline" className="bg-blue-100 flex-shrink-0">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        {item.step || "Loading"}
                    </Badge>
                ) : (
                    <Badge
                        variant={item.statusCode === 200 ? "default" : "destructive"}
                        className="flex-shrink-0"
                    >
                        {item.statusCode}
                    </Badge>
                )}
                
                <Badge variant="outline" className="flex-shrink-0">{item.method}</Badge>
                
                {/* Show loop index if present */}
                {item.loopIndex !== undefined && (
                    <Badge variant="secondary" className="flex-shrink-0 text-xs">
                        #{item.loopIndex + 1}
                    </Badge>
                )}
                
                <span className="text-gray-600 font-mono text-xs truncate flex-1">
                    {item.step || item.url}
                </span>
                
                {!item.isLoading && item.responseTime !== null && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        <span>{item.responseTime}ms</span>
                    </div>
                )}
            </div>

            {/* Expanded details */}
            {isExpanded && !item.isLoading && (
                <div className="px-3 pb-3 space-y-3 border-t bg-gray-50">
                    {/* Loop Item Info */}
                    {item.loopItem !== undefined && (
                        <div className="pt-3">
                            <span className="text-xs font-semibold text-gray-700">Loop Item Data</span>
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                    {JSON.stringify(item.loopItem, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Payload */}
                    {item.payload && Object.keys(item.payload).length > 0 && (
                        <div className={item.loopItem !== undefined ? "" : "pt-3"}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-700">Payload</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(JSON.stringify(item.payload, null, 2), setCopiedPayload);
                                    }}
                                >
                                    {copiedPayload ? (
                                        <><Check className="w-3 h-3 mr-1" /> Copied</>
                                    ) : (
                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                    )}
                                </Button>
                            </div>
                            <div className="border rounded overflow-hidden">
                                <Editor
                                    height="200px"
                                    defaultLanguage="json"
                                    value={JSON.stringify(item.payload, null, 2)}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        fontSize: 12,
                                        lineNumbers: "off",
                                        folding: true,
                                        wordWrap: "on",
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Response */}
                    {item.response && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-700">Response</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(JSON.stringify(item.response, null, 2), setCopiedResponse);
                                    }}
                                >
                                    {copiedResponse ? (
                                        <><Check className="w-3 h-3 mr-1" /> Copied</>
                                    ) : (
                                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                                    )}
                                </Button>
                            </div>
                            <div className="border rounded overflow-hidden">
                                <Editor
                                    height="300px"
                                    defaultLanguage="json"
                                    value={JSON.stringify(item.response, null, 2)}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        fontSize: 12,
                                        lineNumbers: "off",
                                        folding: true,
                                        wordWrap: "on",
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
