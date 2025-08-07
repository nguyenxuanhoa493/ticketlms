"use client";

import dynamic from "next/dynamic";

// Dynamic import để tránh hydration error
const LoginForm = dynamic(() => import("@/components/forms/login-form"), {
    ssr: false,
    loading: () => (
        <div className="w-full max-w-md mx-auto">
            <div className="animate-pulse">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="h-8 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-6"></div>
                    <div className="space-y-4">
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        </div>
    ),
});

export default function LoginPageClient() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <LoginForm />
        </div>
    );
}
