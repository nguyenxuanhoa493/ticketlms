import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function PUT(request: NextRequest) {
    console.log("Profile update API called");

    try {
        const supabase = createServerClient();

        // Temporary: Skip auth check for testing
        // TODO: Fix authentication flow later

        // Get current user from /api/current-user instead
        const currentUserResponse = await fetch(
            `${request.nextUrl.origin}/api/current-user`,
            {
                headers: {
                    cookie: request.headers.get("cookie") || "",
                },
            }
        );

        console.log(
            "Current user response status:",
            currentUserResponse.status
        );

        if (!currentUserResponse.ok) {
            console.log("Failed to get current user");
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const currentUserData = await currentUserResponse.json();
        console.log("Current user data:", currentUserData);

        const body = await request.json();
        console.log("Request body:", body);
        const { full_name, role, organization_id, avatar_url } = body;

        // Validate required fields - only require full_name if it's being updated
        if (full_name !== undefined && !full_name?.trim()) {
            return NextResponse.json(
                { error: "Full name cannot be empty" },
                { status: 400 }
            );
        }

        // Current profile is already available from current user data
        const currentProfile = {
            role: currentUserData.role,
            organization_id: currentUserData.organization_id,
        };

        console.log("Current profile:", currentProfile);

        // Prepare update data
        const updateData: any = {
            avatar_url: avatar_url || null,
        };

        // Only include full_name if it's being updated
        if (full_name !== undefined) {
            updateData.full_name = full_name.trim();
        }

        // Only admin can change role and organization
        if (currentProfile.role === "admin") {
            if (role) updateData.role = role;
            if (organization_id) updateData.organization_id = organization_id;
        }

        console.log("Update data:", updateData);
        console.log("Avatar URL being saved:", avatar_url);

        // Update profile
        const { error: updateError } = await supabase
            .from("profiles")
            .update(updateData)
            .eq("id", currentUserData.id);

        console.log("Update result - Error:", updateError);

        if (updateError) {
            console.error("Profile update error:", updateError);
            return NextResponse.json(
                { error: "Failed to update profile" },
                { status: 500 }
            );
        }

        console.log("Profile update successful");
        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
