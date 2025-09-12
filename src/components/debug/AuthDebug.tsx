"use client";

import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browser-client";

export function AuthDebug() {
    const [session, setSession] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = getBrowserClient();

                const {
                    data: { session },
                } = await supabase.auth.getSession();
                const {
                    data: { user },
                } = await supabase.auth.getUser();

                setSession(session);
                setUser(user);
            } catch (error) {
                console.error("Auth debug error:", error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();

        // Listen for auth changes
        const supabase = getBrowserClient();
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event, session);
            setSession(session);
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="p-4 bg-yellow-100 rounded">
                Loading auth debug...
            </div>
        );
    }

    return (
        <div className="p-4 bg-gray-100 rounded text-sm">
            <h3 className="font-bold mb-2">Auth Debug Info:</h3>
            <div className="space-y-2">
                <div>
                    <strong>User:</strong>{" "}
                    {user ? "✅ Logged in" : "❌ Not logged in"}
                </div>
                <div>
                    <strong>Session:</strong>{" "}
                    {session ? "✅ Active" : "❌ No session"}
                </div>
                {user && (
                    <div>
                        <strong>Email:</strong> {user.email}
                    </div>
                )}
                {session && (
                    <div>
                        <strong>Expires:</strong>{" "}
                        {new Date(session.expires_at * 1000).toLocaleString()}
                    </div>
                )}
            </div>
        </div>
    );
}
