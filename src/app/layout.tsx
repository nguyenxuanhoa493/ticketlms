import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "TicketLMS - Hệ thống quản lý ticket",
    description: "Hệ thống quản lý ticket và hỗ trợ khách hàng",
    keywords: [
        "ticket management",
        "customer support",
        "help desk",
        "issue tracking",
    ],
    authors: [{ name: "TicketLMS Team" }],
    creator: "TicketLMS",
    publisher: "TicketLMS",
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    metadataBase: new URL(
        process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.vercel.app"
    ),
    alternates: {
        canonical: "/",
    },
    openGraph: {
        title: "TicketLMS - Hệ thống quản lý ticket",
        description: "Hệ thống quản lý ticket và hỗ trợ khách hàng",
        url: "/",
        siteName: "TicketLMS",
        locale: "vi_VN",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "TicketLMS - Hệ thống quản lý ticket",
        description: "Hệ thống quản lý ticket và hỗ trợ khách hàng",
    },
    icons: {
        icon: "/favicon.png",
        shortcut: "/favicon.png",
        apple: "/favicon.png",
    },
    manifest: "/manifest.json",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                suppressHydrationWarning
            >
                <QueryProvider>{children}</QueryProvider>
                <Toaster />
            </body>
        </html>
    );
}
