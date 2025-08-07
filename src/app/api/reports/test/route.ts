import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-middleware";

export const GET = withAuth(async (request: NextRequest, user, supabase) => {
    try {
        return NextResponse.json({
            success: true,
            message: "Test API working",
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                organization_id: user.organization_id,
            },
        });
    } catch (error) {
        console.error("Test API error:", error);
        return NextResponse.json({ error: "Test API failed" }, { status: 500 });
    }
});
