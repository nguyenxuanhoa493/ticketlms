import { supabase } from "./supabase";
import { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

export interface AuthUser {
    id: string;
    email: string;
    profile:
        | (Profile & {
              organizations?: {
                  id: string;
                  name: string;
              } | null;
          })
        | null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) return null;

        // Get user profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

        return {
            id: user.id,
            email: user.email!,
            profile: profile || null,
        };
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

export async function checkUserAccess(
    userId: string,
    organizationId: string
): Promise<{
    canAccess: boolean;
    role: UserRole | null;
    profile: Profile | null;
}> {
    try {
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

        if (!profile) {
            return { canAccess: false, role: null, profile: null };
        }

        // Admin có quyền truy cập tất cả
        if (profile.role === "admin") {
            return { canAccess: true, role: profile.role, profile };
        }

        // Manager và User chỉ truy cập org của mình
        const canAccess = profile.organization_id === organizationId;

        return {
            canAccess,
            role: profile.role,
            profile,
        };
    } catch (error) {
        console.error("Error checking user access:", error);
        return { canAccess: false, role: null, profile: null };
    }
}

export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
    const user = await requireAuth();

    if (!user.profile || !allowedRoles.includes(user.profile.role)) {
        throw new Error("Insufficient permissions");
    }

    return user;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw error;
    }
}

// Alias for getCurrentUser to maintain compatibility
export const getUser = getCurrentUser;
