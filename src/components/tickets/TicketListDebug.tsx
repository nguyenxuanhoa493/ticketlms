import React from "react";

interface TicketListDebugProps {
    tickets: any[];
    loading: boolean;
    currentUser: any;
}

export function TicketListDebug({
    tickets,
    loading,
    currentUser,
}: TicketListDebugProps) {
    return (
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded mb-4">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
                <p>Loading: {loading ? "true" : "false"}</p>
                <p>Tickets length: {tickets?.length || 0}</p>
                <p>Current User: {currentUser ? "Logged in" : "Not logged in"}</p>
                <p>User Role: {currentUser?.role || "N/A"}</p>
                <details className="mt-2">
                    <summary className="cursor-pointer">Raw tickets data:</summary>
                    <pre className="mt-2 text-xs bg-yellow-50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(tickets, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
} 