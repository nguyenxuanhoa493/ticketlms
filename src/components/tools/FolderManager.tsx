"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Folder,
    FolderPlus,
    Edit2,
    Trash2,
    ChevronRight,
    ChevronDown,
} from "lucide-react";
import { FolderTreeNode } from "@/types";

interface FolderManagerProps {
    folders: FolderTreeNode[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onRefresh: () => void;
}

export function FolderManager({
    folders,
    selectedFolderId,
    onSelectFolder,
    onRefresh,
}: FolderManagerProps) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderDescription, setNewFolderDescription] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [creatingUnder, setCreatingUnder] = useState<string | null>(null);

    const toggleFolder = (folderId: string) => {
        setExpandedFolders((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(folderId)) {
                newSet.delete(folderId);
            } else {
                newSet.add(folderId);
            }
            return newSet;
        });
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) {
            alert("Vui lòng nhập tên thư mục");
            return;
        }

        try {
            const res = await fetch("/api/tools/folders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newFolderName,
                    description: newFolderDescription || null,
                    parent_id: creatingUnder,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setNewFolderName("");
                setNewFolderDescription("");
                setIsCreating(false);
                setCreatingUnder(null);
                onRefresh();
                // Auto-select new folder
                onSelectFolder(data.data.id);
            } else {
                alert("Lỗi: " + data.error);
            }
        } catch (err) {
            alert("Lỗi khi tạo thư mục: " + (err instanceof Error ? err.message : "Unknown"));
        }
    };

    const handleDeleteFolder = async (folderId: string, folderName: string) => {
        if (!confirm(`Xóa thư mục "${folderName}"?`)) return;

        try {
            const res = await fetch(`/api/tools/folders?id=${folderId}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (data.success) {
                onRefresh();
                if (selectedFolderId === folderId) {
                    onSelectFolder(null);
                }
            } else {
                alert("Lỗi: " + data.error);
            }
        } catch (err) {
            alert("Lỗi khi xóa thư mục");
        }
    };

    const renderFolderTree = (
        node: FolderTreeNode,
        level: number = 0
    ): React.ReactNode => {
        const isExpanded = expandedFolders.has(node.id);
        const hasChildren = node.children.length > 0;
        const isSelected = selectedFolderId === node.id;

        return (
            <div key={node.id}>
                <div
                    className={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer group ${
                        isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                    }`}
                    style={{ paddingLeft: `${level * 16 + 8}px` }}
                    onClick={() => {
                        onSelectFolder(node.id);
                        if (hasChildren) {
                            toggleFolder(node.id);
                        }
                    }}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                        )
                    ) : (
                        <div className="w-4" />
                    )}
                    <Folder
                        className={`w-4 h-4 ${
                            isSelected ? "text-blue-600" : "text-yellow-600"
                        }`}
                    />
                    <span
                        className={`text-sm flex-1 ${
                            isSelected ? "font-medium text-blue-900" : "text-gray-700"
                        }`}
                    >
                        {node.name}
                    </span>
                    <span className="text-xs text-gray-400">({node.templateCount})</span>
                    
                    {/* Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCreatingUnder(node.id);
                                setIsCreating(true);
                            }}
                            title="Tạo subfolder"
                        >
                            <FolderPlus className="w-3 h-3 text-green-600" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(node.id, node.name);
                            }}
                            title="Xóa folder"
                        >
                            <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <>{node.children.map((child) => renderFolderTree(child, level + 1))}</>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Thư mục</h3>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setIsCreating(!isCreating);
                        setCreatingUnder(null);
                    }}
                >
                    <FolderPlus className="w-4 h-4" />
                </Button>
            </div>

            {isCreating && (
                <div className="p-3 border rounded-lg bg-gray-50 space-y-2">
                    <Input
                        placeholder="Tên thư mục"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                handleCreateFolder();
                            }
                        }}
                    />
                    <Textarea
                        placeholder="Mô tả (tùy chọn)"
                        value={newFolderDescription}
                        onChange={(e) => setNewFolderDescription(e.target.value)}
                        rows={2}
                        className="text-sm"
                    />
                    {creatingUnder && (
                        <div className="text-xs text-gray-600">
                            Tạo trong:{" "}
                            <span className="font-mono bg-white px-1 rounded">
                                {folders.find(f => f.id === creatingUnder)?.name || "..."}
                            </span>
                        </div>
                    )}
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleCreateFolder}>
                            Tạo
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                setIsCreating(false);
                                setNewFolderName("");
                                setNewFolderDescription("");
                                setCreatingUnder(null);
                            }}
                        >
                            Hủy
                        </Button>
                    </div>
                </div>
            )}

            <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {/* Root option */}
                <div
                    className={`flex items-center gap-2 py-2 px-2 rounded cursor-pointer ${
                        selectedFolderId === null ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                    }`}
                    onClick={() => onSelectFolder(null)}
                >
                    <Folder
                        className={`w-4 h-4 ${
                            selectedFolderId === null ? "text-blue-600" : "text-yellow-600"
                        }`}
                    />
                    <span
                        className={`text-sm flex-1 ${
                            selectedFolderId === null ? "font-medium text-blue-900" : "text-gray-700"
                        }`}
                    >
                        Root (không folder)
                    </span>
                </div>

                {/* Folders */}
                {folders.length > 0 ? (
                    folders.map((folder) => renderFolderTree(folder))
                ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                        Chưa có thư mục nào. Click + để tạo.
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                <strong>Đã chọn:</strong>{" "}
                <span className="font-mono">
                    {selectedFolderId 
                        ? folders.find(f => f.id === selectedFolderId)?.name || "..."
                        : "Root"}
                </span>
            </div>
        </div>
    );
}
