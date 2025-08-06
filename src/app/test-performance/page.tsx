"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Test API function
const fetchTestData = async (id: string) => {
    console.log(`Fetching test data for ID: ${id}`);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return { id, timestamp: Date.now(), data: `Test data for ${id}` };
};

export default function TestPerformancePage() {
    const [currentId, setCurrentId] = useState("1");
    const [queryCount, setQueryCount] = useState(0);

    const { data, isLoading, error, isFetching } = useQuery({
        queryKey: ["test-data", currentId],
        queryFn: () => fetchTestData(currentId),
        staleTime: 5 * 60 * 1000, // 5 phút
        gcTime: 10 * 60 * 1000, // 10 phút
    });

    const handleIdChange = (id: string) => {
        setCurrentId(id);
        setQueryCount((prev) => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Performance Test</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Controls</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Current ID: {currentId}
                                    </p>
                                    <div className="flex gap-2">
                                        {["1", "2", "3", "4", "5"].map((id) => (
                                            <Button
                                                key={id}
                                                variant={
                                                    currentId === id
                                                        ? "default"
                                                        : "outline"
                                                }
                                                onClick={() =>
                                                    handleIdChange(id)
                                                }
                                            >
                                                ID {id}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Query Count: {queryCount}
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={() => setQueryCount(0)}
                                    >
                                        Reset Counter
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Query Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            isLoading
                                                ? "bg-blue-500"
                                                : "bg-green-500"
                                        }`}
                                    ></div>
                                    <span>
                                        Loading: {isLoading ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            isFetching
                                                ? "bg-yellow-500"
                                                : "bg-gray-300"
                                        }`}
                                    ></div>
                                    <span>
                                        Fetching: {isFetching ? "Yes" : "No"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-3 h-3 rounded-full ${
                                            error ? "bg-red-500" : "bg-gray-300"
                                        }`}
                                    ></div>
                                    <span>Error: {error ? "Yes" : "No"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Query Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-2 text-gray-600">Loading...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8">
                                <div className="text-red-600 text-2xl mb-2">
                                    ⚠️
                                </div>
                                <p className="text-red-600">
                                    Error: {error.message}
                                </p>
                            </div>
                        ) : data ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded">
                                    <h3 className="font-semibold mb-2">
                                        Current Data:
                                    </h3>
                                    <pre className="text-sm overflow-auto">
                                        {JSON.stringify(data, null, 2)}
                                    </pre>
                                </div>

                                <div className="text-sm text-gray-600">
                                    <p>
                                        <strong>Instructions:</strong>
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1">
                                        <li>
                                            Click different ID buttons to test
                                            navigation
                                        </li>
                                        <li>
                                            Watch the query count - it should
                                            only increment for new IDs
                                        </li>
                                        <li>
                                            Return to a previous ID - it should
                                            load instantly from cache
                                        </li>
                                        <li>
                                            Check Network tab to see actual API
                                            calls
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-600">
                                No data available
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="mt-8 text-center">
                    <Button
                        onClick={() => (window.location.href = "/tickets")}
                        variant="outline"
                    >
                        Back to Tickets
                    </Button>
                </div>
            </div>
        </div>
    );
}
