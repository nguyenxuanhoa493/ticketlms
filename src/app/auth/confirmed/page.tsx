import { Suspense } from "react";
import AuthConfirmedClient from "./auth-confirmed-client";

export default function AuthConfirmedPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                            Đang tải...
                        </h3>
                    </div>
                </div>
            }
        >
            <AuthConfirmedClient />
        </Suspense>
    );
}
