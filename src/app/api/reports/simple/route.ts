import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({
            success: true,
            message: "Simple API working",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Simple API error:", error);
        return NextResponse.json(
            { error: "Simple API failed" },
            { status: 500 }
        );
    }
}
