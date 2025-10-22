"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Settings,
    PlayCircle,
    Server,
    Workflow,
    ChevronDown,
    ChevronRight,
    FileCode,
    FolderOpen,
    Folder,
} from "lucide-react";

interface ToolsSidebarProps {
    userRole: string;
}

interface SubMenuItem {
    id: string;
    name: string;
    href: string;
}

interface SubMenuGroup {
    name: string;
    items: SubMenuItem[];
}

interface MenuItem {
    name: string;
    href: string;
    icon: any;
    roles: string[];
    badge?: string;
    subGroups?: SubMenuGroup[];
}

const navigation: MenuItem[] = [
    {
        name: "Call API",
        href: "/tools/api-runner",
        icon: PlayCircle,
        roles: ["admin"],
    },
    {
        name: "API Auto",
        href: "/tools/api-auto",
        icon: Workflow,
        roles: ["admin"],
        badge: "NEW",
        subGroups: [
            {
                name: "Admin",
                items: [
                    {
                        id: "create-domain",
                        name: "Tạo domain",
                        href: "/tools/api-auto?flow=create-domain",
                    },
                    {
                        id: "clone-program",
                        name: "Clone chương trình",
                        href: "/tools/api-auto?flow=clone-program",
                    },
                ],
            },
        ],
    },
    {
        name: "Cấu hình môi trường",
        href: "/tools/environments",
        icon: Server,
        roles: ["admin"],
    },
];

