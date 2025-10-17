"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { BaseConfig } from "@/components/tools/BaseConfig";
import { CloneProgramFlow } from "@/components/tools/flows/CloneProgramFlow";

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

    // Auto-fill DMN when environment changes
    useEffect(() => {
        const env = environments.find((e) => e.id === selectedEnvironment);
        if (env) {
            setDmn(env.dmn);
        }
    }, [selectedEnvironment, environments]);

    // Get flow info based on param
    const getFlowInfo = () => {
        switch (flowParam) {
            case "clone-program":
                return {
                    name: "Clone chương trình",
                    description: "Sao chép chương trình giữa các môi trường",
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
        switch (flowParam) {
            case "clone-program":
                return (
                    <CloneProgramFlow
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
            {/* Header with breadcrumb */}
            <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
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
                <h1 className="text-2xl font-bold text-gray-900">
                    {flowInfo.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    {flowInfo.description}
                </p>
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
