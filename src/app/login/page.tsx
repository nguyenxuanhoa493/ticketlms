import type { Metadata } from "next";
import LoginPageClient from "./login-client";
import { AuthDebug } from "@/components/debug/AuthDebug";

export const metadata: Metadata = {
    title: "Đăng nhập - TicketLMS",
    description: "Đăng nhập vào hệ thống quản lý ticket",
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
};

export default function LoginPage() {
    return (
        <div>
            <LoginPageClient />
            {process.env.NODE_ENV === "development" && (
                <div className="fixed bottom-4 right-4 max-w-sm">
                    <AuthDebug />
                </div>
            )}
        </div>
    );
}
