"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Environment {
    id: string;
    name: string;
    host: string;
    dmn: string;
}

interface BaseConfigProps {
    environments: Environment[];
    selectedEnvironment: string;
    onEnvironmentChange: (value: string) => void;
    dmn: string;
    onDmnChange: (value: string) => void;
    userCode: string;
    onUserCodeChange: (value: string) => void;
    pass: string;
    onPassChange: (value: string) => void;
}

export function BaseConfig({
    environments,
    selectedEnvironment,
    onEnvironmentChange,
    dmn,
    onDmnChange,
    userCode,
    onUserCodeChange,
    pass,
    onPassChange,
}: BaseConfigProps) {
    return (
        <div className="border-b pb-3 mb-3 bg-gray-50 -mx-4 px-4 -mt-3 pt-3">
            <div className="grid grid-cols-4 gap-3">
                {/* Environment */}
                <div className="space-y-1.5">
                    <Label htmlFor="environment" className="text-xs font-medium">
                        Môi trường *
                    </Label>
                    <Select value={selectedEnvironment} onValueChange={onEnvironmentChange}>
                        <SelectTrigger id="environment" className="h-9">
                            <SelectValue placeholder="Chọn môi trường" />
                        </SelectTrigger>
                        <SelectContent>
                            {environments.map((env) => (
                                <SelectItem key={env.id} value={env.id}>
                                    {env.name} ({env.dmn})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* DMN */}
                <div className="space-y-1.5">
                    <Label htmlFor="dmn" className="text-xs font-medium">
                        DMN
                    </Label>
                    <Input
                        id="dmn"
                        value={dmn}
                        onChange={(e) => onDmnChange(e.target.value)}
                        placeholder="Để trống = môi trường"
                        className="h-9"
                    />
                </div>

                {/* User Code */}
                <div className="space-y-1.5">
                    <Label htmlFor="user_code" className="text-xs font-medium">
                        User Code
                    </Label>
                    <Input
                        id="user_code"
                        value={userCode}
                        onChange={(e) => onUserCodeChange(e.target.value)}
                        placeholder="Để trống = dmn"
                        className="h-9"
                        autoComplete="off"
                    />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                    <Label htmlFor="pass" className="text-xs font-medium">
                        Password
                    </Label>
                    <Input
                        id="pass"
                        type="password"
                        value={pass}
                        onChange={(e) => onPassChange(e.target.value)}
                        placeholder="Để trống = pass môi trường"
                        className="h-9"
                        autoComplete="new-password"
                    />
                </div>
            </div>
        </div>
    );
}
