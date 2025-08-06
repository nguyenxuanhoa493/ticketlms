"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestRenderPage() {
    const [count, setCount] = useState(0);
    const [renderCount, setRenderCount] = useState(0);

    // Track render count
    useEffect(() => {
        setRenderCount((prev) => prev + 1);
    });

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Render Test</h1>

                <Card>
                    <CardHeader>
                        <CardTitle>Render Counter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-lg">
                                    <strong>Render Count:</strong> {renderCount}
                                </p>
                                <p className="text-lg">
                                    <strong>State Count:</strong> {count}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => setCount((prev) => prev + 1)}
                                >
                                    Increment Count
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setRenderCount(0)}
                                >
                                    Reset Render Count
                                </Button>
                            </div>

                            <div className="text-sm text-gray-600">
                                <p>
                                    <strong>Instructions:</strong>
                                </p>
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                    <li>
                                        Watch the render count - it should only
                                        increment by 1 per state change
                                    </li>
                                    <li>
                                        If render count increases rapidly
                                        without clicking, there's an infinite
                                        loop
                                    </li>
                                    <li>
                                        Click "Increment Count" to test normal
                                        re-renders
                                    </li>
                                </ul>
                            </div>
                        </div>
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
