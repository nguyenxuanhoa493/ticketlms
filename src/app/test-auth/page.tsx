"use client";

import { useEffect, useState } from "react";

export default function TestAuthPage() {
    const [authStatus, setAuthStatus] = useState<string>("Checking...");
    const [userData, setUserData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("/api/current-user");
                if (response.ok) {
                    const data = await response.json();
                    setUserData(data);
                    setAuthStatus("Authenticated");
                } else {
                    setError(`Auth failed: ${response.status}`);
                    setAuthStatus("Not authenticated");
                }
            } catch (err) {
                setError(`Error: ${err}`);
                setAuthStatus("Error");
            }
        };

        checkAuth();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Authentication Test</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Status</h2>
                    <p className="text-lg">
                        <span className="font-medium">Authentication:</span>{" "}
                        {authStatus}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-red-800">
                            Error
                        </h2>
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {userData && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-green-800">
                            User Data
                        </h2>
                        <pre className="bg-white p-4 rounded border overflow-auto">
                            {JSON.stringify(userData, null, 2)}
                        </pre>
                    </div>
                )}

                <div className="mt-8">
                    <button
                        onClick={() => (window.location.href = "/login")}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-4"
                    >
                        Go to Login
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        </div>
    );
}
