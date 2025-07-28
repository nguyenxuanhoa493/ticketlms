import { Database } from "@/types/database";

type UserRole = Database["public"]["Enums"]["user_role"];
// type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export interface PermissionCheck {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
    canManage: boolean;
}

export function getUserPermissions(
    userRole: UserRole,
    userOrgId: string | null,
    targetOrgId?: string
): PermissionCheck {
    const permissions: PermissionCheck = {
        canRead: false,
        canWrite: false,
        canDelete: false,
        canManage: false,
    };

    switch (userRole) {
        case "admin":
            // Admin có tất cả quyền trên mọi organization
            permissions.canRead = true;
            permissions.canWrite = true;
            permissions.canDelete = true;
            permissions.canManage = true;
            break;

        case "manager":
            // Manager chỉ có quyền trên organization của mình
            const isOwnOrg = !targetOrgId || userOrgId === targetOrgId;
            permissions.canRead = isOwnOrg;
            permissions.canWrite = isOwnOrg;
            permissions.canDelete = false; // Manager không được xóa
            permissions.canManage = isOwnOrg;
            break;

        case "user":
            // User chỉ có quyền đọc và tạo ticket trong org của mình
            const isUserOwnOrg = !targetOrgId || userOrgId === targetOrgId;
            permissions.canRead = isUserOwnOrg;
            permissions.canWrite = isUserOwnOrg; // Chỉ tạo ticket, không sửa user/org
            permissions.canDelete = false;
            permissions.canManage = false;
            break;
    }

    return permissions;
}

export function canManageUsers(userRole: UserRole): boolean {
    // Chỉ admin và manager có thể quản lý users
    return ["admin", "manager"].includes(userRole);
}

export function canManageOrganization(
    userRole: UserRole,
    userOrgId: string | null,
    targetOrgId?: string
): boolean {
    // Chỉ admin có thể quản lý organizations
    return userRole === "admin";
}

export function canManageTickets(
    userRole: UserRole,
    userOrgId: string | null,
    ticketOrgId: string
): boolean {
    if (userRole === "admin") return true;
    if (["manager", "user"].includes(userRole) && userOrgId === ticketOrgId)
        return true;
    return false;
}

export function canAssignTickets(userRole: UserRole): boolean {
    return ["admin", "manager"].includes(userRole);
}

export function getAccessibleOrganizations(
    userRole: UserRole,
    userOrgId: string | null
): "all" | string[] {
    if (userRole === "admin") return "all";
    if (userOrgId) return [userOrgId];
    return [];
}

// Thêm function mới để check quyền tạo user cho manager
export function canCreateUserWithRole(
    userRole: UserRole,
    targetRole: UserRole
): boolean {
    if (userRole === "admin") return true;
    if (userRole === "manager" && targetRole === "user") return true;
    return false;
}

// Check xem user có thể thấy data của organization nào
export function canAccessOrganizationData(
    userRole: UserRole,
    userOrgId: string | null,
    dataOrgId: string | null
): boolean {
    if (userRole === "admin") return true;
    if (userRole === "manager" || userRole === "user") {
        return userOrgId === dataOrgId;
    }
    return false;
}
