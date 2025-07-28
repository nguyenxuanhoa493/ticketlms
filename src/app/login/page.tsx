import type { Metadata } from "next";
import LoginPageClient from "./login-client";

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
    return <LoginPageClient />;
}
