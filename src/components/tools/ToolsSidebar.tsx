"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, PlayCircle, Server } from "lucide-react";

interface ToolsSidebarProps {
    userRole: string;
}

const navigation = [
    {
        name: "Cấu hình môi trường",
        href: "/tools/environments",
        icon: Server,
        roles: ["admin"],
        description: "Quản lý API environments",
        badge: undefined,
    },
    {
        name: "Call API",
        href: "/tools/api-runner",
        icon: PlayCircle,
        roles: ["admin"],
        description: "Chạy API requests",
        badge: undefined,
    },
];

export function ToolsSidebar({ userRole }: ToolsSidebarProps) {
    const pathname = usePathname();

    // Filter navigation based on user role
    const filteredNavigation = navigation.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    return (
        <div className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
                        <p className="text-xs text-gray-500">Automation & Utilities</p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-start gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-5 h-5 mt-0.5 flex-shrink-0",
                                        isActive
                                            ? "text-blue-600"
                                            : "text-gray-400 group-hover:text-gray-600"
                                    )}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="truncate">{item.name}</span>
                                        {item.badge && (
                                            <span className="ml-2 px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                        {item.description}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Helper section */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-900 mb-1">
                            💡 Quick Tip
                        </h3>
                        <p className="text-xs text-blue-700">
                            Cấu hình môi trường để tự động hóa các API calls và testing.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
