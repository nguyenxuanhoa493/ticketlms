"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AutoFlowTree, AutoFolder, AutoFlow } from "@/components/tools/AutoFlowTree";
import { BaseConfig } from "@/components/tools/BaseConfig";
import { CloneProgramFlow } from "@/components/tools/flows/CloneProgramFlow";

interface Environment {
    id: string;
    name: string;
    host: string;
    dmn: string;
}

// Define auto flows structure
const AUTO_FOLDERS: AutoFolder[] = [
    {
        id: "admin",
        name: "Admin",
        flows: [
            {
                id: "clone-program",
                name: "Clone chương trình",
                type: "clone_program",
                description: "Clone chương trình với tất cả dữ liệu",
            },
        ],
    },
];

export default function ApiAutoPage() {
    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [selectedEnvironment, setSelectedEnvironment] = useState<string>("");
    const [dmn, setDmn] = useState<string>("");
    const [userCode, setUserCode] = useState<string>("");
    const [pass, setPass] = useState<string>("");
    const [selectedFlow, setSelectedFlow] = useState<AutoFlow | null>(
        AUTO_FOLDERS[0]?.flows[0] || null
    );

    // Fetch environments
    useEffect(() => {
        fetchEnvironments();
    }, []);

    const fetchEnvironments = async () => {
        try {
            const response = await fetch("/api/tools/environments");
            if (response.ok) {
                const data = await response.json();
                setEnvironments(data.data || []);
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

    // Render flow component based on selection
    const renderFlowComponent = () => {
        if (!selectedFlow) {
            return (
                <div className="text-center text-gray-500 py-12">
                    <p>Vui lòng chọn chức năng từ menu bên trái</p>
                </div>
            );
        }

        switch (selectedFlow.type) {
            case "clone_program":
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
        <div className="flex gap-3 h-[calc(100vh-8rem)]">
            {/* Left Sidebar: Flow Tree */}
            <div className="w-64 flex-shrink-0 border-r bg-white">
                <div className="p-4">
                    <h2 className="text-sm font-semibold text-gray-900 mb-3">
                        Chức năng Auto
                    </h2>
                    <AutoFlowTree
                        folders={AUTO_FOLDERS}
                        selectedFlowId={selectedFlow?.id}
                        onFlowSelect={setSelectedFlow}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 space-y-3 overflow-auto">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">
                        {selectedFlow?.name || "API Auto"}
                    </h1>
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
        </div>
    );
}