export function ToolsSidebar({ userRole }: ToolsSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(
        new Set(["API Auto", "Admin"]) // Default expand API Auto and Admin group
    );

    // Filter navigation based on user role
    const filteredNavigation = navigation.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(userRole);
    });

    const toggleExpanded = (itemName: string) => {
        setExpandedItems((prev) => {
            const next = new Set(prev);
            if (next.has(itemName)) {
                next.delete(itemName);
            } else {
                next.add(itemName);
            }
            return next;
        });
    };

    return (
        <div className="w-80 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Settings className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">
                            Tools
                        </h2>
                        <p className="text-xs text-gray-500">
                            Automation & Utilities
                        </p>
                    </div>
                </div>

                <nav className="space-y-1">
                    {filteredNavigation.map((item) => {
                        // Check if any sub-item is active
                        const hasActiveSubItem = item.subGroups?.some((group) =>
                            group.items.some((subItem) => {
                                const [basePath, queryString] =
                                    subItem.href.split("?");
                                const isPathMatch = pathname === basePath;
                                if (!isPathMatch) return false;

                                // Check if query params match
                                if (queryString) {
                                    const params = new URLSearchParams(
                                        queryString
                                    );
                                    for (const [
                                        key,
                                        value,
                                    ] of params.entries()) {
                                        if (searchParams.get(key) !== value)
                                            return false;
                                    }
                                }
                                return true;
                            })
                        );
                        const isActive =
                            (pathname === item.href ||
                                pathname.startsWith(item.href + "/")) &&
                            !hasActiveSubItem;
                        const isExpanded = expandedItems.has(item.name);
                        const Icon = item.icon;
                        const hasSubGroups =
                            item.subGroups && item.subGroups.length > 0;

                        return (
                            <div key={item.name}>
                                {/* Main Menu Item */}
                                <div className="flex items-center relative">
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "group flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex-1 relative",
                                            isActive && !hasSubGroups
                                                ? "bg-blue-50 text-blue-700 shadow-sm"
                                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {/* Active indicator - left border */}
                                        {isActive && !hasSubGroups && (
                                            <span className="absolute left-0 top-1 bottom-1 w-1 bg-blue-600 rounded-r-full" />
                                        )}
                                        <Icon
                                            className={cn(
                                                "w-5 h-5 flex-shrink-0 transition-colors",
                                                isActive && !hasSubGroups
                                                    ? "text-blue-600"
                                                    : "text-gray-400 group-hover:text-gray-600"
                                            )}
                                        />
                                        <span className="flex-1 truncate">
                                            {item.name}
                                        </span>
                                        {item.badge && (
                                            <span className="px-2 py-0.5 text-[10px] font-medium bg-yellow-100 text-yellow-800 rounded-full flex-shrink-0">
                                                {item.badge}
                                            </span>
                                        )}
                                    </Link>

                                    {/* Expand/Collapse Button */}
                                    {hasSubGroups && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleExpanded(item.name);
                                            }}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-gray-500" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Sub Menu Groups */}
                                {hasSubGroups && isExpanded && (
                                    <div className="ml-3 mt-1 space-y-1">
                                        {item.subGroups!.map((group) => {
                                            const isGroupExpanded =
                                                expandedItems.has(group.name);

                                            return (
                                                <div key={group.name}>
                                                    {/* Group Header */}
                                                    <button
                                                        onClick={() =>
                                                            toggleExpanded(
                                                                group.name
                                                            )
                                                        }
                                                        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                                                    >
                                                        {isGroupExpanded ? (
                                                            <ChevronDown className="w-3 h-3 text-gray-500 transition-transform" />
                                                        ) : (
                                                            <ChevronRight className="w-3 h-3 text-gray-500 transition-transform" />
                                                        )}
                                                        {isGroupExpanded ? (
                                                            <FolderOpen className="w-3 h-3 text-blue-500 transition-colors" />
                                                        ) : (
                                                            <Folder className="w-3 h-3 text-blue-500 transition-colors" />
                                                        )}
                                                        <span className="transition-colors">
                                                            {group.name}
                                                        </span>
                                                    </button>

                                                    {/* Group Items */}
                                                    {isGroupExpanded && (
                                                        <div className="ml-6 space-y-1">
                                                            {group.items.map(
                                                                (subItem) => {
                                                                    // Check if current flow matches this sub-item
                                                                    const [
                                                                        basePath,
                                                                        queryString,
                                                                    ] =
                                                                        subItem.href.split(
                                                                            "?"
                                                                        );
                                                                    const isPathMatch =
                                                                        pathname ===
                                                                        basePath;
                                                                    let isSubActive =
                                                                        false;

                                                                    if (
                                                                        isPathMatch &&
                                                                        queryString
                                                                    ) {
                                                                        const params =
                                                                            new URLSearchParams(
                                                                                queryString
                                                                            );
                                                                        let allMatch =
                                                                            true;
                                                                        for (const [
                                                                            key,
                                                                            value,
                                                                        ] of params.entries()) {
                                                                            if (
                                                                                searchParams.get(
                                                                                    key
                                                                                ) !==
                                                                                value
                                                                            ) {
                                                                                allMatch =
                                                                                    false;
                                                                                break;
                                                                            }
                                                                        }
                                                                        isSubActive =
                                                                            allMatch;
                                                                    } else if (
                                                                        isPathMatch &&
                                                                        !queryString
                                                                    ) {
                                                                        isSubActive =
                                                                            true;
                                                                    }

                                                                    return (
                                                                        <Link
                                                                            key={
                                                                                subItem.id
                                                                            }
                                                                            href={
                                                                                subItem.href
                                                                            }
                                                                            className={cn(
                                                                                "flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 relative",
                                                                                isSubActive
                                                                                    ? "bg-blue-50 text-blue-700 font-medium shadow-sm"
                                                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                                            )}
                                                                        >
                                                                            {/* Active indicator - left border */}
                                                                            {isSubActive && (
                                                                                <span className="absolute left-0 top-0.5 bottom-0.5 w-1 bg-blue-600 rounded-r-full" />
                                                                            )}
                                                                            <FileCode
                                                                                className={cn(
                                                                                    "w-4 h-4 flex-shrink-0 transition-colors",
                                                                                    isSubActive
                                                                                        ? "text-blue-600"
                                                                                        : "text-gray-400"
                                                                                )}
                                                                            />
                                                                            <span className="truncate">
                                                                                {
                                                                                    subItem.name
                                                                                }
                                                                            </span>
                                                                        </Link>
                                                                    );
                                                                }
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
