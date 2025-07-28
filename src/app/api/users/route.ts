import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();

        // Create server client with service role key for admin operations
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Lấy thông tin user hiện tại từ auth cookie
        const authSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const {
            data: { user },
        } = await authSupabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Lấy profile của user hiện tại
        const { data: currentUserProfile, error: currentProfileError } =
            await supabase
                .from("profiles")
                .select("role, organization_id")
                .eq("id", user.id)
                .single();

        if (currentProfileError) throw currentProfileError;

        // Get profiles với filter theo quyền
        let profilesQuery = supabase.from("profiles").select(
            `
            id,
            full_name,
            role,
            organization_id,
            created_at,
            updated_at,
            avatar_url,
            organizations:organization_id (
              id,
              name
            )
            `
        );

        // Nếu là manager, chỉ thấy users trong organization của mình
        if (currentUserProfile.role === "manager") {
            if (currentUserProfile.organization_id) {
                profilesQuery = profilesQuery.eq(
                    "organization_id",
                    currentUserProfile.organization_id
                );
            } else {
                // Manager không có organization thì không thấy user nào
                return NextResponse.json({ users: [] });
            }
        }
        // Admin thấy tất cả (không filter)

        const { data: profiles, error: profilesError } =
            await profilesQuery.order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        // Get auth users to get emails
        const { data: authData, error: authError } =
            await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        // Combine profile and auth data
        const usersWithEmails =
            profiles?.map((profile) => {
                const authUser = authData.users.find(
                    (u) => u.id === profile.id
                );
                return {
                    ...profile,
                    email: authUser?.email || "Unknown",
                };
            }) || [];

        return NextResponse.json({ users: usersWithEmails });
    } catch (error: any) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch users" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const body = await request.json();
        const { email, password, full_name, role, organization_id } = body;

        // Create server client with service role key
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Lấy thông tin user hiện tại để check quyền
        const authSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const {
            data: { user: currentUser },
        } = await authSupabase.auth.getUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Lấy profile của user hiện tại
        const { data: currentUserProfile, error: currentProfileError } =
            await supabase
                .from("profiles")
                .select("role, organization_id")
                .eq("id", currentUser.id)
                .single();

        if (currentProfileError) throw currentProfileError;

        // Validate permissions
        let finalRole = role;
        let finalOrgId = organization_id;

        if (currentUserProfile.role === "manager") {
            // Manager chỉ có thể tạo user thường trong organization của mình
            finalRole = "user";
            finalOrgId = currentUserProfile.organization_id;
        } else if (currentUserProfile.role !== "admin") {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Create auth user
        const { data: authData, error: authError } =
            await supabase.auth.admin.createUser({
                email: email.trim(),
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: full_name.trim(),
                },
            });

        if (authError) throw authError;

        // Update profile with role and organization
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: full_name.trim(),
                role: finalRole,
                organization_id: finalOrgId || null,
            })
            .eq("id", authData.user.id);

        if (profileError) throw profileError;

        return NextResponse.json({
            success: true,
            message: "User created successfully",
            user: authData.user,
        });
    } catch (error: any) {
        console.error("Error creating user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create user" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const body = await request.json();
        const { id, email, password, full_name, role, organization_id } = body;

        // Create server client with service role key
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Lấy thông tin user hiện tại để check quyền
        const authSupabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                },
            }
        );

        const {
            data: { user: currentUser },
        } = await authSupabase.auth.getUser();

        if (!currentUser) {
            return NextResponse.json(
                { error: "User not authenticated" },
                { status: 401 }
            );
        }

        // Lấy profile của user hiện tại
        const { data: currentUserProfile, error: currentProfileError } =
            await supabase
                .from("profiles")
                .select("role, organization_id")
                .eq("id", currentUser.id)
                .single();

        if (currentProfileError) throw currentProfileError;

        // Validate permissions
        let finalRole = role;
        let finalOrgId = organization_id;

        if (currentUserProfile.role === "manager") {
            // Manager chỉ có thể sửa user trong organization của mình và không đổi role/org
            // Lấy thông tin user đang được sửa
            const { data: targetUser, error: targetUserError } = await supabase
                .from("profiles")
                .select("organization_id, role")
                .eq("id", id)
                .single();

            if (targetUserError) throw targetUserError;

            // Check xem user đang sửa có thuộc organization của manager không
            if (
                targetUser.organization_id !==
                currentUserProfile.organization_id
            ) {
                return NextResponse.json(
                    { error: "Cannot edit users outside your organization" },
                    { status: 403 }
                );
            }

            // Manager không được đổi role và organization
            finalRole = targetUser.role;
            finalOrgId = targetUser.organization_id;
        } else if (currentUserProfile.role !== "admin") {
            return NextResponse.json(
                { error: "Insufficient permissions" },
                { status: 403 }
            );
        }

        // Update profile
        const { error: profileError } = await supabase
            .from("profiles")
            .update({
                full_name: full_name.trim(),
                role: finalRole,
                organization_id: finalOrgId || null,
            })
            .eq("id", id);

        if (profileError) throw profileError;

        // Update auth user email if provided and user has permission
        if (email && currentUserProfile.role === "admin") {
            const { error: emailError } =
                await supabase.auth.admin.updateUserById(id, { email });
            if (emailError) throw emailError;
        }

        // Update password if provided
        if (password) {
            const { error: passwordError } =
                await supabase.auth.admin.updateUserById(id, { password });
            if (passwordError) throw passwordError;
        }

        return NextResponse.json({
            success: true,
            message: "User updated successfully",
        });
    } catch (error: any) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update user" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "User ID is required" },
                { status: 400 }
            );
        }

        // Create server client with service role key
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get() {
                        return undefined;
                    },
                    set() {},
                    remove() {},
                },
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Delete auth user (profile will be deleted by cascade)
        const { error } = await supabase.auth.admin.deleteUser(id);

        if (error) throw error;

        return NextResponse.json({
            success: true,
            message: "User deleted successfully",
        });
    } catch (error: any) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete user" },
            { status: 500 }
        );
    }
}
