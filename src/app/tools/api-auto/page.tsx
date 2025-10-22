"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BaseConfig } from "@/components/tools/BaseConfig";
import { CloneProgramFlow } from "@/components/tools/flows/CloneProgramFlow";
import { CreateDomainFlow } from "@/components/tools/flows/CreateDomainFlow";
import { FixSyllabusSequentialFlow } from "@/components/tools/flows/FixSyllabusSequentialFlow";

interface Environment {
    id: string;
    name: string;
    host: string;
    dmn: string;
}

export default function ApiAutoPage() {
    const searchParams = useSearchParams();
    const flowParam = searchParams.get("flow") || "clone-program";
    
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
    const [dmn, setDmn] = useState<string>("");
    const [userCode, setUserCode] = useState<string>("");
    const [pass, setPass] = useState<string>("");

    // Fetch environments
    useEffect(() => {
        fetchEnvironments();
    }, []);

    const fetchEnvironments = async () => {
        try {
            const response = await fetch("/api/tools/environments");
            if (response.ok) {
                const data = await response.json();
                const envs = data.data || [];
                setEnvironments(envs);
                
                // Set default to STAGING if available
                const stagingEnv = envs.find((e: Environment) => 
                    e.name.toUpperCase().includes("STAGING")
                );
                if (stagingEnv && !selectedEnvironment) {
                    setSelectedEnvironment(stagingEnv.id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch environments:", error);
        }
    };

    // Auto-fill DMN and userCode based on flow and environment
    useEffect(() => {
        const env = environments.find((e) => e.id === selectedEnvironment);
        
        // Always reset first to ensure change detection
        console.log("[Page] Flow changed to:", flowParam);
        
        if (flowParam === "create-domain") {
            // Create domain flow defaults
            console.log("[Page] Setting defaults for create-domain:", { dmn: "system", userCode: "root" });
            setDmn("system");
            setUserCode("root");
            setPass(""); // Clear password
        } else if (flowParam === "fix-syllabus-sequential") {
            // Fix syllabus flow defaults
            console.log("[Page] Setting defaults for fix-syllabus:", { dmn: env?.dmn || "" });
            setDmn(env?.dmn || "");
            setUserCode("");
            setPass("");
        } else if (flowParam === "clone-program") {
            // Clone program flow defaults
            console.log("[Page] Setting defaults for clone-program:", { dmn: env?.dmn || "" });
            setDmn(env?.dmn || "");
            setUserCode("");
            setPass("");
        } else {
            // Default: use environment dmn
            setDmn(env?.dmn || "");
            setUserCode("");
            setPass("");
        }
    }, [selectedEnvironment, environments, flowParam]);

    // Get flow info based on param
    const getFlowInfo = () => {
        switch (flowParam) {
            case "clone-program":
                return {
                    name: "Clone chương trình",
                    description: "Sao chép chương trình giữa các môi trường",
                    group: "Admin",
                };
            case "create-domain":
                return {
                    name: "Tạo domain",
                    description: "Tạo domain mới trong hệ thống",
                    group: "Admin",
                };
            case "fix-syllabus-sequential":
                return {
                    name: "Fix lỗi tuần tự syllabus",
                    description: "Tìm kiếm và fix sequential learning settings cho syllabuses",
                    group: "Admin",
                };
            default:
                return {
                    name: "Chọn flow",
                    description: "Vui lòng chọn một flow từ menu bên trái",
                    group: "",
                };
        }
    };

    const flowInfo = getFlowInfo();

    // Render flow component based on selection
    const renderFlowComponent = () => {
        // Wait for environment to be selected
        if (!selectedEnvironment) {
            return (
                <div className="text-center text-gray-500 py-12">
                    <p>Đang tải environment...</p>
                </div>
            );
        }

        switch (flowParam) {
            case "clone-program":
                return (
                    <CloneProgramFlow
                        key="clone-program"
                        environmentId={selectedEnvironment}
                        dmn={dmn}
                        userCode={userCode}
                        pass={pass}
                    />
                );
            case "create-domain":
                return (
                    <CreateDomainFlow
                        key="create-domain"
                        environmentId={selectedEnvironment}
                        dmn={dmn}
                        userCode={userCode}
                        password={pass}
                    />
                );
            case "fix-syllabus-sequential":
                return (
                    <FixSyllabusSequentialFlow
                        key="fix-syllabus-sequential"
                        environmentId={selectedEnvironment}
                        dmn={dmn}
                        userCode={userCode}
                        pass={pass}
                    />
                );
            default:
                return (
                    <div className="text-center text-gray-500 py-12">
                        <p>Chức năng này chưa được triển khai</p>
                    </div>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb only */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>API Auto</span>
                {flowInfo.group && (
                    <>
                        <span className="text-gray-400">›</span>
                        <span>{flowInfo.group}</span>
                    </>
                )}
                <span className="text-gray-400">›</span>
                <span className="text-blue-700 font-medium">{flowInfo.name}</span>
            </div>

            {/* Base Config */}
            <Card>
                <CardContent className="p-4 pt-3">
                    <BaseConfig
                        environments={environments}
                        selectedEnvironment={selectedEnvironment}
                        onEnvironmentChange={setSelectedEnvironment}
                        dmn={dmn}
                        onDmnChange={setDmn}
                        userCode={userCode}
                        onUserCodeChange={setUserCode}
                        pass={pass}
                        onPassChange={setPass}
                    />

                    {/* Flow Component */}
                    {renderFlowComponent()}
                </CardContent>
            </Card>
        </div>
    );
}
