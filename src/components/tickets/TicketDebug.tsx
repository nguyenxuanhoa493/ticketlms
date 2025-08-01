import React from "react";

interface TicketDebugProps {
    ticket: any;
    loading: boolean;
    currentUser: any;
}

export function TicketDebug({
    ticket,
    loading,
    currentUser,
}: TicketDebugProps) {
    return (
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded mb-4">
            <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
            <div className="text-sm text-yellow-700 space-y-1">
                <p>Loading: {loading ? "true" : "false"}</p>
                <p>Ticket ID: {ticket?.id || "N/A"}</p>
                <p>Ticket Title: {ticket?.title || "N/A"}</p>
                <p>Created At: {ticket?.created_at || "N/A"}</p>
                <p>
                    Created User:{" "}
                    {ticket?.created_user ? "Available" : "Not available"}
                </p>
                <p>
                    Created User Name:{" "}
                    {ticket?.created_user?.full_name || "N/A"}
                </p>
                <p>
                    Current User: {currentUser ? "Logged in" : "Not logged in"}
                </p>
                <p>User Role: {currentUser?.role || "N/A"}</p>
                <details className="mt-2">
                    <summary className="cursor-pointer">
                        Raw ticket data:
                    </summary>
                    <pre className="mt-2 text-xs bg-yellow-50 p-2 rounded overflow-auto max-h-40">
                        {JSON.stringify(ticket, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
}
