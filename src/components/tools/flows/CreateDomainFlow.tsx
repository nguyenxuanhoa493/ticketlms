"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Check, AlertCircle, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RequestHistoryList } from "@/components/tools/api-runner/RequestHistoryList";
import { useLmsRequest } from "@/hooks/useLmsRequest";

interface DomainGroup {
    value: string;
    name: string;
}

interface CreateDomainFlowProps {
    environmentId: string;
    dmn: string;
    userCode: string;
    password?: string;
}

export function CreateDomainFlow({
    environmentId,
    dmn,
    userCode,
    password,
}: CreateDomainFlowProps) {
    const [step, setStep] = useState<"fetch_groups" | "create_domain">("fetch_groups");
    const [domainGroups, setDomainGroups] = useState<DomainGroup[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>("");
    const [slug, setSlug] = useState<string>("");
    const [result, setResult] = useState<any>(null);
    const [autoLoadAttempted, setAutoLoadAttempted] = useState(false);
    const { toast } = useToast();
    
    // Use common LMS request hook
    const {
        loading,
        requestHistory,
        historyExpanded,
        setHistoryExpanded,
        executeRequest,
    } = useLmsRequest({
        showToast: false, // We'll handle toasts manually for more control
    });

    // Auto-load domain groups on mount if environmentId is available
    React.useEffect(() => {
        if (environmentId && !autoLoadAttempted && step === "fetch_groups") {
            setAutoLoadAttempted(true);
            fetchDomainGroups();
        }
    }, [environmentId, autoLoadAttempted, step]);

    const fetchDomainGroups = async () => {
        setResult(null);

        const result = await executeRequest({
            apiEndpoint: "/api/tools/auto-flow/create-domain",
            requestBody: {
                action: "get_domain_groups",
                environmentId,
                dmn,
                userCode,
                password,
            },
            successMessage: undefined, // We'll show custom message
            errorMessage: "Không thể tải domain groups",
        });

        if (result.success && result.data) {
            const groups = result.data.groups || [];
            
            console.log("[CreateDomainFlow] Setting groups:", groups.length);
            
            setDomainGroups(groups);
            setStep("create_domain");
            
            // Auto-select first domain group
            if (groups.length > 0 && !selectedGroup) {
                setSelectedGroup(groups[0].value);
                console.log("[CreateDomainFlow] Auto-selected first group:", groups[0].value);
            }
            
            toast({
                title: "Thành công",
                description: `Đã tải ${groups.length} domain groups`,
            });
        }
    };

    const createDomain = async () => {
        if (!selectedGroup) {
            toast({
                title: "Lỗi",
                description: "Vui lòng chọn domain group",
                variant: "destructive",
            });
            return;
        }

        if (!slug || slug.trim().length === 0) {
            toast({
                title: "Lỗi",
                description: "Vui lòng nhập slug domain",
                variant: "destructive",
            });
            return;
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            toast({
                title: "Lỗi",
                description: "Slug chỉ được chứa chữ thường, số và dấu gạch ngang",
                variant: "destructive",
            });
            return;
        }

        setResult(null);

        const result = await executeRequest({
            apiEndpoint: "/api/tools/auto-flow/create-domain",
            requestBody: {
                action: "create_domain",
                environmentId,
                dmn,
                userCode,
                password,
                slug,
                domainGroup: selectedGroup,
            },
            successMessage: `Domain "${slug}" đã được tạo thành công!`,
            errorMessage: "Không thể tạo domain",
        });

        if (result.success && result.data) {
            setResult(result.data.result);
            // Reset form
            setSlug("");
            if (domainGroups.length > 0) {
                setSelectedGroup(domainGroups[0].value);
            }
        }
    };

    const reset = () => {
        setStep("fetch_groups");
        setDomainGroups([]);
        setSelectedGroup("");
        setSlug("");
        setResult(null);
        setAutoLoadAttempted(false);
        // Auto-load will trigger again due to useEffect
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column: Steps */}
            <div className="space-y-4">
                {/* Step 1: Fetch Domain Groups */}
                {step === "fetch_groups" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bước 1: Tải danh sách Domain Groups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2 text-blue-600">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm font-medium">
                                    Đang tải domain groups...
                                </span>
                            </div>
                        ) : (
                            <>
                                <p className="text-sm text-gray-600 mb-4">
                                    Domain groups sẽ được tải tự động, hoặc bạn có thể nhấn nút bên dưới để tải lại
                                </p>
                                <Button
                                    onClick={fetchDomainGroups}
                                    disabled={loading}
                                >
                                    Tải lại Domain Groups
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
                )}

                {/* Step 2: Create Domain */}
                {step === "create_domain" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Bước 2: Tạo Domain Mới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Domain Group Selection */}
                        <div className="space-y-2">
                            <Label>Domain Group *</Label>
                            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn domain group..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {domainGroups.map((group) => (
                                        <SelectItem key={group.value} value={group.value}>
                                            {group.name} ({group.value})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">
                                Đã tải {domainGroups.length} domain groups
                            </p>
                        </div>

                        {/* Slug Input */}
                        <div className="space-y-2">
                            <Label>Slug Domain *</Label>
                            <Input
                                placeholder="vd: my-school"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                            />
                            <p className="text-xs text-gray-500">
                                Chỉ chữ thường, số và dấu gạch ngang. VD: my-school
                            </p>
                        </div>

                        {/* Language & Type Info */}
                        <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                            <p className="text-gray-700">
                                <strong>Language:</strong> vn (mặc định)
                            </p>
                            <p className="text-gray-700">
                                <strong>Type:</strong> enterprise (mặc định)
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <Button
                                onClick={createDomain}
                                disabled={loading || !selectedGroup || !slug}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tạo...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Tạo Domain
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={reset} disabled={loading}>
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                )}
            </div>

            {/* Right Column: Response & History */}
            <div className="space-y-4">
                {/* Empty State or Result Display */}
                {!result && requestHistory.length === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="p-12 text-center">
                            <div className="text-gray-400">
                                <Plus className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">
                                    Response và lịch sử request sẽ hiển thị ở đây
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Result Display */}
                {result && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-600">
                            <Check className="w-5 h-5" />
                            Domain đã được tạo thành công
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
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
