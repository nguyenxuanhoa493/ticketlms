"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth";
import type { AuthUser } from "@/lib/auth";
import NotificationDropdown from "@/components/NotificationDropdown";

interface DashboardNavProps {
    user: AuthUser;
}

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: "home" },
    { name: "Tickets", href: "/tickets", icon: "ticket" },
    {
        name: "Đơn vị",
        href: "/organizations",
        icon: "building",
        roles: ["admin"], // Chỉ admin mới thấy
    },
    {
        name: "Người dùng",
        href: "/users",
        icon: "users",
        roles: ["admin", "manager"], // Admin và manager thấy
    },
];

export function DashboardNav({ user }: DashboardNavProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut();
            router.push("/login");
            router.refresh();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const filteredNavigation = navigation.filter((item) => {
        if (!item.roles) return true;
        return user.profile?.role && item.roles.includes(user.profile.role);
    });

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case "home":
                return (
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                );
            case "ticket":
                return (
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14H4a1 1 0 00-1 1v3a2 2 0 002 2h1a2 2 0 002-2v-3a1 1 0 00-1-1H5z"
                        />
                    </svg>
                );
            case "building":
                return (
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                    </svg>
                );
            case "users":
                return (
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo và Navigation */}
                    <div className="flex items-center space-x-8">
                        {/* Logo */}
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-blue-600">
                                TicketLMS
                            </h1>
                        </div>

                        {/* Navigation menu */}
                        <div className="hidden md:flex space-x-1">
                            {filteredNavigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                                            isActive
                                                ? "bg-blue-100 text-blue-700"
                                                : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "mr-2",
                                                isActive
                                                    ? "text-blue-700"
                                                    : "text-gray-400"
                                            )}
                                        >
                                            {getIcon(item.icon)}
                                        </span>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* User menu */}
                    <div className="flex items-center space-x-4">
                        {/* Notifications */}
                        <NotificationDropdown />

                        <div className="relative">
                            <Button
                                variant="ghost"
                                className="flex items-center space-x-3 p-2"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {user.profile?.avatar_url ? (
                                        <img
                                            src={user.profile.avatar_url}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                            onLoad={() =>
                                                console.log(
                                                    "Avatar loaded in navbar:",
                                                    user.profile?.avatar_url
                                                )
                                            }
                                            onError={(e) =>
                                                console.error(
                                                    "Avatar failed to load:",
                                                    user.profile?.avatar_url,
                                                    e
                                                )
                                            }
                                        />
                                    ) : (
                                        <span className="text-sm font-semibold text-blue-700">
                                            {user.profile?.full_name?.charAt(
                                                0
                                            ) ||
                                                user.email
                                                    .charAt(0)
                                                    .toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user.profile?.full_name || "User"}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {user.profile?.role || "user"}
                                        {user.profile?.organizations?.name && (
                                            <span className="text-gray-400">
                                                {" "}
                                                -{" "}
                                                {
                                                    user.profile.organizations
                                                        .name
                                                }
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </Button>

                            {/* Dropdown menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                    {/* Mobile navigation - chỉ hiển thị trên mobile */}
                                    <div className="md:hidden border-b border-gray-200 pb-2 mb-2">
                                        {filteredNavigation.map((item) => {
                                            const isActive =
                                                pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center px-4 py-2 text-sm",
                                                        isActive
                                                            ? "bg-blue-50 text-blue-700"
                                                            : "text-gray-700 hover:bg-gray-50"
                                                    )}
                                                    onClick={() =>
                                                        setDropdownOpen(false)
                                                    }
                                                >
                                                    <span className="mr-3">
                                                        {getIcon(item.icon)}
                                                    </span>
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </div>

                                    {/* User info on mobile */}
                                    <div className="md:hidden px-4 py-2 border-b border-gray-200 mb-2">
                                        <p className="text-sm font-medium text-gray-900">
                                            {user.profile?.full_name || "User"}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">
                                            {user.profile?.role || "user"}
                                            {user.profile?.organizations
                                                ?.name && (
                                                <span className="text-gray-400">
                                                    {" "}
                                                    -{" "}
                                                    {
                                                        user.profile
                                                            .organizations.name
                                                    }
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Profile menu */}
                                    <Link
                                        href="/account/profile"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                            />
                                        </svg>
                                        Thông tin
                                    </Link>

                                    {/* Change Password menu */}
                                    <Link
                                        href="/account/change-password"
                                        onClick={() => setDropdownOpen(false)}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                            />
                                        </svg>
                                        Đổi mật khẩu
                                    </Link>

                                    {/* Divider */}
                                    <div className="border-t border-gray-200 my-1"></div>

                                    {/* Logout button */}
                                    <button
                                        onClick={() => {
                                            setDropdownOpen(false);
                                            handleSignOut();
                                        }}
                                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <svg
                                            className="w-4 h-4 mr-3"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                            />
                                        </svg>
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlay for dropdown on mobile */}
            {dropdownOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-25 z-40"
                    onClick={() => setDropdownOpen(false)}
                />
            )}
        </nav>
    );
}
