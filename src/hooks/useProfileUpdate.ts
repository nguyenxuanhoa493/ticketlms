import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useProfileUpdate() {
    const queryClient = useQueryClient();

    useEffect(() => {
        // Chỉ chạy trên client side
        if (typeof window === "undefined") return;

        const handleProfileUpdate = () => {
            console.log("[DEBUG] profileUpdated event triggered");
            // Invalidate và refetch current user data và organizations
            queryClient.invalidateQueries({ queryKey: ["currentUser"] });
            queryClient.invalidateQueries({ queryKey: ["organizations"] });
        };

        // Listen for profile update events
        window.addEventListener("profileUpdated", handleProfileUpdate);

        return () => {
            window.removeEventListener("profileUpdated", handleProfileUpdate);
        };
    }, [queryClient]);
}
