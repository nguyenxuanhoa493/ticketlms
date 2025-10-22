"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FlowStepProps {
    title: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function FlowStep({ title, description, children, className = "" }: FlowStepProps) {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
                {description && (
                    <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
            </CardContent>
        </Card>
    );
}
