"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    PlayCircle,
    Loader2,
    Copy,
    Check,
    AlertCircle,
    Save,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    RotateCcw,
    Search,
} from "lucide-react";
import { ApiEnvironment, ApiRequestTemplate, FolderTreeNode } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { FolderManager } from "@/components/tools/FolderManager";
import { JsonEditor } from "@/components/tools/JsonEditor";
import { useToast } from "@/hooks/use-toast";
import { RequestHistoryList } from "@/components/tools/api-runner/RequestHistoryList";
import { DeleteTemplateButton } from "@/components/tools/api-runner/DeleteTemplateButton";

export default function ApiRunnerPage() {
    const [environments, setEnvironments] = useState<ApiEnvironment[]>([]);
    const [selectedEnvId, setSelectedEnvId] = useState<string>("");
    const [path, setPath] = useState<string>("");
    const [method, setMethod] = useState<string>("POST");
    const [dmn, setDmn] = useState<string>("");
    const [userCode, setUserCode] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [payload, setPayload] = useState<string>("{}");
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [requestHistory, setRequestHistory] = useState<any[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [historyExpanded, setHistoryExpanded] = useState(true);
    const selectedEnv = environments.find((env) => env.id === selectedEnvId);

    // Template states
    const [templates, setTemplates] = useState<ApiRequestTemplate[]>([]);
    const [folders, setFolders] = useState<FolderTreeNode[]>([]);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showLoadDialog, setShowLoadDialog] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const [templateDescription, setTemplateDescription] = useState("");
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [loadedTemplateInfo, setLoadedTemplateInfo] = useState<{ name: string; description: string } | null>(null);
    const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
    const [templateSearchQuery, setTemplateSearchQuery] = useState("");
    const { toast } = useToast();

    // Load environments, templates, and folders
    useEffect(() => {
        fetchEnvironments();
        fetchTemplates();
        fetchFolders();
    }, []);

    // Auto-expand history when executing
    useEffect(() => {
        if (requestHistory.length > 0) {
            setHistoryExpanded(true);
        }
    }, [requestHistory.length]);

    const fetchEnvironments = async () => {
        try {
            const res = await fetch("/api/tools/environments");
            const data = await res.json();
            if (data.success) {
                setEnvironments(data.data);

                // Auto-select STAGING if exists
                const stagingEnv = data.data.find(
                    (env: ApiEnvironment) => env.name.toUpperCase() === "STAGING"
                );
                if (stagingEnv && !selectedEnvId) {
                    setSelectedEnvId(stagingEnv.id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch environments:", err);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch("/api/tools/templates");
            const data = await res.json();
            if (data.success) {
                setTemplates(data.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch templates:", err);
        }
    };

    const fetchFolders = async () => {
        try {
            const res = await fetch("/api/tools/folders");
            const data = await res.json();
            if (data.success) {
                setFolders(data.data.tree || []);
            }
        } catch (err) {
            console.error("Failed to fetch folders:", err);
        }
    };

    // Expand all folders when Load Template dialog opens
    useEffect(() => {
        if (showLoadDialog && folders.length > 0) {
            const getAllFolderIds = (folderList: FolderTreeNode[]): string[] => {
                const ids: string[] = [];
                folderList.forEach(folder => {
                    ids.push(folder.id);
                    if (folder.children && folder.children.length > 0) {
                        ids.push(...getAllFolderIds(folder.children));
                    }
                });
                return ids;
            };
            setExpandedFolders(new Set(getAllFolderIds(folders)));
            setTemplateSearchQuery(""); // Reset search when opening dialog
        }
    }, [showLoadDialog, folders]);

    const handleSaveTemplate = async () => {
        if (!templateName.trim()) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập tên template",
                variant: "destructive",
            });
            return;
        }

        try {
            let parsedPayload = {};
            try {
                parsedPayload = JSON.parse(payload);
            } catch (e) {
                toast({
                    title: "Lỗi",
                    description: "Payload không phải JSON hợp lệ",
                    variant: "destructive",
                });
                return;
            }

            // Check if updating existing template
            const isUpdate = loadedTemplateId !== null;
            const httpMethod = isUpdate ? "PUT" : "POST";
            const requestBody = isUpdate ? {
                id: loadedTemplateId,
                name: templateName,
                description: templateDescription,
                folder_id: selectedFolderId,
                environment_id: selectedEnvId || null,
                path,
                method, // API method (GET/POST/PUT/DELETE)
                payload: parsedPayload,
                dmn,
                user_code: userCode,
                password: password || null,
            } : {
                name: templateName,
                description: templateDescription,
                folder_id: selectedFolderId,
                environment_id: selectedEnvId || null,
                path,
                method, // API method (GET/POST/PUT/DELETE)
                payload: parsedPayload,
                dmn,
                user_code: userCode,
                password: password || null,
            };

            const res = await fetch("/api/tools/templates", {
                method: httpMethod,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestBody),
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Thành công",
                    description: isUpdate ? "Template đã được cập nhật!" : "Template đã được lưu!",
                });
                setShowSaveDialog(false);
                setTemplateName("");
                setTemplateDescription("");
                setSelectedFolderId(null);
                setLoadedTemplateId(null);
                setLoadedTemplateInfo(null);
                fetchTemplates();
                fetchFolders();
            } else {
                toast({
                    title: "Lỗi",
                    description: data.error,
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Lỗi",
                description: "Lỗi khi lưu template: " + (err instanceof Error ? err.message : "Unknown error"),
                variant: "destructive",
            });
        }
    };

    const handleLoadTemplate = (template: ApiRequestTemplate) => {
        setSelectedEnvId(template.environment_id || "");
        setPath(template.path);
        setMethod(template.method);
        setDmn(template.dmn || "");
        setUserCode(template.user_code || "");
        setPassword(template.password || "");
        setPayload(JSON.stringify(template.payload, null, 2));
        
        // Set loaded template ID and info for update
        setLoadedTemplateId(template.id);
        
        if (template.description) {
            setLoadedTemplateInfo({
                name: template.name,
                description: template.description
            });
        } else {
            setLoadedTemplateInfo(null);
        }
        
        setShowLoadDialog(false);
    };

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            const res = await fetch(`/api/tools/templates?id=${templateId}`, {
                method: "DELETE",
            });

            const data = await res.json();

            if (data.success) {
                toast({
                    title: "Thành công",
                    description: "Template đã được xóa",
                });
                fetchTemplates();
                fetchFolders();
            } else {
                toast({
                    title: "Lỗi",
                    description: data.error,
                    variant: "destructive",
                });
            }
        } catch (err) {
            toast({
                title: "Lỗi",
                description: "Lỗi khi xóa template",
                variant: "destructive",
            });
        }
    };

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



    const renderTemplatesByFolder = (): React.ReactNode => {
        // Filter templates by search query
        const filteredTemplates = templates.filter(t => 
            t.name.toLowerCase().includes(templateSearchQuery.toLowerCase())
        );

        // Group templates by folder
        const rootTemplates = filteredTemplates.filter(t => !t.folder_id);
        const folderTemplates = new Map<string, ApiRequestTemplate[]>();
        
        filteredTemplates.forEach(t => {
            if (t.folder_id) {
                if (!folderTemplates.has(t.folder_id)) {
                    folderTemplates.set(t.folder_id, []);
                }
                folderTemplates.get(t.folder_id)!.push(t);
            }
        });

        const renderFolder = (folder: FolderTreeNode, level: number = 0): React.ReactNode => {
            const isExpanded = expandedFolders.has(folder.id);
            const folderTemps = folderTemplates.get(folder.id) || [];
            const hasItems = folder.children.length > 0 || folderTemps.length > 0;

            return (
                <div key={folder.id}>
                    <div
                        className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded cursor-pointer"
                        style={{ paddingLeft: `${level * 16 + 8}px` }}
                        onClick={() => hasItems && toggleFolder(folder.id)}
                    >
                        {hasItems ? (
                            isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )
                        ) : (
                            <div className="w-4" />
                        )}
                        <Folder className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium">{folder.name}</span>
                        <span className="text-xs text-gray-400">({folderTemps.length})</span>
                    </div>

                    {isExpanded && (
                        <>
                            {folder.children.map(child => renderFolder(child, level + 1))}
                            {folderTemps.map(template => (
                                <div
                                    key={template.id}
                                    className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded group"
                                    style={{ paddingLeft: `${(level + 1) * 16 + 24}px` }}
                                >
                                    <File className="w-4 h-4 text-blue-600" />
                                    <span
                                        className="text-sm flex-1 cursor-pointer"
                                        onClick={() => handleLoadTemplate(template)}
                                    >
                                        {template.name}
                                    </span>
                                    <DeleteTemplateButton 
                                        templateId={template.id} 
                                        templateName={template.name}
                                        onDelete={handleDeleteTemplate}
                                    />
                                </div>
                            ))}
                        </>
                    )}
                </div>
            );
        };

        return (
            <div>
                {/* Root templates */}
                {rootTemplates.length > 0 && (
                    <div className="mb-2">
                        <div className="text-xs font-semibold text-gray-500 px-2 py-1">
                            ROOT (không folder)
                        </div>
                        {rootTemplates.map(template => (
                            <div
                                key={template.id}
                                className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 rounded group pl-6"
                            >
                                <File className="w-4 h-4 text-blue-600" />
                                <span
                                    className="text-sm flex-1 cursor-pointer"
                                    onClick={() => handleLoadTemplate(template)}
                                >
                                    {template.name}
                                </span>
                                <DeleteTemplateButton 
                                    templateId={template.id} 
                                    templateName={template.name}
                                    onDelete={handleDeleteTemplate}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Folders */}
                {folders.map(folder => renderFolder(folder))}

                {/* Empty state */}
                {templates.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                        Chưa có template nào
                    </p>
                )}
                {templates.length > 0 && filteredTemplates.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-8">
                        Không tìm thấy template nào phù hợp
                    </p>
                )}
            </div>
        );
    };

    const handleExecute = async () => {
        setLoading(true);
        setIsExecuting(true);
        setError("");
        setResponse(null);
        setRequestHistory([]);

        // Validate
        if (!selectedEnvId) {
            setError("Vui lòng chọn môi trường");
            setLoading(false);
            return;
        }

        if (!path) {
            setError("Vui lòng nhập path");
            setLoading(false);
            return;
        }

        if (!dmn) {
            setError("Vui lòng nhập DMN");
            setLoading(false);
            return;
        }

        // Validate JSON payload
        let parsedPayload = {};
        try {
            parsedPayload = JSON.parse(payload);
        } catch (e) {
            setError("Payload không phải JSON hợp lệ");
            setLoading(false);
            return;
        }

        try {
            // Add initial loading entry to history
            const loginHistoryId = Date.now();
            setRequestHistory([{
                id: loginHistoryId,
                method: "POST",
                url: `${selectedEnv?.host}/user/login`,
                payload: { lname: userCode || dmn },
                statusCode: null,
                responseTime: null,
                response: null,
                timestamp: new Date().toISOString(),
                isLoading: true,
                step: "Đang đăng nhập...",
            }]);

            const startTime = Date.now();
            const res = await fetch("/api/tools/api-runner", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    environmentId: selectedEnvId,
                    path,
                    method,
                    payload: parsedPayload,
                    dmn,
                    userCode: userCode || dmn,
                    password: password || undefined,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setResponse(data.data.response);
                // Map history with unique IDs and completed state
                const mappedHistory = (data.data.requestHistory || []).map((item: any, index: number) => ({
                    ...item,
                    id: Date.now() + index,
                    isLoading: false,
                    isComplete: true,
                }));
                setRequestHistory(mappedHistory);
            } else {
                setError(data.error || "API call failed");
                // Map history with unique IDs and error state
                const mappedHistory = (data.requestHistory || []).map((item: any, index: number) => ({
                    ...item,
                    id: Date.now() + index,
                    isLoading: false,
                    isComplete: true,
                    hasError: item.statusCode !== 200,
                }));
                setRequestHistory(mappedHistory);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Request failed");
        } finally {
            setLoading(false);
            setIsExecuting(false);
        }
    };

    const handleCopyResponse = () => {
        if (response) {
            navigator.clipboard.writeText(JSON.stringify(response, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleFormatPayload = () => {
        try {
            const parsed = JSON.parse(payload);
            setPayload(JSON.stringify(parsed, null, 2));
        } catch (e) {
            // Invalid JSON, do nothing
        }
    };

    const handleResetForm = () => {
        setPath("");
        setMethod("POST");
        setDmn("");
        setUserCode("");
        setPassword("");
        setPayload("{}");
        setResponse(null);
        setError("");
        setRequestHistory([]);
        setLoadedTemplateInfo(null);
        setLoadedTemplateId(null);
        
        // Re-select STAGING environment
        const stagingEnv = environments.find(
            (env: ApiEnvironment) => env.name.toUpperCase() === "STAGING"
        );
        if (stagingEnv) {
            setSelectedEnvId(stagingEnv.id);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Call API</h1>
                    <p className="text-sm text-gray-600">
                        Chạy và test API requests với tự động login
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleResetForm}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Làm mới
                    </Button>
                    <Button
                        onClick={handleExecute}
                        disabled={loading || !selectedEnvId || !path || !dmn}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang thực thi...
                            </>
                        ) : (
                            <>
                                <PlayCircle className="w-4 h-4 mr-2" />
                                Thực thi
                            </>
                        )}
                    </Button>
                    <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <FolderOpen className="w-4 h-4 mr-2" />
                                Tải Template
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[600px] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Chọn Template</DialogTitle>
                            </DialogHeader>
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm template..."
                                    value={templateSearchQuery}
                                    onChange={(e) => setTemplateSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <div className="overflow-y-auto flex-1">
                                {renderTemplatesByFolder()}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showSaveDialog} onOpenChange={(open) => {
                        setShowSaveDialog(open);
                        if (open && loadedTemplateInfo) {
                            // Pre-fill form when updating existing template
                            setTemplateName(loadedTemplateInfo.name);
                            setTemplateDescription(loadedTemplateInfo.description);
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Save className="w-4 h-4 mr-2" />
                                {loadedTemplateId ? "Cập nhật Template" : "Lưu Template"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                            <DialogHeader>
                                <DialogTitle>{loadedTemplateId ? "Cập nhật Template" : "Lưu Template"}</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-[300px_1fr] gap-4 flex-1 overflow-hidden">
                                {/* Left: Folder Manager */}
                                <div className="border-r pr-4 overflow-y-auto">
                                    <FolderManager
                                        folders={folders}
                                        selectedFolderId={selectedFolderId}
                                        onSelectFolder={setSelectedFolderId}
                                        onRefresh={fetchFolders}
                                    />
                                </div>

                                {/* Right: Template Info */}
                                <div className="space-y-4 overflow-y-auto">
                                    <div className="space-y-2">
                                        <Label>Tên Template *</Label>
                                        <Input
                                            placeholder="Ví dụ: Search Users"
                                            value={templateName}
                                            onChange={(e) => setTemplateName(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Mô tả</Label>
                                        <Textarea
                                            placeholder="Mô tả ngắn về template này"
                                            value={templateDescription}
                                            onChange={(e) =>
                                                setTemplateDescription(e.target.value)
                                            }
                                            rows={3}
                                        />
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                                        <h4 className="font-medium text-gray-700">Sẽ lưu:</h4>
                                        <ul className="space-y-1 text-gray-600">
                                            <li>• Environment: {environments.find(e => e.id === selectedEnvId)?.name || "N/A"}</li>
                                            <li>• Path: {path || "N/A"}</li>
                                            <li>• Method: {method}</li>
                                            <li>• DMN: {dmn || "N/A"}</li>
                                            <li>• Payload: {(() => {
                                                try {
                                                    return Object.keys(JSON.parse(payload || "{}")).length + " fields";
                                                } catch {
                                                    return "Invalid JSON";
                                                }
                                            })()}</li>
                                        </ul>
                                    </div>

                                    <div className="flex gap-2 justify-end pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setShowSaveDialog(false);
                                                setTemplateName("");
                                                setTemplateDescription("");
                                                setSelectedFolderId(null);
                                            }}
                                        >
                                            Hủy
                                        </Button>
                                        <Button onClick={handleSaveTemplate}>
                                            <Save className="w-4 h-4 mr-2" />
                                            {loadedTemplateId ? "Cập nhật" : "Lưu Template"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Request Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {/* Left: Request Configuration */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <CardTitle>Request Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-3 space-y-3">
                        {/* Method + Environment (Same Row) */}
                        <div className="grid grid-cols-[auto_1fr] gap-2">
                            {/* Method */}
                            <div className="space-y-2">
                                <Label>Method</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger className="w-[100px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="POST">POST</SelectItem>
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Environment */}
                            <div className="space-y-2">
                                <Label>Môi trường *</Label>
                                <Select
                                    value={selectedEnvId}
                                    onValueChange={setSelectedEnvId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Chọn môi trường..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {environments.length === 0 ? (
                                            <div className="p-4 text-center text-sm text-gray-500">
                                                Chưa có môi trường nào.{" "}
                                                <a
                                                    href="/tools/environments"
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Tạo mới
                                                </a>
                                            </div>
                                        ) : (
                                            environments.map((env) => (
                                                <SelectItem key={env.id} value={env.id}>
                                                    {env.name} - {env.host}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Path */}
                        <div className="space-y-2">
                            <Label>Path *</Label>
                            <Input
                                placeholder="/user/api/search"
                                value={path}
                                onChange={(e) => setPath(e.target.value)}
                            />
                        </div>

        {/* DMN, User Code, Password (Same Row) */}
                        <div className="grid grid-cols-3 gap-2">
                            {/* DMN */}
                            <div className="space-y-2">
                                <Label>DMN *</Label>
                                <Input
                                    placeholder="staging"
                                    value={dmn}
                                    onChange={(e) => setDmn(e.target.value)}
                                />
                            </div>

                            {/* User Code */}
                            <div className="space-y-2">
                                <Label>User Code</Label>
                                <Input
                                    placeholder="(default = DMN)"
                                    value={userCode}
                                    onChange={(e) => setUserCode(e.target.value)}
                                    autoComplete="off"
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    placeholder="(from env)"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        {userCode === "root" && (
                            <p className="text-xs text-amber-600">
                                ⚠️ User = root → Sẽ dùng pass_root từ môi trường
                            </p>
                        )}

                        {/* Template Info */}
                        {loadedTemplateInfo && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <File className="w-3 h-3 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-blue-900">
                                                {loadedTemplateInfo.name}
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-xs text-blue-700 hover:text-blue-900 hover:bg-blue-100"
                                                onClick={() => setLoadedTemplateInfo(null)}
                                            >
                                                Ẩn
                                            </Button>
                                        </div>
                                        <p className="text-xs text-blue-700 mt-1 whitespace-pre-wrap">
                                            {loadedTemplateInfo.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payload */}
                        <div className="space-y-2">
                            <Label>Payload (JSON)</Label>
                            <JsonEditor
                                value={payload}
                                onChange={setPayload}
                                height="300px"
                            />
                        </div>


                    </CardContent>
                </Card>

                {/* Right: Response */}
                <Card>
                    <CardHeader className="p-4 pb-0">
                        <div className="flex items-center justify-between">
                            <CardTitle>Response</CardTitle>
                            {response && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyResponse}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 mr-2" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-3">
                        {/* Request History */}
                        <RequestHistoryList 
                            history={requestHistory}
                            expanded={historyExpanded}
                            onToggle={setHistoryExpanded}
                        />

                        {/* Error Message */}
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-red-900">Error</p>
                                        <p className="text-sm text-red-700 mt-1">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Response Data */}
                        {response && (
                            <JsonEditor
                                value={JSON.stringify(response, null, 2)}
                                onChange={() => {}}
                                height="600px"
                                readOnly
                            />
                        )}

                        {/* Empty State */}
                        {!response && !error && !loading && (
                            <div className="text-center py-12 text-gray-400">
                                <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">
                                    Response sẽ hiển thị ở đây sau khi thực thi
                                </p>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="text-center py-12">
                                <Loader2 className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-spin" />
                                <p className="text-sm text-gray-600">Đang gọi API...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
