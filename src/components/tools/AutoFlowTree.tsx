"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FolderOpen, Folder, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AutoFlow {
    id: string;
    name: string;
    type: string;
    description?: string;
}

export interface AutoFolder {
    id: string;
    name: string;
    flows: AutoFlow[];
}

interface AutoFlowTreeProps {
    folders: AutoFolder[];
    selectedFlowId?: string;
    onFlowSelect: (flow: AutoFlow) => void;
}

export function AutoFlowTree({ folders, selectedFlowId, onFlowSelect }: AutoFlowTreeProps) {
    // All folders expanded by default
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
        new Set(folders.map((f) => f.id))
    );

    const toggleFolder = (folderId: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-1">
            {folders.map((folder) => {
                const isExpanded = expandedFolders.has(folder.id);

                return (
                    <div key={folder.id}>
                        {/* Folder Header */}
                        <button
                            onClick={() => toggleFolder(folder.id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            {isExpanded ? (
                                <FolderOpen className="w-4 h-4 text-blue-500" />
                            ) : (
                                <Folder className="w-4 h-4 text-blue-500" />
                            )}
                            <span>{folder.name}</span>
                            <span className="ml-auto text-xs text-gray-400">
                                {folder.flows.length}
                            </span>
                        </button>

                        {/* Flows List */}
                        {isExpanded && (
                            <div className="ml-6 mt-1 space-y-1">
                                {folder.flows.map((flow) => {
                                    const isSelected = selectedFlowId === flow.id;

                                    return (
                                        <button
                                            key={flow.id}
                                            onClick={() => onFlowSelect(flow)}
                                            className={cn(
                                                "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors",
                                                isSelected
                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            <FileCode
                                                className={cn(
                                                    "w-4 h-4 flex-shrink-0",
                                                    isSelected ? "text-blue-600" : "text-gray-400"
                                                )}
                                            />
                                            <div className="flex-1 text-left min-w-0 truncate">
                                                {flow.name}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
